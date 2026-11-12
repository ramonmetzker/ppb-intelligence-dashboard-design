'use client'

import { useMemo, useState } from 'react'
import { UploadSimple } from '@phosphor-icons/react'
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

const SAMPLE_TSV = [
  EXPECTED_HEADERS.join('\t'),
  ['SM-S098', '120', '180', '240', '300', '360', '420', '480', '540', '600', '660', '720', '780', '5400'].join('\t'),
  ['SM-A017', '-', '90', '140', '210', '-', '-', '-', '-', '-', '-', '-', '-', '440'].join('\t'),
].join('\n')

type ParseResult = {
  rows: SalesDemand[]
  errors: string[]
  hasInput: boolean
}

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

function PreviewTable({ rows }: { rows: SalesDemand[] }) {
  return (
    <div className="max-h-64 overflow-auto rounded-lg border border-border">
      <table className="w-full min-w-[1200px] border-collapse text-left text-xs">
        <caption className="sr-only">Preview of pasted 2027 monthly sales demand</caption>
        <thead className="sticky top-0 bg-muted text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Model</th>
            {SALES_MONTHS.map((month) => (
              <th key={month.id} className="px-3 py-2 text-right font-medium">
                {month.label}
              </th>
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
  const [input, setInput] = useState('')
  const result = useMemo(() => parseSalesDemand(input), [input])
  const canImport = result.rows.length > 0 && result.errors.length === 0

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setInput('')
    setOpen(nextOpen)
  }

  const importRows = () => {
    if (!canImport) return
    onImport(result.rows)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button onClick={() => setOpen(true)}>
        <UploadSimple data-icon="inline-start" />
        Import sales demand
      </Button>
      <DialogContent className="max-w-4xl gap-5">
        <DialogHeader>
          <DialogTitle>Import sales demand</DialogTitle>
          <DialogDescription>
            Paste the tab-separated 2027 sales provision copied from Excel. Use one model per line and a dash for months without volume.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="sales-demand-tsv" className="text-sm font-medium text-foreground">
              Excel content
            </label>
            <Button variant="ghost" size="sm" onClick={() => setInput(SAMPLE_TSV)}>
              Use sample
            </Button>
          </div>
          <Textarea
            id="sales-demand-tsv"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={SAMPLE_TSV}
            className="min-h-40 resize-y font-mono text-xs leading-5"
            aria-describedby="sales-demand-tsv-help"
          />
          <p id="sales-demand-tsv-help" className="text-xs text-muted-foreground">
            Expected columns: Model, Jan 2027 through Dec 2027, and Total. Monthly values must be non-negative numbers or -.
          </p>
        </div>

        {result.hasInput && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2" aria-live="polite">
              <Badge variant={result.errors.length === 0 ? 'secondary' : 'destructive'}>
                {result.errors.length === 0 ? `${result.rows.length} valid rows` : `${result.errors.length} validation errors`}
              </Badge>
              {result.errors.length === 0 && <span className="text-xs text-muted-foreground">Ready to import</span>}
            </div>
            {result.errors.length > 0 && (
              <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                <ul className="flex flex-col gap-1">
                  {result.errors.slice(0, 6).map((error) => <li key={error}>{error}</li>)}
                </ul>
                {result.errors.length > 6 && <p className="mt-1">Showing the first 6 errors.</p>}
              </div>
            )}
            {result.rows.length > 0 && <PreviewTable rows={result.rows} />}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={importRows} disabled={!canImport}>Import {canImport ? `${result.rows.length} rows` : 'sales demand'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
