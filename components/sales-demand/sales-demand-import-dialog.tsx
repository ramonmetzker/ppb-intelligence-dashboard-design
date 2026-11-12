'use client'

import { useMemo, useState } from 'react'
import { UploadSimple } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { SALES_MONTHS, type SalesDemand, type SalesMonthId } from '@/lib/sales-demand/data'

const MODEL_PATTERN = /^[A-Z]{2}-[A-Z]\d{3}$/
const EXPECTED_HEADERS = ['Model', ...SALES_MONTHS.map((month) => month.label), 'Total']
const number = new Intl.NumberFormat('en-US')
const steps = ['Paste data', 'Review', 'Confirm'] as const

type Step = 1 | 2 | 3

type ParseResult = {
  rows: SalesDemand[]
  errors: string[]
  hasInput: boolean
}

const SAMPLE_TSV = [
  EXPECTED_HEADERS.join('\t'),
  ['SM-S098', '120', '180', '240', '300', '360', '420', '480', '540', '600', '660', '720', '780', '5400'].join('\t'),
  ['SM-A017', '-', '90', '140', '210', '-', '-', '-', '-', '-', '-', '-', '-', '440'].join('\t'),
].join('\n')

function parseSalesDemand(input: string): ParseResult {
  const lines = input.split(/\r?\n/).map((line) => line.trimEnd()).filter((line) => line.trim())
  if (lines.length === 0) return { rows: [], errors: [], hasInput: false }

  const headers = lines[0].split('\t').map((value) => value.trim())
  const errors: string[] = []
  const rows: SalesDemand[] = []
  const seenModels = new Set<string>()

  if (headers.length !== EXPECTED_HEADERS.length || headers.some((header, index) => header.toLowerCase() !== EXPECTED_HEADERS[index].toLowerCase())) {
    errors.push(`Header must be: ${EXPECTED_HEADERS.join(' | ')}`)
    return { rows, errors, hasInput: true }
  }

  lines.slice(1).forEach((line, lineIndex) => {
    const lineNumber = lineIndex + 2
    const cells = line.split('\t').map((value) => value.trim())
    const model = cells[0] ?? ''
    const rowErrors: string[] = []

    if (cells.length !== EXPECTED_HEADERS.length) rowErrors.push('wrong number of columns')
    if (!MODEL_PATTERN.test(model)) rowErrors.push('model must look like SM-A017')
    if (seenModels.has(model)) rowErrors.push('model is duplicated')

    const months = Object.fromEntries(
      SALES_MONTHS.map((month, monthIndex) => {
        const rawValue = cells[monthIndex + 1] ?? ''
        if (rawValue === '' || rawValue === '-') return [month.id, null]
        const value = Number(rawValue.replaceAll(',', ''))
        if (!Number.isFinite(value) || value < 0) {
          rowErrors.push(`${month.label} must be a non-negative number or -`)
          return [month.id, null]
        }
        return [month.id, value]
      }),
    ) as Record<SalesMonthId, number | null>

    const calculatedTotal = Object.values(months).reduce<number>((sum, value) => sum + (value ?? 0), 0)
    const rawTotal = cells[SALES_MONTHS.length + 1] ?? ''
    const providedTotal = Number(rawTotal.replaceAll(',', ''))

    if (!Number.isFinite(providedTotal) || providedTotal < 0) {
      rowErrors.push('Total must be a non-negative number')
    } else if (providedTotal !== calculatedTotal) {
      rowErrors.push(`Total must equal ${number.format(calculatedTotal)}`)
    }

    if (rowErrors.length > 0) {
      errors.push(`Line ${lineNumber}: ${rowErrors.join(', ')}`)
      return
    }

    seenModels.add(model)
    rows.push({
      id: `imported-${model}`,
      model,
      months,
      total: calculatedTotal,
    })
  })

  return { rows, errors, hasInput: true }
}

function StepIndicator({ currentStep }: { currentStep: Step }) {
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Sales demand import steps">
      {steps.map((label, index) => {
        const step = (index + 1) as Step
        const active = step === currentStep
        const complete = step < currentStep
        return (
          <li
            key={label}
            aria-current={active ? 'step' : undefined}
            className={cn(
              'flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium',
              active && 'border-brand/40 bg-brand/10 text-foreground',
              complete && 'border-success/30 bg-success/5 text-foreground',
              !active && !complete && 'border-border text-muted-foreground',
            )}
          >
            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                active && 'bg-brand text-primary-foreground',
                complete && 'bg-success text-primary-foreground',
                !active && !complete && 'bg-muted text-muted-foreground',
              )}
            >
              {step}
            </span>
            <span className="truncate">{label}</span>
          </li>
        )
      })}
    </ol>
  )
}

function ValidationMessage({ result }: { result: ParseResult }) {
  if (!result.hasInput) return null

  if (result.errors.length === 0) {
    return (
      <div className="flex items-center gap-2" aria-live="polite">
        <Badge variant="secondary">{result.rows.length} valid rows</Badge>
        <span className="text-xs text-muted-foreground">Ready to review</span>
      </div>
    )
  }

  return (
    <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
      <p className="font-medium">Fix the validation issues before continuing.</p>
      <ul className="mt-1 flex flex-col gap-1">
        {result.errors.slice(0, 5).map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}
      </ul>
      {result.errors.length > 5 && <p className="mt-1">Showing the first 5 errors.</p>}
    </div>
  )
}

