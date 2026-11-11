import { STATUS_OPTIONS, type Rpa, type RpaStatus } from '@/lib/rpa/data'
import { cn } from '@/lib/utils'

export function RpaStatusBadge({ status }: { status: RpaStatus }) {
  const option = STATUS_OPTIONS.find((item) => item.value === status)!
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium">
      <span
        aria-hidden="true"
        className={cn('size-1.5 rounded-full', status === 'running' && 'animate-pulse')}
        style={{ backgroundColor: option.color }}
      />
      {option.label}
    </span>
  )
}

export function RpaStatusCell({ row }: { row: Rpa }) {
  return (
    <span className="flex min-w-0 flex-col items-start gap-1">
      <RpaStatusBadge status={row.status} />
      {row.detail && (row.status === 'failed' || row.status === 'warning') && (
        <span className="max-w-full truncate text-xs text-muted-foreground" title={row.detail}>
          {row.detail}
        </span>
      )}
    </span>
  )
}
