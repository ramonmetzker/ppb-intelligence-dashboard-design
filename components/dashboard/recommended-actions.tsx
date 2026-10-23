import { ArrowRight, Function as FunctionIcon } from '@phosphor-icons/react/dist/ssr'
import { SectionHeader } from './section-header'

export function RecommendedActions() {
  return (
    <section aria-labelledby="actions-heading">
      <SectionHeader
        id="actions-heading"
        title="Recommended actions"
        description="Highest-impact changes identified by the optimization model."
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <article className="flex flex-col rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-brand-deep">
              <FunctionIcon size={14} className="text-brand" aria-hidden="true" />
              Optimizer recommendation
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">
              Rank 1 of 14
            </p>
          </div>

          <h3 className="mt-4 text-[22px] leading-7 font-semibold tracking-tight">
            Increase local Memory sourcing
          </h3>
          <p className="mt-1 font-mono text-[12px] text-muted-foreground">
            Memory / GH82-XXXXX
          </p>

          <dl className="mt-6 grid grid-cols-3 divide-x divide-border border-y border-border">
            <Stat term="PPB impact" value="+11.4 pts" accent />
            <Stat term="Cost impact" value="+R$ 420k" />
            <Stat term="Cost per point" value="R$ 36.8k" />
          </dl>

          <div className="mt-6">
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="text-muted-foreground">Local sourcing</span>
              <span className="tnum flex items-center gap-2 text-[18px] font-semibold">
                38%
                <ArrowRight size={14} className="text-muted-foreground" aria-hidden="true" />
                <span className="text-brand-deep">71%</span>
              </span>
            </div>
            <div
              role="img"
              aria-label="Local sourcing share rises from 38 percent to 71 percent"
              className="relative mt-3 h-1.5 rounded-full bg-secondary"
            >
              <span className="absolute inset-y-0 left-0 w-[38%] rounded-full bg-foreground/80" />
              <span className="absolute inset-y-0 left-[38%] w-[33%] rounded-r-full bg-brand" />
              <span className="absolute -top-1 bottom-[-4px] left-[71%] w-px bg-brand-deep" />
            </div>
          </div>

          <p className="mt-6 max-w-lg text-[13px] leading-relaxed text-pretty text-muted-foreground">
            Most cost-efficient action currently available to reduce the
            projected PPB gap.
          </p>
        </article>

        <div className="flex flex-col gap-4">
          <SecondaryAction
            rank="Rank 2"
            title="Increase local Battery allocation"
            impact="+6.7 pts"
            cost="+R$ 270k"
          />
          <SecondaryAction
            rank="Rank 3"
            title="Adjust Main Board sourcing"
            impact="+4.2 pts"
            cost="+R$ 190k"
          />
        </div>
      </div>
    </section>
  )
}

function Stat({
  term,
  value,
  accent,
}: {
  term: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="px-5 py-4 first:pl-0">
      <dt className="text-[12px] text-muted-foreground">{term}</dt>
      <dd
        className={`tnum mt-1 text-[26px] leading-8 font-semibold tracking-tight ${accent ? 'text-brand-deep' : ''}`}
      >
        {value}
      </dd>
    </div>
  )
}

function SecondaryAction({
  rank,
  title,
  impact,
  cost,
}: {
  rank: string
  title: string
  impact: string
  cost: string
}) {
  return (
    <article className="flex flex-1 flex-col justify-between rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-[15px] leading-5 font-medium">{title}</h3>
        <span className="font-mono text-[11px] whitespace-nowrap text-muted-foreground">
          {rank}
        </span>
      </div>
      <div className="mt-4 flex items-end gap-8">
        <div>
          <p className="text-[11px] text-muted-foreground">PPB impact</p>
          <p className="tnum text-[22px] leading-7 font-semibold text-brand-deep">
            {impact}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">Cost impact</p>
          <p className="tnum text-[22px] leading-7 font-semibold">{cost}</p>
        </div>
      </div>
    </article>
  )
}
