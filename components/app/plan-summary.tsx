'use client'

import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react'
import {
  ITEMS,
  BASE_PLAN,
  SUGGESTIONS,
  fmtSigned,
} from '@/lib/ppb-model'
import { Panel } from '@/components/app/panel'
import { usePlan } from '@/components/app/plan-provider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export function PlanSummary() {
  const { plan, sim, active, applySuggestion } = usePlan()
  const value = active?.id ?? 'custom'

  return (
    <Panel
      id="plan"
      title="Plan for November and December"
      description="Local share you commit to in the months still open."
      className="h-full"
      action={
        <Select value={value} onValueChange={(id) => id && id !== 'custom' && applySuggestion(id)}>
          <SelectTrigger
            aria-label="Choose a plan"
            className="h-7 w-[168px] rounded-md border-input bg-card text-[12px] font-medium shadow-none"
          >
            <SelectValue>{active?.name ?? 'Custom plan'}</SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} align="end">
            {SUGGESTIONS.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
            {!active && (
              <SelectItem value="custom" disabled>
                Custom plan
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      }
      bodyClassName="flex flex-col p-0"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_88px_88px_64px] items-center gap-2 px-4 py-1.5 text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
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
                    <span className={cn('font-medium', changed && 'text-brand')}>
                      {plan[item.key][open].toFixed(1)}%
                    </span>
                    <span
                      className={cn(
                        'block text-[10.5px] leading-3',
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
                  'num text-right text-[12.5px] font-medium',
                  Math.abs(row.delta) < 0.005
                    ? 'text-muted-foreground'
                    : row.delta > 0
                      ? 'text-success'
                      : 'text-critical',
                )}
              >
                {Math.abs(row.delta) < 0.005 ? '0.00' : fmtSigned(row.delta)}
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
