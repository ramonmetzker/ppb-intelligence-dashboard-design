'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PopConfirm } from '@/components/pop-confirm'
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
  const selectedLabel = labels.selectedCount(allMatching ? total : count)

  return (
    <div
      role="region"
      aria-label={selectedLabel}
      className="flex h-9 min-h-9 min-w-0 items-center gap-2 overflow-x-auto rounded-lg border border-brand/30 bg-brand-soft px-2 text-[13px] text-brand-deep"
    >
      <span className="inline-flex h-6 shrink-0 items-center rounded-md bg-brand/15 px-2 font-semibold tnum" aria-live="polite">
        {allMatching ? total : count}
      </span>
      <p className="min-w-0 shrink truncate font-medium">{selectedLabel}</p>

      {!allMatching && canSelectAllMatching && (
        <Button
          type="button"
          variant="link"
          size="xs"
          className="h-7 shrink-0 px-1.5 text-brand-deep hover:text-brand-deep"
          onClick={onSelectAllMatching}
        >
          {labels.selectAllMatching(total)}
        </Button>
      )}

      {allMatching && <span className="shrink-0 text-brand-deep/75">{labels.allMatchingSelected(total)}</span>}

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {actions.map((action) => {
          const confirmation = typeof action.confirm === 'function' ? action.confirm(context) : action.confirm
          const trigger = (
            <Button
              type="button"
              size="xs"
              variant={action.tone === 'destructive' ? 'destructive' : 'outline'}
              className={action.tone === 'destructive' ? 'h-7' : 'h-7 border-brand/25 bg-card text-foreground hover:bg-muted'}
              disabled={action.disabled?.(context)}
              onClick={confirmation ? undefined : () => action.onSelect(getContext())}
            >
              {action.icon}
              {action.label}
            </Button>
          )

          return confirmation ? (
            <PopConfirm
              key={action.id}
              trigger={trigger}
              title={confirmation.title}
              description={confirmation.description}
              confirmLabel={confirmation.confirmLabel}
              cancelLabel={confirmation.cancelLabel}
              onConfirm={() => action.onSelect(getContext())}
            />
          ) : (
            <span key={action.id}>{trigger}</span>
          )
        })}
        <Button type="button" variant="ghost" size="xs" className="h-7 px-1.5 text-brand-deep hover:bg-brand/10" onClick={onClear}>
          <X aria-hidden="true" />
          <span className="hidden sm:inline">{labels.clearSelection}</span>
          <span className="sr-only sm:hidden">{labels.clearSelection}</span>
        </Button>
      </div>
    </div>
  )
}
