'use client'

import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { type YesNo } from '@/lib/ppb-items/data'
import { MATERIAL_PRICE_ROWS } from '@/lib/material-price-data'
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
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
      </DialogContent>
    </Dialog>
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
  const materialOptions = Array.from(new Map(MATERIAL_PRICE_ROWS.map((row) => [row.partNumber, row])).values())
  const [partNumber, setPartNumber] = useState(constraint?.partNumber ?? materialOptions[0]?.partNumber ?? '')
  const [volumeType, setVolumeType] = useState<VolumeConstraintType>(constraint?.volumeType ?? 'Maximum')
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

    if (constraints.some((current) => current.id !== constraint?.id && current.partNumber === partNumber && current.year === year)) {
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
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>{constraint ? 'Edit material constraint' : 'New material constraint'}</DialogTitle>
        <DialogDescription>
          Set the purchasing boundary for one part number in {year}. Percentages are applied to that part number&apos;s annual volume.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${uid}-part-number`} label="Part Number" error={errors.partNumber}>
          <Select value={partNumber} onValueChange={(value) => value && setPartNumber(value)}>
            <SelectTrigger id={`${uid}-part-number`} aria-label="Part Number"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>{materialOptions.map((option) => <SelectItem key={option.partNumber} value={option.partNumber}><span className="font-mono">{option.partNumber}</span> · {option.description} · {option.spec}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
        </Field>
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

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{constraint ? 'Save changes' : 'Create constraint'}</Button>
      </DialogFooter>
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
