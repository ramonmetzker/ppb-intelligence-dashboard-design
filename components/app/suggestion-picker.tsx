'use client'

import { ArrowCounterClockwise, Sparkle } from '@phosphor-icons/react'
import {
  REQUIRED_SCORE,
  fmt,
  fmtCost,
  fmtCreated,
  fmtSigned,
} from '@/lib/ppb-model'
import { Panel } from '@/components/app/panel'
import { usePlan } from '@/components/app/plan-provider'
import { statusText } from '@/components/app/status-chip'
import { cn } from '@/lib/utils'

const MIN = 610
const MAX = 700
const pct = (v: number) => `${Math.min(100, Math.max(0, ((v - MIN) / (MAX - MIN)) * 100))}%`

export function SuggestionPicker() {
  const { active, origin, plans, freshIds, applySuggestion, resetToOrigin } = usePlan()
  const activeId = active?.id ?? 'custom'

  return (
    <Panel
      id="suggestions"
      title="AI suggestions"
      description="Starting points built by the model. Each one fills in the open months, and you can edit from there."
      action={
        activeId === 'custom' ? (
          <div className="flex items-center gap-2">
            <span className="rounded-sm bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-brand-deep">
              Edited simulation
            </span>
            <button
              type="button"
              onClick={resetToOrigin}
              className="flex h-6 items-center gap-1 rounded-md border border-input px-2 text-[11.5px] font-medium transition-colors hover:bg-secondary"
            >
              <ArrowCounterClockwise size={12} aria-hidden="true" />
              Back to {origin.name}
            </button>
          </div>
        ) : (
          <span className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            <Sparkle size={13} weight="fill" className="text-brand" aria-hidden="true" />
            {plans.length} plans simulated
          </span>
        )
      }
      bodyClassName="p-3"
    >
      <div
        role="radiogroup"
        aria-label="AI suggestions"
        className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4"
      >
        {plans.map(({ suggestion, sim }) => {
          const selected = suggestion.id === activeId
          return (
            <button
              key={suggestion.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => applySuggestion(suggestion.id)}
              className={cn(
                'relative flex flex-col gap-2 rounded-md border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                selected
                  ? 'border-brand bg-brand-soft/70'
                  : 'border-border bg-card hover:border-input hover:bg-secondary/60',
              )}
            >
              {selected && (
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] bg-brand" />
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className={cn(
                      'text-[10px] font-medium tracking-[0.08em] uppercase',
                      selected ? 'text-brand-deep' : 'text-muted-foreground',
                    )}
                  >
                    {suggestion.tag}
                    {freshIds.includes(suggestion.id) && (
                      <span className="ml-1.5 rounded-[3px] bg-success px-1 py-px text-[9.5px] leading-3 font-semibold tracking-normal text-white normal-case">
                        New
                      </span>
                    )}
                  </p>
                  <p className="font-display mt-0.5 truncate text-[13.5px] leading-5 font-semibold tracking-tight">
                    {suggestion.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn('num text-[20px] leading-6 font-semibold', statusText(sim.status))}>
                    {fmt(sim.yearEnd)}
                  </p>
                  <p className={cn('num text-[11px] leading-4 font-medium', statusText(sim.status))}>
                    {fmtSigned(sim.gap)}
                  </p>
                </div>
              </div>

              <p className="line-clamp-2 min-h-8 text-[11.5px] leading-4 text-muted-foreground">
                {suggestion.blurb}
              </p>

              <div className="relative h-1 bg-border" aria-hidden="true">
                <div
                  className={cn(
                    'absolute inset-y-0 left-0',
                    sim.status === 'Compliant'
                      ? 'bg-success'
                      : sim.status === 'At risk'
                        ? 'bg-warning'
                        : 'bg-critical',
                  )}
                  style={{ width: pct(sim.yearEnd) }}
                />
                <div
                  className="absolute -top-1 -bottom-1 w-px bg-foreground"
                  style={{ left: pct(REQUIRED_SCORE) }}
                />
              </div>

              <div className="tnum flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{sim.cost > 0 ? fmtCost(sim.cost) : 'No spend'}</span>
                <span>{sim.confidence}% confidence</span>
              </div>
              <p className="text-[10.5px] leading-3 text-muted-foreground">
                Created {fmtCreated(suggestion.createdAt)}
              </p>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
