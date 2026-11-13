'use client'

import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import { type PpbItem, type PpbScore, type PpbScoreType, type YesNo } from '@/lib/ppb-items/data'

const SCORE_TYPES: PpbScoreType[] = ['Points', 'Quota %']

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 4) return digits
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`
}

export type PpbScoreFormValues = Omit<PpbScore, 'id'>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  score: PpbScore | null
  scores: readonly PpbScore[]
  items: readonly PpbItem[]
  onSubmit: (values: PpbScoreFormValues) => void
}

type Errors = Partial<Record<keyof PpbScoreFormValues, string>>

export function PpbScoreFormDialog({ open, onOpenChange, score, scores, items, onSubmit }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <PpbScoreForm
          key={`${score?.id ?? 'new'}-${open}`}
          score={score}
          scores={scores}
          items={items}
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

function PpbScoreForm({
  score,
  scores,
  items,
  onCancel,
  onSubmit,
}: Pick<Props, 'score' | 'scores' | 'items' | 'onSubmit'> & { onCancel: () => void }) {
  const uid = useId()
  const [itemId, setItemId] = useState(score?.itemId ?? items[0]?.id ?? '')
  const [scoreValue, setScoreValue] = useState(score ? String(score.score) : '')
  const [type, setType] = useState<PpbScoreType>(score?.type ?? SCORE_TYPES[0])
  const [sedaUsage, setSedaUsage] = useState<YesNo>(score?.sedaUsage ?? 'Y')
  const [autoCount, setAutoCount] = useState<YesNo>(score?.autoCount ?? 'N')
  const [validFrom, setValidFrom] = useState(score?.validFrom ?? '')
  const [validTo, setValidTo] = useState(score?.validTo ?? '2999-12-31')
  const [errors, setErrors] = useState<Errors>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Errors = {}
    const cleanScore = Number(scoreValue)

    if (!itemId) next.itemId = 'Select an item.'
    if (!scoreValue || !Number.isFinite(cleanScore) || cleanScore < 0) next.score = 'Enter a score of zero or greater.'
    const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
    if (!validFrom) next.validFrom = 'Enter a start date.'
    else if (!isIsoDate(validFrom)) next.validFrom = 'Use YYYY-MM-DD.'
    if (!validTo) next.validTo = 'Enter an end date.'
    else if (!isIsoDate(validTo)) next.validTo = 'Use YYYY-MM-DD.'
    if (isIsoDate(validFrom) && isIsoDate(validTo) && validFrom > validTo) next.validTo = 'Valid To must be on or after Valid From.'
    if (scores.some((current) => current.id !== score?.id && current.itemId === itemId && current.validFrom === validFrom)) {
      next.validFrom = 'This item already has a score starting on this date.'
    }

    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSubmit({ itemId, score: cleanScore, type, sedaUsage, autoCount, validFrom, validTo })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <SheetHeader className="shrink-0 border-b border-border px-6 py-5 pr-14">
        <SheetTitle>{score ? 'Edit score' : 'New score'}</SheetTitle>
        <SheetDescription>
          Define the yearly PPB score behavior for an item. Valid To defaults to 2999-12-31.
        </SheetDescription>
      </SheetHeader>

      <div className="grid min-h-0 flex-1 auto-rows-min gap-5 overflow-y-auto px-6 py-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field id={`${uid}-item`} label="Item" error={errors.itemId}>
            <Select value={itemId} onValueChange={(value) => value && setItemId(value)}>
              <SelectTrigger id={`${uid}-item`} className="w-full" aria-label="Item">
                <SelectValue>{items.find((item) => item.id === itemId)?.itemName ?? 'Select an item'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {items.map((item) => <SelectItem key={item.id} value={item.id}>{item.itemName}</SelectItem>)}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field id={`${uid}-score`} label="Score" error={errors.score} hint="Use a percentage value when Type is Quota %.">
          <Input id={`${uid}-score`} type="number" min="0" step="0.01" value={scoreValue} aria-invalid={Boolean(errors.score)} onChange={(event) => setScoreValue(event.target.value)} />
        </Field>
        <OptionField id={`${uid}-type`} label="Type" value={type} options={SCORE_TYPES} onChange={setType} />

        <BooleanField id={`${uid}-seda-usage`} label="SEDA Usage" value={sedaUsage} onChange={setSedaUsage} hint="Whether the item accumulates points for SEDA." />
        <BooleanField id={`${uid}-auto-count`} label="Auto Count" value={autoCount} onChange={setAutoCount} hint="Whether the item always counts 100% independently of calculations." />

        <Field id={`${uid}-valid-from`} label="Valid From" error={errors.validFrom} hint="YYYY-MM-DD">
          <Input
            id={`${uid}-valid-from`}
            type="text"
            inputMode="numeric"
            placeholder="YYYY-MM-DD"
            maxLength={10}
            value={validFrom}
            aria-invalid={Boolean(errors.validFrom)}
            onChange={(event) => setValidFrom(formatDateInput(event.target.value))}
          />
        </Field>
        <Field id={`${uid}-valid-to`} label="Valid To" error={errors.validTo} hint="YYYY-MM-DD">
          <Input
            id={`${uid}-valid-to`}
            type="text"
            inputMode="numeric"
            placeholder="YYYY-MM-DD"
            maxLength={10}
            value={validTo}
            aria-invalid={Boolean(errors.validTo)}
            onChange={(event) => setValidTo(formatDateInput(event.target.value))}
          />
        </Field>
      </div>

      <SheetFooter className="shrink-0 border-t border-border bg-muted/30 px-6 py-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{score ? 'Save changes' : 'Create score'}</Button>
      </SheetFooter>
    </form>
  )
}

function OptionField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: PpbScoreType
  options: readonly PpbScoreType[]
  onChange: (value: PpbScoreType) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span id={id} className="text-xs font-medium text-foreground">{label}</span>
      <ToggleGroup
        value={[value]}
        onValueChange={(values) => values[values.length - 1] && onChange(values[values.length - 1] as PpbScoreType)}
        variant="outline"
        spacing={0}
        aria-labelledby={id}
        className="grid w-full grid-cols-2"
      >
        {options.map((option) => <ToggleGroupItem key={option} value={option} className="min-w-0 data-pressed:bg-brand data-pressed:text-primary-foreground">{option}</ToggleGroupItem>)}
      </ToggleGroup>
    </div>
  )
}

function BooleanField({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string
  label: string
  value: YesNo
  onChange: (value: YesNo) => void
  hint: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span id={id} className="text-xs font-medium text-foreground">{label}</span>
      <ToggleGroup
        value={[value]}
        onValueChange={(values) => values[values.length - 1] && onChange(values[values.length - 1] as YesNo)}
        variant="outline"
        spacing={0}
        aria-labelledby={id}
        className="grid w-full grid-cols-2"
      >
        <ToggleGroupItem value="Y" className="min-w-0 data-pressed:bg-brand data-pressed:text-primary-foreground">Yes</ToggleGroupItem>
        <ToggleGroupItem value="N" className="min-w-0 data-pressed:bg-brand data-pressed:text-primary-foreground">No</ToggleGroupItem>
      </ToggleGroup>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-foreground">{label}</label>
      {children}
      {error ? <p role="alert" className="text-xs text-critical">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
