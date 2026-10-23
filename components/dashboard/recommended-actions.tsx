import { ArrowRight, Function as FunctionIcon } from '@phosphor-icons/react/dist/ssr'
import { SectionHeader } from './section-header'

const SECONDARY = [
  {
    rank: 'Rank 2',
    title: 'Increase local Battery allocation',
    id: 'Battery / EB-BS938',
    impact: '+6.7 pts',
    cost: '+R$ 270k',
    perPoint: 'R$ 40.3k / pt',
  },
  {
    rank: 'Rank 3',
    title: 'Adjust Main Board sourcing',
    id: 'Main Board / GH82-MB',
    impact: '+4.2 pts',
    cost: '+R$ 190k',
    perPoint: 'R$ 45.2k / pt',
  },
]

export function RecommendedActions() {
  return (
    <section aria-labelledby="actions-heading">
      <SectionHeader
        id="actions-heading"
        title="Recommended actions"
        description="Highest-impact changes identified by the optimization model."
      />

      <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <article className="flex flex-col rounded-xl border border-border bg-card p-6 lg:p-7">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-brand-deep">
              <FunctionIcon size={14} className="text-brand" aria-hidden="true" />
              Optimization insight
            </p>
            <p className="num-mono text-[11px] text-muted-foreground">
              Rank 1 of 14
            </p>
          </div>

          <h3 className="mt-4 text-[22px] leading-7 font-semibold tracking-tight">
            Increase local Memory sourcing
          </h3>
          <p className="num-mono mt-1 text-[12px] text-muted-foreground">
            Memory / GH82-XXXXX
          </p>

          <dl className="mt-7 grid grid-cols-3 divide-x divide-border border-y border-border">
            <Stat term="PPB impact" value="+11.4" unit="pts" accent />
            <Stat term="Cost impact" value="+R$ 420k" />
            <Stat term="Cost per point" value="R$ 36.8k" />
          </dl>

          <div className="mt-7">
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="text-muted-foreground">Local sourcing</span>
              <span className="num-mono flex items-center gap-2 text-[18px] font-medium">
                <span className="text-actual">38%</span>
                <ArrowRight size={14} className="text-muted-foreground" aria-hidden="true" />
                <span className="text-optimized">71%</span>
              </span>
            </div>
            <div
              role="img"
              aria-label="Local sourcing share rises from 38 percent to 71 percent"
              className="relative mt-3 h-1.5 rounded-full bg-secondary"
            >
              <span className="absolute inset-y-0 left-0 w-[38%] rounded-full bg-actual" />
              <span className="absolute inset-y-0 left-[38%] w-[33%] rounded-r-full bg-optimized" />
            </div>
          </div>

          <p className="mt-7 max-w-lg text-[13px] leading-relaxed text-pretty text-muted-foreground">
            Most cost-efficient action currently available to reduce the
            projected PPB gap. Closes{' '}
            <span className="num-mono text-foreground">55%</span> of the{' '}
            <span className="num-mono text-foreground">{'\u221220.8'}</span> pt
            forecast gap.
          </p>
        </article>

        <div className="flex flex-col">
          <p className="eyebrow pb-3">Next in ranking</p>
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {SECONDARY.map((a) => (
              <li key={a.title} className="flex-1 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-[15px] leading-5 font-medium">{a.title}</h3>
                    <p className="num-mono mt-1 text-[11.5px] text-muted-foreground">
                      {a.id}
                    </p>
                  </div>
                  <span className="num-mono text-[11px] whitespace-nowrap text-muted-foreground">
                    {a.rank}
                  </span>
                </div>
                <div className="mt-4 flex items-baseline gap-6">
                  <p className="num-mono text-[20px] leading-7 font-medium text-optimized">
                    {a.impact}
                  </p>
                  <p className="num-mono text-[20px] leading-7 font-medium">{a.cost}</p>
                  <p className="num-mono ml-auto text-[12px] text-muted-foreground">
                    {a.perPoint}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function Stat({
  term,
  value,
  unit,
  accent,
}: {
  term: string
  value: string
  unit?: string
  accent?: boolean
}) {
  return (
    <div className="px-5 py-4 first:pl-0">
      <dt className="text-[12px] text-muted-foreground">{term}</dt>
      <dd
        className={`num-mono mt-1 text-[28px] leading-9 font-medium ${accent ? 'text-optimized' : ''}`}
      >
        {value}
        {unit && (
          <span className="ml-1 text-[13px] font-normal text-muted-foreground">
            {unit}
          </span>
        )}
      </dd>
    </div>
  )
}
