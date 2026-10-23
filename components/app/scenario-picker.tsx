'use client'

import { useMemo } from 'react'
import { ArrowCounterClockwise, Sparkle } from '@phosphor-icons/react'
import {
  REQUIRED_SCORE,
  SCENARIOS,
  fmt,
  fmtCost,
  fmtSigned,
  simulate,
  type Scenario,
} from '@/lib/ppb-model'
import { Panel } from '@/components/app/panel'
import { statusText } from '@/components/app/status-chip'
import { cn } from '@/lib/utils'

const MIN = 610
const MAX = 700
const pct = (v: number) => `${Math.min(100, Math.max(0, ((v - MIN) / (MAX - MIN)) * 100))}%`

export function ScenarioPicker({
  activeId,
  customFrom,
  onSelect,
  onReset,
}: {
  activeId: string
  customFrom?: string
  onSelect: (scenario: Scenario) => void
  onReset: () => void
}) {
  const results = useMemo(
    () => SCENARIOS.map((s) => ({ scenario: s, sim: simulate(s.levers) })),
    [],
  )

  return (
    <Panel
      id="scenarios"
      title="AI scenarios"
      description="Simulated by the PPB model. Select one and the whole page recalculates."
      action={
        activeId === 'custom' ? (
          <div className="flex items-center gap-2">
            <span className="rounded-sm bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-brand-deep">
              Custom levers
            </span>
            <button
              type="button"
              onClick={onReset}
              className="flex h-6 items-center gap-1 rounded-md border border-input px-2 text-[11.5px] font-medium transition-colors hover:bg-secondary"
            >
              <ArrowCounterClockwise size={12} aria-hidden="true" />
              Reset{customFrom ? ` to ${customFrom}` : ''}
            </button>
          </div>
        ) : (
          <span className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            <Sparkle size={13} weight="fill" className="text-brand" aria-hidden="true" />
            {SCENARIOS.length} scenarios simulated
          </span>
        )
      }
      bodyClassName="p-3"
    >
      <div
        role="radiogroup"
        aria-label="Scenarios"
        className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4"
      >
        {results.map(({ scenario, sim }) => {
          const selected = scenario.id === activeId
          return (
            <button
              key={scenario.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(scenario)}
              className={cn(
                'group relative flex flex-col gap-2 rounded-md border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
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
                    {scenario.tag}
                  </p>
                  <p className="font-display mt-0.5 truncate text-[13.5px] leading-5 font-semibold tracking-tight">
                    {scenario.name}
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
                {scenario.blurb}
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
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
