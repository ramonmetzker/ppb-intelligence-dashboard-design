import { categories, type Risk } from '@/lib/ppb-data'
import { cn } from '@/lib/utils'
import { SectionHeader } from './section-header'

const fmt = (n: number) =>
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const RISK_STYLE: Record<Risk, string> = {
  High: 'bg-critical/10 text-critical',
  Medium: 'bg-warning/10 text-warning',
  Low: 'bg-success/10 text-success',
}

const COLS =
  'grid grid-cols-[minmax(130px,1.1fr)_minmax(200px,2.2fr)_120px_100px_100px_84px] items-center gap-x-6'

export function CategoryMatrix() {
  return (
    <section aria-labelledby="category-heading">
      <SectionHeader
        id="category-heading"
        title="PPB category performance"
        description="Points per category against the maximum attainable score."
        aside={<Legend />}
      />

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <div role="table" aria-label="PPB category performance" className="min-w-[860px]">
          <div
            role="row"
            className={cn(COLS, 'border-b border-border bg-secondary/50 px-6 py-2.5')}
          >
            <Head>Category</Head>
            <Head>Position against maximum</Head>
            <Head right>Current / Max</Head>
            <Head right>Forecast</Head>
            <Head right>Optimized</Head>
            <Head right>Risk</Head>
          </div>

          {categories.map((c) => {
            const focus = c.name === 'Memory'
            return (
              <div
                key={c.name}
                role="row"
                className={cn(
                  COLS,
                  'relative border-b border-border px-6 last:border-b-0',
                  focus ? 'bg-critical/[0.035] py-5' : 'py-4',
                )}
              >
                {focus && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-[3px] bg-critical"
                  />
                )}
                <div role="cell" className="flex items-center gap-2">
                  <span className={cn('text-[14px]', focus ? 'font-semibold' : 'font-medium')}>
                    {c.name}
                  </span>
                </div>
                <div role="cell">
                  <InlineMark
                    current={c.current}
                    forecast={c.forecast}
                    optimized={c.optimized}
                    max={c.max}
                  />
                </div>
                <div role="cell" className="tnum text-right text-[13px]">
                  <span className="font-semibold">{fmt(c.current)}</span>
                  <span className="text-muted-foreground"> / {c.max}</span>
                </div>
                <div role="cell" className="tnum text-right text-[14px]">
                  {c.forecast.toFixed(1)}
                </div>
                <div role="cell" className="tnum text-right text-[14px] font-semibold text-brand-deep">
                  {c.optimized.toFixed(1)}
                </div>
                <div role="cell" className="text-right">
                  <span
                    className={cn(
                      'inline-block rounded-md px-1.5 py-0.5 text-[11px] font-medium',
                      RISK_STYLE[c.risk],
                    )}
                  >
                    {c.risk}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Head({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <div
      role="columnheader"
      className={cn('eyebrow !text-[10.5px]', right && 'text-right')}
    >
      {children}
    </div>
  )
}

function Legend() {
  return (
    <ul className="hidden items-center gap-4 text-[12px] text-muted-foreground md:flex" aria-hidden="true">
      <li className="flex items-center gap-1.5">
        <span className="h-1.5 w-3 rounded-sm bg-foreground" /> Current
      </li>
      <li className="flex items-center gap-1.5">
        <span className="h-3 w-0.5 bg-brand" /> Forecast
      </li>
      <li className="flex items-center gap-1.5">
        <span className="h-3 w-0.5 bg-brand-deep" /> Optimized
      </li>
    </ul>
  )
}

function InlineMark({
  current,
  forecast,
  optimized,
  max,
}: {
  current: number
  forecast: number
  optimized: number
  max: number
}) {
  const p = (v: number) => `${(v / max) * 100}%`
  return (
    <div
      role="img"
      aria-label={`Current ${current}, forecast ${forecast}, optimized ${optimized} of ${max}`}
      className="relative h-5"
    >
      <span className="absolute top-1/2 right-0 left-0 h-[3px] -translate-y-1/2 rounded-full bg-secondary" />
      <span
        className="absolute top-1/2 left-0 h-[3px] -translate-y-1/2 rounded-full bg-foreground"
        style={{ width: p(current) }}
      />
      <span
        className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-brand"
        style={{ left: p(forecast) }}
      />
      <span
        className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-brand-deep"
        style={{ left: p(optimized) }}
      />
    </div>
  )
}