function PreviewTable({ rows }: { rows: SalesDemand[] }) {
  return (
    <div className="max-h-72 overflow-auto rounded-lg border border-border">
      <table className="w-full min-w-[1200px] border-collapse text-left text-xs">
        <caption className="sr-only">Preview of pasted 2027 monthly sales demand</caption>
        <thead className="sticky top-0 bg-muted text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Model</th>
            {SALES_MONTHS.map((month) => (
              <th key={month.id} className="px-3 py-2 text-right font-medium">{month.label}</th>
            ))}
            <th className="px-3 py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.slice(0, 6).map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-2 font-medium text-foreground">{row.model}</td>
              {SALES_MONTHS.map((month) => (
                <td key={month.id} className="px-3 py-2 text-right text-muted-foreground">
                  {row.months[month.id] == null ? '-' : number.format(row.months[month.id] ?? 0)}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-medium text-foreground">{number.format(row.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 6 && <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">Showing 6 of {rows.length} rows.</p>}
    </div>
  )
}

export function SalesDemandImportDialog({ onImport }: { onImport: (rows: SalesDemand[]) => void }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>(1)
  const [input, setInput] = useState('')
  const result = useMemo(() => parseSalesDemand(input), [input])
  const canContinue = result.rows.length > 0 && result.errors.length === 0

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setStep(1)
      setInput('')
    }
    setOpen(nextOpen)
  }

  const importRows = () => {
    if (!canContinue) return
    onImport(result.rows)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button onClick={() => setOpen(true)}>
        <UploadSimple data-icon="inline-start" />
        Import sales demand
      </Button>
      <DialogContent className="w-[calc(100%-2rem)] !max-w-[1100px] overflow-hidden p-0">
        <div className="flex max-h-[calc(100vh-2rem)] flex-col">
          <DialogHeader className="shrink-0 gap-4 border-b border-border px-6 pt-6 pb-5">
            <div>
              <DialogTitle>Import sales demand</DialogTitle>
              <DialogDescription className="mt-1">
                Import the 2027 monthly sales provision copied from Excel.
              </DialogDescription>
            </div>
            <StepIndicator currentStep={step} />
          </DialogHeader>

          <div className="min-h-0 overflow-y-auto px-6 py-5">
            {step === 1 && (
              <section className="flex flex-col gap-4" aria-labelledby="paste-sales-demand-title">
                <div>
                  <h2 id="paste-sales-demand-title" className="text-sm font-semibold text-foreground">Paste Excel data</h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Expected columns: Model, Jan 2027 through Dec 2027, and Total. Use a dash for months without volume.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="sales-demand-tsv" className="text-sm font-medium text-foreground">Excel content</label>
                    <Button variant="ghost" size="sm" onClick={() => setInput(SAMPLE_TSV)}>Use sample</Button>
                  </div>
                  <Textarea
                    id="sales-demand-tsv"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={SAMPLE_TSV}
                    wrap="off"
                    className="min-h-56 resize-y overflow-x-auto whitespace-pre font-mono text-xs leading-5"
                    aria-describedby="sales-demand-tsv-help"
                  />
                  <p id="sales-demand-tsv-help" className="text-xs text-muted-foreground">
                    Paste tab-separated values directly from the spreadsheet. Headers are case-insensitive.
                  </p>
                </div>
                <ValidationMessage result={result} />
              </section>
            )}

            {step === 2 && (
              <section className="flex flex-col gap-4" aria-labelledby="review-sales-demand-title">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 id="review-sales-demand-title" className="text-sm font-semibold text-foreground">Review imported data</h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Confirm the monthly values before importing them into Sales Demand.</p>
                  </div>
                  <Badge variant="secondary">{result.rows.length} rows ready</Badge>
                </div>
                <PreviewTable rows={result.rows} />
              </section>
            )}

            {step === 3 && (
              <section className="flex flex-col gap-4" aria-labelledby="confirm-sales-demand-title">
                <div>
                  <h2 id="confirm-sales-demand-title" className="text-sm font-semibold text-foreground">Confirm import</h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">The validated rows will replace the current mocked Sales Demand data in this view.</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{result.rows.length} rows</Badge>
                    <span className="text-sm text-foreground">ready to import for calendar year 2027</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Monthly totals have been recalculated from the pasted values and validated against the Total column.
                  </p>
                </div>
              </section>
            )}
          </div>

          <DialogFooter className="!mx-0 !mb-0 shrink-0 border-t border-border px-6 py-4">
            <Button variant="ghost" onClick={() => (step === 1 ? setOpen(false) : setStep((step - 1) as Step))}>
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            {step === 1 && <Button onClick={() => setStep(2)} disabled={!canContinue}>Review data</Button>}
            {step === 2 && <Button onClick={() => setStep(3)}>Continue</Button>}
            {step === 3 && <Button onClick={importRows} disabled={!canContinue}>Import sales demand</Button>}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
