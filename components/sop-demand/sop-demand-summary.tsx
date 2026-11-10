import type { SopDemand } from '@/lib/sop-demand/data'
import { cn } from '@/lib/utils'

const number = new Intl.NumberFormat('en-US')

export function SopDemandSummary({ rows }: { rows: readonly SopDemand[] }) {
  const demand = rows.reduce((sum, r) => sum + r.demand, 0)
  const supply = rows.reduce((sum, r) => sum + r.supply, 0)
  const short = rows.filter((r) => r.gap < 0).length
  const approved = rows.filter((r) => r.status === 'approved' || r.status === 'locked').length

  const stats = [
    { label: 'Total demand', value: number.format(demand), hint: 'units' },
    { label: 'Total supply', value: number.format(supply), hint: `${((supply / Math.max(demand, 1)) * 100).toFixed(0)}% of demand` },
    { label: 'Lines with shortage', value: number.format(short), hint: `of ${rows.length} lines`, tone: short > 0 ? 'critical' : undefined },
    { label: 'Approved or locked', value: number.format(approved), hint: `${((approved / Math.max(rows.length, 1)) * 100).toFixed(0)}% of lines` },
  ] as const

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col gap-0.5 bg-card px-4 py-3">
          <dt className="text-xs text-muted-foreground">{stat.label}</dt>
          <dd className={cn('tnum font-display text-xl font-semibold', 'tone' in stat && stat.tone === 'critical' && 'text-critical')}>
            {stat.value}
          </dd>
          <dd className="text-xs text-muted-foreground">{stat.hint}</dd>
        </div>
      ))}
    </dl>
  )
}
