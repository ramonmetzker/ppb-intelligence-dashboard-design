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
import { SALES_PLANTS, SALES_WEEKS, type SalesDemand, type SalesWeekId } from '@/lib/sales-demand/data'

const MODEL_PATTERN = /^[A-Z]{2}-[A-Z]\d{3}$/
const EXPECTED_HEADERS = ['Model', 'Plant', ...SALES_WEEKS.map((week) => week.label)]
const number = new Intl.NumberFormat('en-US')

const SAMPLE_TSV = [
  EXPECTED_HEADERS.join('\t'),
  ['SM-S098', 'P81J', '120', '140', '-', '180', ...Array(16).fill('-')].join('\t'),
  ['SM-A017', 'P81M', '-', '-', '90', '110', '130', ...Array(15).fill('-')].join('\t'),
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
    const plant = cells[1] ?? ''
    const rowErrors: string[] = []

    if (cells.length !== EXPECTED_HEADERS.length) rowErrors.push('wrong number of columns')
    if (!MODEL_PATTERN.test(model)) rowErrors.push('model must look like SM-A017')
    if (seenModels.has(model)) rowErrors.push('model is duplicated')
    if (!SALES_PLANTS.includes(plant as (typeof SALES_PLANTS)[number])) rowErrors.push(`unknown plant ${plant || '(empty)'}`)

    const weeks = Object.fromEntries(
      SALES_WEEKS.map((week, weekIndex) => {
        const rawValue = cells[weekIndex + 2] ?? ''
        if (rawValue === '' || rawValue === '-') return [week.id, null]
        const value = Number(rawValue.replaceAll(',', ''))
        if (!Number.isFinite(value) || value < 0) {
          rowErrors.push(`${week.label} must be a non-negative number or -`)
          return [week.id, null]
        }
        return [week.id, value]
      }),
    ) as Record<SalesWeekId, number | null>

    if (rowErrors.length > 0) {
      errors.push(`Line ${lineNumber}: ${rowErrors.join(', ')}`)
      return
    }

    seenModels.add(model)
    rows.push({
      id: `imported-${model}`,
      model,
      plant: plant as SalesDemand['plant'],
      weeks,
    })
  })

  return { rows, errors, hasInput: true }
}

function PreviewTable({ rows }: { rows: SalesDemand[] }) {
  return (
    <div className="max-h-64 overflow-auto rounded-lg border border-border">
      <table className="w-full min-w-[760px] border-collapse text-left text-xs">
        <caption className="sr-only">Preview of pasted sales demand</caption>
        <thead className="sticky top-0 bg-muted text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Model</th>
            <th className="px-3 py-2 font-medium">Plant</th>
            {SALES_WEEKS.slice(0, 6).map((week) => (
              <th key={week.id} className="px-3 py-2 text-right font-medium">
                {week.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.slice(0, 6).map((row) => (
            <tr key={row.id}>
              <td className="px-3 py-2 font-medium text-foreground">{row.model}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.plant}</td>
              {SALES_WEEKS.slice(0, 6).map((week) => (
                <td key={week.id} className="px-3 py-2 text-right text-muted-foreground">
                  {row.weeks[week.id] == null ? '-' : number.format(row.weeks[week.id] ?? 0)}
                </td>
              ))}
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
            Paste the tab-separated content copied from Excel. Use one SKU per line and a dash for weeks without volume.
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
            Expected columns: Model, Plant, W45 through W12. Values must be non-negative numbers or -.
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
