'use client'

import type { DataTableQuery } from '@/lib/data-table/types'
import { STATUS_OPTIONS, type Rpa, type RpaStatus } from '@/lib/rpa/data'
import { cn } from '@/lib/utils'

const SUMMARY_STATUSES: RpaStatus[] = ['success', 'warning', 'failed', 'running']

type Props = {
  rows: readonly Rpa[]
  query: DataTableQuery
  onQueryChange: (query: DataTableQuery) => void
}

/** Counts per last status. Each one is a shortcut for the Last status column filter. */
export function RpaStatusSummary({ rows, query, onQueryChange }: Props) {
  const statusFilter = query.filters.find((filter) => filter.id === 'status' && Array.isArray(filter.value))
  const active = (statusFilter?.value as string[] | undefined) ?? []

  const toggle = (status: RpaStatus) => {
    const others = query.filters.filter((filter) => filter.id !== 'status')
    const next = active.length === 1 && active[0] === status ? [] : [status]
    onQueryChange({
      ...query,
      page: 1,
      filters: next.length ? [...others, { id: 'status', op: 'in', value: next }] : others,
    })
  }

  return (
    <div role="group" aria-label="Filter by last status" className="flex flex-wrap gap-2">
      {SUMMARY_STATUSES.map((status) => {
        const option = STATUS_OPTIONS.find((item) => item.value === status)!
        const count = rows.filter((row) => row.status === status).length
        const pressed = active.length === 1 && active[0] === status
        return (
          <button
            key={status}
            type="button"
            aria-pressed={pressed}
            onClick={() => toggle(status)}
            className={cn(
              'flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-[13px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
              pressed ? 'border-brand bg-brand-soft text-brand-deep' : 'border-border hover:bg-muted/60',
            )}
          >
            <span
              aria-hidden="true"
              className={cn('size-2 rounded-full', status === 'running' && 'animate-pulse')}
              style={{ backgroundColor: option.color }}
            />
            <span className="font-medium">{option.label}</span>
            <span className="tnum text-muted-foreground">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
