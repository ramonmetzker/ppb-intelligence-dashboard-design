'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkle } from '@phosphor-icons/react'
import { ChevronRight } from 'lucide-react'
import { ITEMS, BASE_PLAN, fmtSigned } from '@/lib/ppb-model'
import { CountUp } from '@/components/app/count-up'
import { Panel } from '@/components/app/panel'
import { InlinePlanSwitcher } from '@/components/app/plan-switcher'
import { usePlan } from '@/components/app/plan-provider'
import { useUiParameters } from '@/components/ui-parameters/ui-parameters-provider'
import { additionalParameters, isItemDisplayed } from '@/lib/ui-parameters/behavior'
import { cn } from '@/lib/utils'
import { PlanSummarySkeleton } from '@/components/app/overview-skeletons'

export function PlanSummary() {
  const { plan, sim, isLoading } = usePlan()
  const { parameters } = useUiParameters()
  const [expanded, setExpanded] = useState(false)
  const visibleItems = useMemo(() => ITEMS.filter((item) => isItemDisplayed(item.name, parameters)), [parameters])
  const extraItemIds = useMemo(() => new Set(additionalParameters(parameters).map((parameter) => parameter.itemId)), [parameters])
  const extraItems = useMemo(
    () => ITEMS.filter((item) => extraItemIds.has(item.masterItemId)),
    [extraItemIds],
  )
  if (isLoading) return <PlanSummarySkeleton />

  return (
    <Panel
      id="plan"
      title="Simulation for November and December"
      description="Pick a simulation and the whole app recalculates."
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
        {visibleItems.map((item) => {
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
                      {changed ? `${fmtSigned(delta, 1)} pp` : 'SOP'}
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
        {extraItems.length > 0 && (
          <>
            <li className="border-b border-border/70 px-4 py-2">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded((current) => !current)}
                className="grid w-full grid-cols-[minmax(0,1fr)_88px_88px_64px] items-center gap-2 text-left text-[12.5px] font-semibold focus-visible:outline-2 focus-visible:outline-ring"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded border border-border bg-muted/50 text-muted-foreground transition-colors hover:border-brand/50 hover:text-brand">
                    <ChevronRight
                      aria-hidden="true"
                      className={cn('size-3.5 transition-transform duration-200', expanded && 'rotate-90')}
                    />
                  </span>
                  <span>Additional Items</span>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
                    {extraItems.length}
                  </span>
                </span>
                <span />
                <span />
                <span />
              </button>
            </li>
            {expanded && extraItems.map((item, index) => {
              const row = sim.items.find((candidate) => candidate.key === item.key)!
              return (
                <li
                  key={item.key}
                  className="additional-item-row grid grid-cols-[minmax(0,1fr)_88px_88px_64px] items-center gap-2 border-b border-border/70 px-4 py-2"
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <span className="flex min-w-0 items-center gap-2 text-[12.5px] font-medium">
                    <span aria-hidden="true" className="size-2 shrink-0 rounded-[1px]" style={{ background: item.color }} />
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
                        <span className={cn('block text-[10.5px] leading-3 transition-colors', changed ? delta > 0 ? 'text-success' : 'text-critical' : 'text-muted-foreground/70')}>
                          {changed ? `${fmtSigned(delta, 1)} pp` : 'SOP'}
                        </span>
                      </span>
                    )
                  })}
                  <span className={cn('num text-right text-[12.5px] font-medium transition-colors', Math.abs(row.delta) < 0.005 ? 'text-muted-foreground' : row.delta > 0 ? 'text-success' : 'text-critical')}>
                    <CountUp value={row.delta} signed duration={800} />
                  </span>
                </li>
              )
            })}
          </>
        )}
      </ul>
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border px-4 py-2.5">
        <p className="text-[11.5px] text-muted-foreground">
          {sim.changes.length === 0
            ? 'Matches the SOP.'
            : `${sim.changes.length} ${sim.changes.length === 1 ? 'change' : 'changes'} from the SOP.`}
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
