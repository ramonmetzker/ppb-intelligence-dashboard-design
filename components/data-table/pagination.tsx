'use client'

import { useId } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { DataTableLabels } from './filter-utils'

type Props = {
  page: number
  pageCount: number
  pageSize: number
  total: number
  pageSizeOptions: readonly number[]
  labels: DataTableLabels
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

function pageWindow(page: number, count: number): (number | 'gap-start' | 'gap-end')[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1)
  const pages = new Set([1, count, page - 1, page, page + 1])
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p))
  if (page >= count - 2) [count - 1, count - 2, count - 3].forEach((p) => pages.add(p))
  const sorted = [...pages].filter((p) => p >= 1 && p <= count).sort((a, b) => a - b)
  const result: (number | 'gap-start' | 'gap-end')[] = []
  sorted.forEach((p, index) => {
    const previous = sorted[index - 1]
    if (previous && p - previous > 1) result.push(previous === 1 || p < page ? 'gap-start' : 'gap-end')
    result.push(p)
  })
  return result
}

export function Pagination({ page, pageCount, pageSize, total, pageSizeOptions, labels, onPageChange, onPageSizeChange }: Props) {
  const uid = useId()
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <p className="tnum text-[13px] text-muted-foreground" aria-live="polite">
        {labels.range(from, to, total)}
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <span id={`${uid}-rows`} className="hidden sm:inline">
            {labels.rowsPerPage}
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => value && onPageSizeChange(Number(value))}
          >
            <SelectTrigger aria-labelledby={`${uid}-rows`} aria-label={labels.rowsPerPage} className="tnum min-w-16 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} align="end" className="min-w-20">
              {pageSizeOptions.map((option) => (
                <SelectItem key={option} value={String(option)} className="tnum">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <nav className="flex items-center gap-1" aria-label={labels.pageOf(page, pageCount)}>
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => onPageChange(1)} aria-label={labels.firstPage}>
            <ChevronsLeft aria-hidden="true" />
          </Button>
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label={labels.previousPage}>
            <ChevronLeft aria-hidden="true" />
          </Button>

          <ul className="hidden items-center gap-1 md:flex">
            {pageWindow(page, pageCount).map((entry) =>
              typeof entry === 'number' ? (
                <li key={entry}>
                  <button
                    type="button"
                    onClick={() => onPageChange(entry)}
                    aria-label={labels.goToPage(entry)}
                    aria-current={entry === page ? 'page' : undefined}
                    className={cn(
                      'tnum inline-flex size-8 items-center justify-center rounded-lg text-[13px] outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
                      entry === page ? 'bg-primary font-medium text-primary-foreground' : 'hover:bg-muted',
                    )}
                  >
                    {entry}
                  </button>
                </li>
              ) : (
                <li key={entry} aria-hidden="true" className="w-5 text-center text-muted-foreground">
                  ...
                </li>
              ),
            )}
          </ul>
          <span className="tnum px-2 text-[13px] text-muted-foreground md:hidden">{labels.pageOf(page, pageCount)}</span>

          <Button variant="outline" size="icon" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} aria-label={labels.nextPage}>
            <ChevronRight aria-hidden="true" />
          </Button>
          <Button variant="outline" size="icon" disabled={page >= pageCount} onClick={() => onPageChange(pageCount)} aria-label={labels.lastPage}>
            <ChevronsRight aria-hidden="true" />
          </Button>
        </nav>
      </div>
    </div>
  )
}
