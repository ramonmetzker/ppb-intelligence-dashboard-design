'use client'

import { useEffect, useId, useState, type FormEvent } from 'react'
import useSWR from 'swr'
import { Check, ChevronDown, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { apiFetcher } from '@/lib/api/client'
import type { ApiResponse, MaterialPartNumbersResponse } from '@/lib/api/contracts'
import { type YesNo } from '@/lib/ppb-items/data'
import {
  CONSTRAINT_YEARS,
  DATE_CONSTRAINT_TYPES,
  VOLUME_CONSTRAINT_TYPES,
  VOLUME_UNITS,
  type ConstraintYear,
  type DateConstraintType,
  type MaterialConstraint,
  type MaterialConstraintFormValues,
  type VolumeConstraintType,
  type VolumeUnit,
} from '@/lib/constraints/data'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  constraint: MaterialConstraint | null
  year: ConstraintYear
  constraints: readonly MaterialConstraint[]
  onSubmit: (values: MaterialConstraintFormValues) => void
}

type Errors = Partial<Record<'partNumber' | 'volume' | 'date', string>>

export function MaterialConstraintFormDialog({ open, onOpenChange, constraint, year, constraints, onSubmit }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:!max-w-xl">
        <MaterialConstraintForm
          key={`${constraint?.id ?? 'new'}-${open}-${year}`}
          constraint={constraint}
          year={year}
          constraints={constraints}
          onCancel={() => onOpenChange(false)}
          onSubmit={(values) => {
            onSubmit(values)
            onOpenChange(false)
          }}
        />
      </SheetContent>
    </Sheet>
  )
}

