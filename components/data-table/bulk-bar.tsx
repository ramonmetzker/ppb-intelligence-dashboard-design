'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BulkAction, SelectionContext } from '@/lib/data-table/types'
import type { DataTableLabels } from './filter-utils'

type Props<T> = {
  count: number
  total: number
  allMatching: boolean
  canSelectAllMatching: boolean
  actions: readonly BulkAction<T>[]
  getContext: () => SelectionContext<T>
  labels: DataTableLabels
  onClear: () => void
  onSelectAllMatching: () => void
}

export function BulkBar<T>({
  count,
  total,
  allMatching,
  canSelectAllMatching,
  actions,
  getContext,
  labels,
  onClear,
  onSelectAllMatching,
}: Props<T>) {
  const context = getContext()
  return (
    <div
      role="region"
      aria-label={labels.selectedCount(count)}
      className="flex min-h-9 flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-brand/30 bg-brand-soft px-2.5 py-1 text-[13px] text-brand-deep"
    >
      <p className="tnum font-medium" aria-live="polite">
        {labels.selectedCount(allMatching ? total : count)}
      </p>

      {allMatching ? (
        <p className="text-brand-deep/80">{labels.allMatchingSelected(total)}</p>
      ) : (
        canSelectAllMatching && (
          <Button type="button" variant="link" size="sm" className="h-auto p-0 text-[13px] text-brand-deep" onClick={onSelectAllMatching}>
            {labels.selectAllMatching(total)}
          </Button>
        )
      )}

      <div className="ml-auto flex flex-wrap items-center gap-1.5">
        {actions.map((action) => (
          <Button
            key={action.id}
            type="button"
            size="sm"
            variant={action.tone === 'destructive' ? 'destructive' : 'outline'}
            className={action.tone === 'destructive' ? undefined : 'bg-card'}
            disabled={action.disabled?.(context)}
            onClick={() => action.onSelect(getContext())}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
        <Button type="button" size="sm" variant="ghost" onClick={onClear}>
          <X aria-hidden="true" />
          {labels.clearSelection}
        </Button>
      </div>
    </div>
  )
}
