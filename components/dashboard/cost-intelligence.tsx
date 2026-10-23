import { CostScatter } from './cost-scatter'

const METRICS = [
  { value: 'R$ 36.8k', label: 'Best opportunity' },
  { value: 'R$ 210k', label: 'Highest cost opportunity' },
  { value: 'R$ 1.82M', label: 'Minimum additional investment' },
]

export function CostIntelligence() {
  return (
    <section
      aria-labelledby="cost-heading"
      className="grid overflow-hidden rounded-xl border border-border bg-card xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"
    >
      <div className="flex flex-col p-6">
        <h2 id="cost-heading" className="text-[19px] font-semibold tracking-tight">
          Cost intelligence
        </h2>

        <div className="mt-6">
          <p className="tnum text-[44px] leading-none font-semibold tracking-tight">
            R$ 42.8k
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Average cost per additional PPB point
          </p>
        </div>

        <dl className="mt-auto grid grid-cols-3 gap-4 border-t border-border pt-5">
          {METRICS.map((m, i) => (
            <div key={m.label} className={i > 0 ? 'border-l border-border pl-4' : ''}>
              <dd className="tnum text-[20px] leading-7 font-semibold tracking-tight">
                {m.value}
              </dd>
              <dt className="mt-1 text-[12px] leading-snug text-muted-foreground">
                {m.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>

      <div className="border-t border-border p-6 xl:border-t-0 xl:border-l">
        <div className="mb-3 flex items-baseline justify-between">
          <p className="text-[13px] font-medium">Incremental cost (R$) versus PPB point gain, by material</p>
          <p className="text-[11px] text-muted-foreground">
            Below the dashed line: cheaper than average
          </p>
        </div>
        <CostScatter />
      </div>
    </section>
  )
}
