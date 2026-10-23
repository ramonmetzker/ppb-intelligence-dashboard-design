import type { Status } from '@/lib/ppb-model'
import { cn } from '@/lib/utils'

const TONE: Record<Status, { text: string; bg: string; dot: string }> = {
  Compliant: { text: 'text-success', bg: 'bg-success/10', dot: 'bg-success' },
  'At risk': { text: 'text-warning', bg: 'bg-warning/10', dot: 'bg-warning' },
  'Off track': { text: 'text-critical', bg: 'bg-critical/10', dot: 'bg-critical' },
}

export function statusText(status: Status) {
  return TONE[status].text
}

export function StatusChip({
  status,
  className,
}: {
  status: Status
  className?: string
}) {
  const tone = TONE[status]
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1.5 rounded-sm px-1.5 text-[11px] font-medium',
        tone.bg,
        tone.text,
        className,
      )}
    >
      <span aria-hidden="true" className={cn('size-1.5 rounded-[1px]', tone.dot)} />
      {status}
    </span>
  )
}
