'use client'

import { useId, useState, type FormEvent } from 'react'
import { CheckCircle2, CircleX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { ConstraintYear, TargetConstraint, TargetConstraintFormValues } from '@/lib/constraints/data'
import type { Gbm, YesNo } from '@/lib/products/data'
import { effectiveTarget, targetAdjustmentLabel } from '@/lib/constraints/data'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  constraint: TargetConstraint | null
  gbm: Gbm
  year: ConstraintYear
  annualScore: number
  onSubmit: (values: TargetConstraintFormValues) => void
}

type Errors = Partial<Record<'adjustment', string>>

export function TargetConstraintFormDialog({ open, onOpenChange, constraint, gbm, year, annualScore, onSubmit }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:!max-w-xl">
        <TargetConstraintForm
          key={`${constraint?.id ?? 'new'}-${open}-${gbm}-${year}`}
          constraint={constraint}
          gbm={gbm}
          year={year}
          annualScore={annualScore}
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

function TargetConstraintForm({
  constraint,
  gbm,
  year,
  annualScore,
  onCancel,
  onSubmit,
}: Omit<Props, 'open' | 'onOpenChange'> & { onCancel: () => void }) {
  const uid = useId()
  const [adjustmentValue, setAdjustmentValue] = useState(constraint?.adjustmentPct == null ? '' : String(constraint.adjustmentPct))
  const [active, setActive] = useState<YesNo>(constraint?.active ?? 'Y')
  const [errors, setErrors] = useState<Errors>({})
  const parsedAdjustment = Number(adjustmentValue)
  const previewTarget = Number.isFinite(parsedAdjustment) ? effectiveTarget(annualScore, parsedAdjustment) : annualScore

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Errors = {}

    if (!adjustmentValue || !Number.isFinite(parsedAdjustment)) next.adjustment = 'Enter a valid percentage.'
    else if (parsedAdjustment <= -100) next.adjustment = 'Adjustment must keep the target above zero.'
    else if (parsedAdjustment > 1000) next.adjustment = 'Adjustment cannot exceed 1000%.'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSubmit({ adjustmentPct: parsedAdjustment, active })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <SheetHeader className="shrink-0 border-b border-border px-6 py-5 pr-14">
        <SheetTitle>{constraint ? 'Edit target adjustment' : 'New target adjustment'}</SheetTitle>
        <SheetDescription>
          Adjust the GBM annual score target used by simulations for {year}. The original score remains unchanged in Products.
        </SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <ReadOnlyField label="GBM" value={gbm} />
          <ReadOnlyField label="Year" value={year} />
        </div>

        <section className="flex flex-col gap-4 rounded-xl border border-border bg-muted/20 p-4" aria-labelledby={`${uid}-target-title`}>
          <div>
            <h3 id={`${uid}-target-title`} className="text-sm font-semibold text-foreground">Simulation target</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Apply a percentage adjustment to the sum of the selected GBM&apos;s product annual scores.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
            <ReadOnlyField label="Annual score baseline" value={annualScore.toLocaleString('en-US')} />
            <Field id={`${uid}-adjustment`} label="Adjustment" error={errors.adjustment}>
              <div className="relative">
                <Input
                  id={`${uid}-adjustment`}
                  type="number"
                  min="-99.9"
                  max="1000"
                  step="0.1"
                  value={adjustmentValue}
                  aria-invalid={Boolean(errors.adjustment)}
                  onChange={(event) => setAdjustmentValue(event.target.value)}
                  className="pr-8"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">%</span>
              </div>
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-3">
            <div>
              <p className="text-xs text-muted-foreground">Effective target</p>
              <p className="tnum mt-0.5 text-lg font-semibold text-foreground">{previewTarget.toLocaleString('en-US', { maximumFractionDigits: 1 })}</p>
            </div>
            <span className="rounded-md bg-brand-soft px-2 py-1 font-mono text-xs font-semibold text-brand">
              {Number.isFinite(parsedAdjustment) ? targetAdjustmentLabel(parsedAdjustment) : '—'}
            </span>
          </div>
        </section>

        <div className="flex flex-col gap-1.5">
          <span id={`${uid}-active`} className="text-xs font-medium text-foreground">Status</span>
          <ToggleGroup
            value={[active]}
            onValueChange={(values) => values[values.length - 1] && setActive(values[values.length - 1] as YesNo)}
            variant="outline"
            spacing={0}
            aria-labelledby={`${uid}-active`}
            className="w-fit"
          >
            <ToggleGroupItem value="Y" className="min-w-24 data-pressed:bg-brand data-pressed:text-primary-foreground"><CheckCircle2 aria-hidden="true" />Active</ToggleGroupItem>
            <ToggleGroupItem value="N" className="min-w-24 data-pressed:bg-brand data-pressed:text-primary-foreground"><CircleX aria-hidden="true" />Inactive</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <SheetFooter className="shrink-0 border-t border-border bg-muted/30 px-6 py-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{constraint ? 'Save changes' : 'Create adjustment'}</Button>
      </SheetFooter>
    </form>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <div className="flex h-9 items-center rounded-md border border-input bg-muted/35 px-3 text-sm text-muted-foreground">{value}</div>
    </div>
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
