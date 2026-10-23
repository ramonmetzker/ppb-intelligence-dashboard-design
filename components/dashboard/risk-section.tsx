import { ArrowDownRight, ArrowUpRight } from '@phosphor-icons/react/dist/ssr'
import { riskDrivers, sinceLastForecast } from '@/lib/ppb-data'
import { cn } from '@/lib/utils'

const MAX_IMPACT = Math.max(...riskDrivers.map((d) => Math.abs(d.impact)))

export function RiskSection() {
  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,6fr)_minmax(0,4fr)]">
      <div
        aria-labelledby="risk-heading"
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="flex items-baseline justify-between">
          <h2 id="risk-heading" className="text-[19px] font-semibold tracking-tight">
            Main risk drivers
          </h2>
          <p className="text-[12px] text-muted-foreground">
            Contribution to year-end PPB gap
          </p>
        </div>

        <ol className="mt-4 divide-y divide-border border-t border-border">
          {riskDrivers.map((d, i) => (
            <li
              key={d.rank}
              className="grid grid-cols-[28px_minmax(0,1fr)_96px_72px] items-center gap-4 py-3.5"
            >
              <span className="font-mono text-[12px] text-muted-foreground">
                {d.rank}
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-medium">{d.driver}</p>
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                  {d.reason}
                </p>
              </div>
              <span
                aria-hidden="true"
                className="relative h-1 overflow-hidden rounded-full bg-secondary"
              >
                <span
                  className={cn(
                    'absolute inset-y-0 right-0 rounded-full',
                    i === 0 ? 'bg-critical/80' : 'bg-warning/60',
                  )}
                  style={{ width: `${(Math.abs(d.impact) / MAX_IMPACT) * 100}%` }}
                />
              </span>
              <span
                className={cn(
                  'tnum text-right text-[15px] font-semibold',
                  i === 0 ? 'text-critical' : 'text-warning',
                )}
              >
                {d.impact.toFixed(1)}
                <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                  pts
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div
        aria-labelledby="changes-heading"
        className="rounded-xl border border-border bg-card p-6"
      >
        <h2 id="changes-heading" className="text-[19px] font-semibold tracking-tight">
          Since last forecast
        </h2>
        <p className="mt-1 text-[12px] text-muted-foreground">
          Compared with the Sep 29 model run
        </p>

        <ul className="mt-4 divide-y divide-border border-t border-border">
          {sinceLastForecast.map((c) => {
            const Arrow = c.direction === 'down' ? ArrowDownRight : ArrowUpRight
            return (
              <li
                key={c.label}
                className="flex items-center justify-between gap-4 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-6 items-center justify-center rounded-md bg-secondary text-muted-foreground">
                    <Arrow size={14} weight="bold" aria-hidden="true" />
                  </span>
                  <span className="text-[14px]">{c.label}</span>
                </div>
                <span className="tnum text-[15px] font-semibold">{c.value}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