function MaterialConstraintForm({
  constraint,
  year,
  constraints,
  onCancel,
  onSubmit,
}: Pick<Props, 'constraint' | 'year' | 'constraints' | 'onSubmit'> & { onCancel: () => void }) {
  const uid = useId()
  const [partNumber, setPartNumber] = useState(constraint?.partNumber ?? '')
  const [partNumberSearch, setPartNumberSearch] = useState('')
  const [debouncedPartNumberSearch, setDebouncedPartNumberSearch] = useState('')
  const [partNumberOpen, setPartNumberOpen] = useState(false)
  const [volumeType, setVolumeType] = useState<VolumeConstraintType>(constraint?.volumeType ?? 'Maximum')

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedPartNumberSearch(partNumberSearch.trim()), 1000)
    return () => window.clearTimeout(timeout)
  }, [partNumberSearch])

  const partNumberKey = `/api/v1/material-part-numbers?q=${encodeURIComponent(debouncedPartNumberSearch)}&selected=${encodeURIComponent(partNumber)}&limit=8`
  const { data: partNumberResponse, isLoading: partNumberLoading, isValidating: partNumberValidating } = useSWR<ApiResponse<MaterialPartNumbersResponse>>(partNumberKey, apiFetcher)
  const partNumberOptions = partNumberResponse?.data.items ?? []
  const selectedPartNumber = partNumberOptions.find((option) => option.partNumber === partNumber)

  const [volumeValue, setVolumeValue] = useState(constraint?.volumeValue == null ? '' : String(constraint.volumeValue))
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>(constraint?.volumeUnit ?? 'Percentage')
  const [dateType, setDateType] = useState<DateConstraintType>(constraint?.dateType ?? 'No limit')
  const [dateFrom, setDateFrom] = useState(constraint?.dateFrom ?? '')
  const [dateTo, setDateTo] = useState(constraint?.dateTo ?? '')
  const [active, setActive] = useState<YesNo>(constraint?.active ?? 'Y')
  const [errors, setErrors] = useState<Errors>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Errors = {}
    const parsedVolume = Number(volumeValue)

    if (!partNumber) next.partNumber = 'Select a part number.'
    else if (constraints.some((current) => current.id !== constraint?.id && current.partNumber === partNumber && current.year === year)) {
      next.partNumber = 'This part number already has a constraint for this year.'
    }
    if (volumeType !== 'No limit' && (!volumeValue || !Number.isFinite(parsedVolume) || parsedVolume <= 0)) {
      next.volume = 'Enter a value greater than zero.'
    }
    if (volumeUnit === 'Percentage' && parsedVolume > 100) next.volume = 'Percentage cannot exceed 100.'
    if (volumeType !== 'No limit' && volumeUnit === 'Units' && !Number.isInteger(parsedVolume)) next.volume = 'Unit volume must be a whole number.'
    if (dateType !== 'No limit' && !dateFrom) next.date = 'Select the first month.'
    if (dateType === 'Between dates' && !dateTo) next.date = 'Select the ending month.'
    if (dateType === 'Between dates' && dateFrom && dateTo && dateFrom > dateTo) next.date = 'The ending month must be after the first month.'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSubmit({
      partNumber,
      volumeType,
      volumeValue: volumeType === 'No limit' ? null : parsedVolume,
      volumeUnit,
      dateType,
      dateFrom: dateType === 'No limit' ? null : dateFrom,
      dateTo: dateType === 'Between dates' ? dateTo : null,
      active,
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <SheetHeader className="shrink-0 border-b border-border px-6 py-5 pr-14">
        <SheetTitle>{constraint ? 'Edit material constraint' : 'New material constraint'}</SheetTitle>
        <SheetDescription>
          Set the purchasing boundary for one part number in {year}. Percentages are applied to that part number&apos;s annual volume.
        </SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field id={`${uid}-part-number`} label="Part Number" error={errors.partNumber}>
              <Popover open={partNumberOpen} onOpenChange={setPartNumberOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={partNumberOpen}
                      aria-invalid={Boolean(errors.partNumber)}
                      className="h-auto min-h-8 w-full justify-between px-2.5 py-1.5 text-left font-normal"
                    />
                  }
                >
                  <span className="min-w-0 truncate">
                    {selectedPartNumber ? (
                      <><span className="font-mono">{selectedPartNumber.partNumber}</span><span className="ml-2 text-muted-foreground">{selectedPartNumber.description} · {selectedPartNumber.spec}</span></>
                    ) : partNumber ? <span className="font-mono">{partNumber}</span> : <span className="text-muted-foreground">Select a part number</span>}
                  </span>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </PopoverTrigger>
                <PopoverContent align="start" className="w-(--anchor-width) min-w-0 p-0">
                  <Command shouldFilter={false}>
                    <CommandInput value={partNumberSearch} onValueChange={setPartNumberSearch} placeholder="Search part numbers..." />
                    <CommandList className="mt-1 border-t border-border/60 pt-1">
                      {partNumberLoading || partNumberValidating ? <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground"><LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />Searching part numbers...</div> : null}
                      <CommandEmpty>{debouncedPartNumberSearch ? 'No part numbers found.' : 'No part numbers available.'}</CommandEmpty>
                      <CommandGroup>
                        {partNumberOptions.map((option) => (
                          <CommandItem
                            key={option.partNumber}
                            value={option.partNumber}
                            data-checked={partNumber === option.partNumber}
                            onSelect={() => {
                              setPartNumber(option.partNumber)
                              setPartNumberSearch('')
                              setPartNumberOpen(false)
                            }}
                            className="items-start gap-2 px-3 py-2"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block font-mono text-xs font-medium">{option.partNumber}</span>
                              <span className="block truncate text-xs text-muted-foreground">{option.description} · {option.spec}</span>
                            </span>
                            {partNumber === option.partNumber ? <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /> : null}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      {partNumberResponse?.data.hasMore ? <p className="border-t border-border/60 px-3 py-2 text-[11px] text-muted-foreground">Showing the first results. Type a more specific search to find more.</p> : null}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </Field>
          </div>

          <Field id={`${uid}-year`} label="Year">
            <Select value={year} disabled>
              <SelectTrigger id={`${uid}-year`} aria-label="Year"><SelectValue /></SelectTrigger>
              <SelectContent><SelectGroup>{CONSTRAINT_YEARS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectGroup></SelectContent>
            </Select>
          </Field>
        </div>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4" aria-labelledby={`${uid}-volume-title`}>
        <div>
          <h3 id={`${uid}-volume-title`} className="text-sm font-semibold text-foreground">Volume limit</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Choose whether the simulation has a maximum, minimum, or no purchasing boundary.</p>
        </div>
        <ToggleGroup
          value={[volumeType]}
          onValueChange={(values) => values[values.length - 1] && setVolumeType(values[values.length - 1] as VolumeConstraintType)}
          variant="outline"
          spacing={0}
          aria-label="Volume limit type"
          className="w-full sm:w-fit"
        >
          {VOLUME_CONSTRAINT_TYPES.map((option) => <ToggleGroupItem key={option} value={option} className="flex-1 sm:min-w-28">{option}</ToggleGroupItem>)}
        </ToggleGroup>
        {volumeType !== 'No limit' ? (
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
            <Field id={`${uid}-volume`} label="Limit value" error={errors.volume}>
              <Input id={`${uid}-volume`} type="number" min="0" step={volumeUnit === 'Units' ? '1' : '0.1'} value={volumeValue} aria-invalid={Boolean(errors.volume)} onChange={(event) => setVolumeValue(event.target.value)} />
            </Field>
            <Field id={`${uid}-unit`} label="Unit">
              <Select value={volumeUnit} onValueChange={(value) => value && setVolumeUnit(value as VolumeUnit)}>
                <SelectTrigger id={`${uid}-unit`} aria-label="Volume unit"><SelectValue /></SelectTrigger>
                <SelectContent><SelectGroup>{VOLUME_UNITS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectGroup></SelectContent>
              </Select>
            </Field>
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-muted/20 p-4" aria-labelledby={`${uid}-date-title`}>
        <div>
          <h3 id={`${uid}-date-title`} className="text-sm font-semibold text-foreground">Date window</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Use months to limit when the purchasing rule applies during the selected year.</p>
        </div>
        <Select value={dateType} onValueChange={(value) => value && setDateType(value as DateConstraintType)}>
          <SelectTrigger aria-label="Date constraint type"><SelectValue /></SelectTrigger>
          <SelectContent><SelectGroup>{DATE_CONSTRAINT_TYPES.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectGroup></SelectContent>
        </Select>
        {dateType !== 'No limit' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id={`${uid}-date-from`} label={dateType === 'Between dates' ? 'From month' : 'Month'} error={errors.date}>
              <Input id={`${uid}-date-from`} type="month" value={dateFrom} aria-invalid={Boolean(errors.date)} onChange={(event) => setDateFrom(event.target.value)} />
            </Field>
            {dateType === 'Between dates' ? (
              <Field id={`${uid}-date-to`} label="To month">
                <Input id={`${uid}-date-to`} type="month" value={dateTo} aria-invalid={Boolean(errors.date)} onChange={(event) => setDateTo(event.target.value)} />
              </Field>
            ) : null}
          </div>
        ) : null}
        {errors.date ? <p role="alert" className="text-xs text-critical">{errors.date}</p> : null}
      </section>

        <div className="flex flex-col gap-1.5">
          <span id={`${uid}-active`} className="text-xs font-medium text-foreground">Active</span>
          <ToggleGroup value={[active]} onValueChange={(values) => values[values.length - 1] && setActive(values[values.length - 1] as YesNo)} variant="outline" spacing={0} aria-labelledby={`${uid}-active`} className="w-fit">
            <ToggleGroupItem value="Y" className="min-w-20 data-pressed:bg-brand data-pressed:text-primary-foreground">Active</ToggleGroupItem>
            <ToggleGroupItem value="N" className="min-w-20 data-pressed:bg-brand data-pressed:text-primary-foreground">Inactive</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <SheetFooter className="shrink-0 border-t border-border bg-muted/30 px-6 py-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{constraint ? 'Save changes' : 'Create constraint'}</Button>
      </SheetFooter>
    </form>
  )
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-foreground">{label}</label>
      {children}
      {error ? <p role="alert" className="text-xs text-critical">{error}</p> : null}
    </div>
  )
}
