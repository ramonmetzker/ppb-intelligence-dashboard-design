'use client'

import { useRef, useState } from 'react'
import { DownloadSimple, FileXls, UploadSimple, WarningCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useMaterials } from '@/components/materials/material-provider'
import { downloadTemplate, readPriceFile } from '@/lib/material-excel'
import { fmtPrice, type PreviewStatus, type UploadPreview } from '@/lib/material-store'
import { cn } from '@/lib/utils'

const STATUS: Record<PreviewStatus, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-success/10 text-success' },
  update: { label: 'Updated', className: 'bg-brand/10 text-brand' },
  same: { label: 'Unchanged', className: 'bg-secondary text-muted-foreground' },
  stale: { label: 'Older than current', className: 'bg-warning/10 text-warning' },
}

export function PriceActions() {
  const { book, applyUpload } = useMaterials()
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<UploadPreview | null>(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setPreview(null)
    setBusy(false)
    setDragging(false)
  }

  const handleFile = async (file: File) => {
    setBusy(true)
    try {
      setPreview(await readPriceFile(file, book))
    } catch {
      setPreview({
        fileName: file.name,
        rows: [],
        errors: [],
        fatal: 'This file could not be read. Upload an .xlsx file built from the template.',
      })
    } finally {
      setBusy(false)
    }
  }

  const counts = preview
    ? {
        new: preview.rows.filter((r) => r.status === 'new').length,
        update: preview.rows.filter((r) => r.status === 'update').length,
        same: preview.rows.filter((r) => r.status === 'same').length,
        skipped: preview.rows.filter((r) => r.status === 'stale').length + preview.errors.length,
      }
    : null
  const changes = counts ? counts.new + counts.update : 0

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => downloadTemplate(book)}>
        <DownloadSimple size={14} aria-hidden="true" />
        Download template
      </Button>
      <Button
        size="sm"
        onClick={() => {
          reset()
          setOpen(true)
        }}
      >
        <UploadSimple size={14} aria-hidden="true" />
        Upload prices
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) reset()
        }}
      >
        <DialogContent className="gap-0 p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-border px-5 py-4">
            <DialogTitle className="font-display text-[16px] font-semibold tracking-tight">
              Upload prices
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              One row per material and vendor. Changed prices keep the previous value in the history.
            </DialogDescription>
          </DialogHeader>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            className="sr-only"
            tabIndex={-1}
            aria-label="Choose price file"
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) handleFile(file)
            }}
          />

          {!preview || preview.fatal ? (
            <div className="flex flex-col gap-3 px-5 py-5">
              {preview?.fatal && (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-md bg-critical/10 px-3 py-2 text-[12.5px] text-critical"
                >
                  <WarningCircle size={16} className="mt-px shrink-0" aria-hidden="true" />
                  {preview.fatal}
                </p>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  const file = e.dataTransfer.files?.[0]
                  if (file) handleFile(file)
                }}
                className={cn(
                  'flex h-40 flex-col items-center justify-center gap-2 rounded-md border border-dashed text-center transition-colors focus-visible:outline-2 focus-visible:outline-ring',
                  dragging ? 'border-brand bg-brand/5' : 'border-border bg-secondary/40 hover:bg-secondary/70',
                )}
              >
                <FileXls size={28} className="text-brand" aria-hidden="true" />
                <span className="text-[13px] font-medium">
                  {busy ? 'Reading file...' : 'Drop your .xlsx here or browse'}
                </span>
                <span className="text-[11.5px] text-muted-foreground">
                  Columns: material_code, vendor, current_price_usd, origin, last_update_date, ppb_item (optional)
                </span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 px-5 py-4">
              <p className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                <FileXls size={16} className="text-brand" aria-hidden="true" />
                <span className="truncate font-medium text-foreground">{preview.fileName}</span>
              </p>

              {counts && (
                <dl className="grid grid-cols-4 overflow-hidden rounded-md border border-border">
                  {(
                    [
                      ['New', counts.new, 'text-success'],
                      ['Updated', counts.update, 'text-brand'],
                      ['Unchanged', counts.same, 'text-muted-foreground'],
                      ['Skipped', counts.skipped, counts.skipped ? 'text-warning' : 'text-muted-foreground'],
                    ] as const
                  ).map(([label, value, tone], i) => (
                    <div key={label} className={cn('px-3 py-2', i > 0 && 'border-l border-border')}>
                      <dt className="text-[11px] text-muted-foreground">{label}</dt>
                      <dd className={cn('font-display text-[20px] leading-6 font-semibold tabular-nums', tone)}>
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              {preview.errors.length > 0 && (
                <ul className="flex max-h-24 flex-col gap-1 overflow-y-auto rounded-md bg-warning/10 px-3 py-2 text-[12px] text-warning">
                  {preview.errors.map((err) => (
                    <li key={err.line}>
                      <span className="font-medium tabular-nums">Line {err.line}:</span> {err.message}
                    </li>
                  ))}
                </ul>
              )}

              <div className="max-h-64 overflow-auto rounded-md border border-border">
                <table className="w-full text-left text-[12px]">
                  <thead className="sticky top-0 bg-secondary text-[11px] text-muted-foreground">
                    <tr>
                      <th className="px-3 py-1.5 font-medium">Material</th>
                      <th className="px-3 py-1.5 font-medium">Vendor</th>
                      <th className="px-3 py-1.5 font-medium">Origin</th>
                      <th className="px-3 py-1.5 text-right font-medium">Price</th>
                      <th className="px-3 py-1.5 font-medium">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row) => (
                      <tr key={row.line} className="border-t border-border">
                        <td className="px-3 py-1.5 font-medium tabular-nums">{row.code}</td>
                        <td className="px-3 py-1.5">{row.vendor}</td>
                        <td className="px-3 py-1.5 capitalize">{row.origin}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">
                          {row.previous && row.status === 'update' && row.previous.price !== row.price ? (
                            <>
                              <span className="text-muted-foreground">{fmtPrice(row.previous.price)}</span>
                              {' > '}
                            </>
                          ) : null}
                          {fmtPrice(row.price)}
                        </td>
                        <td className="px-3 py-1.5">
                          <span
                            className={cn(
                              'inline-flex h-5 items-center rounded-sm px-1.5 text-[11px] font-medium',
                              STATUS[row.status].className,
                            )}
                          >
                            {STATUS[row.status].label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <DialogFooter className="m-0 rounded-b-xl border-t border-border bg-secondary/40 px-5 py-3">
            {preview ? (
              <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
                Choose another file
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => downloadTemplate(book)}>
                <DownloadSimple size={14} aria-hidden="true" />
                Download template
              </Button>
            )}
            {preview && !preview.fatal && (
              <Button
                size="sm"
                disabled={changes === 0}
                onClick={() => {
                  applyUpload(preview)
                  setOpen(false)
                  reset()
                }}
              >
                {changes === 0 ? 'Nothing to import' : `Import ${changes} change${changes > 1 ? 's' : ''}`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
