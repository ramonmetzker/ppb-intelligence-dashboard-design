'use client'

import Link from 'next/link'
import { ArrowRight, Sparkle } from '@phosphor-icons/react'
import { ITEMS, BASE_PLAN, fmtSigned } from '@/lib/ppb-model'
import { CountUp } from '@/components/app/count-up'
import { Panel } from '@/components/app/panel'
import { InlinePlanSwitcher } from '@/components/app/plan-switcher'
import { usePlan } from '@/components/app/plan-provider'
import { cn } from '@/lib/utils'

export function PlanSummary() {
  const { plan, sim } = usePlan()

  return (
    <Panel
      id="plan"
      title="Plan for November and December"
      description="Pick a plan and the whole app recalculates."
      className="h-full"
      action={
        <span className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
          <Sparkle size={13} weight="fill" className="text-brand" aria-hidden="true" />
          Applies to every page
        </span>
      }
      bodyClassName="flex flex-col p-0"
    >
      <InlinePlanSwitcher />

      <div className="grid grid-cols-[minmax(0,1fr)_88px_88px_64px] items-center gap-2 border-t border-border px-4 py-1.5 text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
        <span>Item</span>
        <span className="text-right">Nov</span>
        <span className="text-right">Dec</span>
        <span className="text-right">Points</span>
      </div>
      <ul className="flex flex-col border-t border-border">
        {ITEMS.map((item) => {
          const row = sim.items.find((r) => r.key === item.key)!
          return (
            <li
              key={item.key}
              className="grid grid-cols-[minmax(0,1fr)_88px_88px_64px] items-center gap-2 border-b border-border/70 px-4 py-2 last:border-b-0"
            >
              <span className="flex min-w-0 items-center gap-2 text-[12.5px] font-medium">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-[1px]"
                  style={{ background: item.color }}
                />
                <span className="truncate">{item.name}</span>
              </span>
              {([0, 1] as const).map((open) => {
                const delta = plan[item.key][open] - BASE_PLAN[item.key][open]
                const changed = Math.abs(delta) >= 0.05
                return (
                  <span key={open} className="num text-right text-[12.5px]">
                    <span className={cn('font-medium transition-colors', changed && 'text-brand')}>
                      <CountUp value={plan[item.key][open]} decimals={1} suffix="%" duration={800} />
                    </span>
                    <span
                      className={cn(
                        'block text-[10.5px] leading-3 transition-colors',
                        changed
                          ? delta > 0
                            ? 'text-success'
                            : 'text-critical'
                          : 'text-muted-foreground/70',
                      )}
                    >
                      {changed ? `${fmtSigned(delta, 1)} pp` : 'forecast'}
                    </span>
                  </span>
                )
              })}
              <span
                className={cn(
                  'num text-right text-[12.5px] font-medium transition-colors',
                  Math.abs(row.delta) < 0.005
                    ? 'text-muted-foreground'
                    : row.delta > 0
                      ? 'text-success'
                      : 'text-critical',
                )}
              >
                <CountUp value={row.delta} signed duration={800} />
              </span>
            </li>
          )
        })}
      </ul>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border px-4 py-2.5">
        <p className="text-[11.5px] text-muted-foreground">
          {sim.changes.length === 0
            ? 'Matches the forecast.'
            : `${sim.changes.length} ${sim.changes.length === 1 ? 'change' : 'changes'} from the forecast.`}
        </p>
        <Link
          href="/simulation"
          className="flex h-7 items-center gap-1.5 rounded-md bg-foreground px-2.5 text-[12px] font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Edit plan
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </Panel>
  )
}
