'use client'

import { useMemo, useState } from 'react'
import { ClipboardText } from '@phosphor-icons/react'
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
import {
  OPEN_ENDED_DATE,
  PRICE_IMPORT_HEADERS,
  parseMaterialPrices,
  ppbItemLabel,
  type MaterialPrice,
  type PriceImportPreview,
  type PriceImportStatus,
} from '@/lib/material-price-data'
import { cn } from '@/lib/utils'

const steps = ['Paste data', 'Review', 'Confirm'] as const
type Step = 1 | 2 | 3

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 })
const sampleRows = [
  ['1108-000750', 'A366/A566', 'UMCP 256x64', 'Memory', '166.30', '1.66', '167.96', '12.09', '180.05', '8.27%', '171.30', '-8.75', '2026-10-01', '2999-12-31', '-0.0194'],
  ['1108-001120', 'EB-BS938', 'Li-ion Cell 5000mAh', 'Battery', '8.00', '0.08', '8.08', '0.58', '8.66', '8.25%', '8.52', '-0.14', '2026-10-01', '2999-12-31', '-0.0004'],
]
const SAMPLE_TSV = [PRICE_IMPORT_HEADERS.join('\t'), ...sampleRows.map((row) => row.join('\t'))].join('\n')

const statusMeta: Record<PriceImportStatus, { label: string; className: string }> = {
  new: { label: 'New current', className: 'bg-success/10 text-success' },
  replace: { label: 'Replaces current', className: 'bg-brand/10 text-brand' },
  same: { label: 'Unchanged', className: 'bg-secondary text-muted-foreground' },
}

function StepIndicator({ currentStep }: { currentStep: Step }) {
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Material price import steps">
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

function ValidationMessage({ result }: { result: PriceImportPreview }) {
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
        {result.errors.slice(0, 5).map((error) => <li key={error}>{error}</li>)}
      </ul>
      {result.errors.length > 5 && <p className="mt-1">Showing the first 5 errors.</p>}
    </div>
  )
}

function PreviewTable({ rows }: { rows: PriceImportPreview['rows'] }) {
  return (
    <div className="max-h-72 overflow-auto rounded-lg border border-border">
      <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
        <caption className="sr-only">Preview of pasted material prices</caption>
        <thead className="sticky top-0 bg-muted text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Part Number</th>
            <th className="px-3 py-2 font-medium">Description</th>
            <th className="px-3 py-2 font-medium">Spec</th>
            <th className="px-3 py-2 font-medium">PPB Item</th>
            <th className="px-3 py-2 text-right font-medium">Landed Price</th>
            <th className="px-3 py-2 text-right font-medium">Local Price</th>
            <th className="px-3 py-2 font-medium">Valid From</th>
            <th className="px-3 py-2 font-medium">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.slice(0, 8).map((row) => (
            <tr key={row.line}>
              <td className="px-3 py-2 font-medium tabular-nums">{row.partNumber}</td>
              <td className="px-3 py-2">{row.description}</td>
              <td className="px-3 py-2">{row.spec}</td>
              <td className="px-3 py-2">{ppbItemLabel(row.ppbItem)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{money.format(row.importedLandedPrice)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{money.format(row.localPrice)}</td>
              <td className="px-3 py-2 tabular-nums">{row.validFrom}</td>
              <td className="px-3 py-2">
                <span className={cn('inline-flex h-5 items-center rounded-sm px-1.5 text-[11px] font-medium', statusMeta[row.status].className)}>
                  {statusMeta[row.status].label}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 8 && <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">Showing 8 of {rows.length} rows.</p>}
    </div>
  )
}

export function MaterialPricesImportDialog({ currentRows, onImport }: { currentRows: readonly MaterialPrice[]; onImport: (preview: PriceImportPreview) => void }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>(1)
  const [input, setInput] = useState('')
  const result = useMemo(() => parseMaterialPrices(input, currentRows), [input, currentRows])
  const canContinue = result.rows.length > 0 && result.errors.length === 0
  const counts = useMemo(() => ({
    added: result.rows.filter((row) => row.status === 'new').length,
    replaced: result.rows.filter((row) => row.status === 'replace').length,
    unchanged: result.rows.filter((row) => row.status === 'same').length,
  }), [result.rows])

  const reset = () => {
    setStep(1)
    setInput('')
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) reset()
    setOpen(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button onClick={() => setOpen(true)}>
        <ClipboardText data-icon="inline-start" />
        Import Prices
      </Button>
      <DialogContent className="w-[calc(100%-2rem)] !max-w-[1200px] overflow-hidden p-0">
        <div className="flex max-h-[calc(100vh-2rem)] min-w-0 flex-col">
          <DialogHeader className="shrink-0 gap-4 border-b border-border px-6 pt-6 pb-5">
            <div>
              <DialogTitle>Import Prices</DialogTitle>
              <DialogDescription className="mt-1">
                Paste the material price table copied from Excel. A new version with the same Part Number closes the previous version.
              </DialogDescription>
            </div>
            <StepIndicator currentStep={step} />
          </DialogHeader>

          <div className="min-h-0 min-w-0 overflow-x-hidden overflow-y-auto px-6 py-5">
            {step === 1 && (
              <section className="flex flex-col gap-4" aria-labelledby="paste-material-prices-title">
                <div>
                  <h2 id="paste-material-prices-title" className="text-sm font-semibold text-foreground">Paste Excel data</h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Expected columns: {PRICE_IMPORT_HEADERS.join(', ')}. Use tab-separated values copied directly from the spreadsheet.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="material-prices-tsv" className="text-sm font-medium text-foreground">Excel content</label>
                    <Button variant="ghost" size="sm" onClick={() => setInput(SAMPLE_TSV)}>Use sample</Button>
                  </div>
                  <Textarea
                    id="material-prices-tsv"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    placeholder={SAMPLE_TSV}
                    wrap="off"
                    className="min-h-64 resize-y overflow-x-auto whitespace-pre font-mono text-xs leading-5"
                    aria-describedby="material-prices-tsv-help"
                  />
                  <p id="material-prices-tsv-help" className="text-xs text-muted-foreground">
                    Currency symbols and percentage signs are accepted. Valid From and Valid To must use YYYY-MM-DD.
                  </p>
                </div>
                <ValidationMessage result={result} />
              </section>
            )}

            {step === 2 && (
              <section className="flex flex-col gap-4" aria-labelledby="review-material-prices-title">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 id="review-material-prices-title" className="text-sm font-semibold text-foreground">Review imported data</h2>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Check the rows and the version changes before importing.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{counts.added} new</Badge>
                    <Badge variant="secondary">{counts.replaced} replacing</Badge>
                    <Badge variant="secondary">{counts.unchanged} unchanged</Badge>
                  </div>
                </div>
                <PreviewTable rows={result.rows} />
              </section>
            )}

            {step === 3 && (
              <section className="flex flex-col gap-4" aria-labelledby="confirm-material-prices-title">
                <div>
                  <h2 id="confirm-material-prices-title" className="text-sm font-semibold text-foreground">Confirm import</h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">The imported rows will become the current prices for their Part Numbers.</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{result.rows.length} rows</Badge>
                    <span className="text-sm text-foreground">ready to import</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Existing current versions will receive a Valid To date one day before the new Valid From date. New rows use {OPEN_ENDED_DATE} as the current end date.
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
            {step === 2 && <Button onClick={() => setStep(3)} disabled={!canContinue}>Continue</Button>}
            {step === 3 && <Button onClick={() => { onImport(result); setOpen(false); reset() }} disabled={!canContinue}>Import Prices</Button>}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

