import { Sparkle } from '@phosphor-icons/react/dist/ssr'
import { TrajectoryChart } from './trajectory-chart'

export function TrajectorySection() {
  return (
    <section
      aria-labelledby="trajectory-heading"
      className="grid gap-6 xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]"
    >
      <div className="rounded-xl border border-border bg-card p-6">
        <h2
          id="trajectory-heading"
          className="text-[19px] font-semibold tracking-tight"
        >
          Annual PPB trajectory
        </h2>
        <p className="mt-1 mb-5 max-w-xl text-[13px] text-pretty text-muted-foreground">
          Actual performance through October. Forecast and optimized trajectory
          through December.
        </p>
        <TrajectoryChart />
      </div>

      <aside
        aria-labelledby="outlook-heading"
        className="flex flex-col xl:pt-6"
      >
        <h2
          id="outlook-heading"
          className="text-[19px] font-semibold tracking-tight"
        >
          Year-end outlook
        </h2>

        <dl className="mt-5 flex flex-col divide-y divide-border border-y border-border">
          <Outlook term="Forecast confidence" value="87%" />
          <Outlook term="Expected gap" value={'\u221220.8 pts'} valueClass="text-warning" />
          <Outlook
            term="Compliance outlook"
            value="At risk"
            valueClass="text-warning"
            small
          />
        </dl>

        <div className="mt-auto pt-6">
          <div className="rounded-lg border border-brand/25 bg-brand/[0.06] p-4">
            <div className="flex items-center gap-2 text-brand-deep">
              <Sparkle size={14} weight="fill" className="text-brand" aria-hidden="true" />
              <p className="text-[11px] font-medium uppercase tracking-[0.08em]">
                Primary driver
              </p>
            </div>
            <p className="mt-2 text-[14px] leading-relaxed text-pretty">
              Memory localization is responsible for approximately{' '}
              <span className="num-mono font-medium">68%</span> of the projected PPB
              gap.
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-brand/20 pt-3">
              <div>
                <dt className="text-[11px] text-muted-foreground">Expected impact</dt>
                <dd className="num-mono mt-0.5 text-[15px] font-medium">
                  {'\u221214.3 pts'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">Confidence</dt>
                <dd className="num-mono mt-0.5 text-[15px] font-medium">87%</dd>
              </div>
            </dl>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Forecast model v4.2 &middot; 12-month backtest
            </p>
          </div>
        </div>
      </aside>
    </section>
  )
}

function Outlook({
  term,
  value,
  valueClass,
  small,
}: {
  term: string
  value: string
  valueClass?: string
  small?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-4">
      <dt className="text-[13px] text-muted-foreground">{term}</dt>
      <dd
        className={`${small ? 'text-[20px] font-semibold tracking-tight' : 'num-mono text-[26px] font-medium'} ${valueClass ?? ''}`}
      >
        {value}
      </dd>
    </div>
  )
}
