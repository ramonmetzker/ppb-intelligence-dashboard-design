'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Popover } from '@base-ui/react/popover'
import { ArrowRight, CaretUpDown, Check } from '@phosphor-icons/react'
import {
  REQUIRED_SCORE,
  SUGGESTION_RESULTS,
  fmt,
  fmtCost,
  fmtSigned,
  type Simulation,
} from '@/lib/ppb-model'
import { CountUp } from '@/components/app/count-up'
import { usePlan } from '@/components/app/plan-provider'
import { StatusChip, statusText } from '@/components/app/status-chip'
import { cn } from '@/lib/utils'

type PlanOption = {
  id: string
  name: string
  tag: string
  blurb: string
  sim: Simulation
}

function usePlanOptions() {
  const { active, sim } = usePlan()
  const options: PlanOption[] = SUGGESTION_RESULTS.map(({ suggestion, sim: result }) => ({
    id: suggestion.id,
    name: suggestion.name,
    tag: suggestion.tag,
    blurb: suggestion.blurb,
    sim: result,
  }))
  const custom: PlanOption | null = active
    ? null
    : {
        id: 'custom',
        name: 'Custom plan',
        tag: 'Edited by you',
        blurb: 'Your own local share for the open months.',
        sim,
      }
  return { activeId: active?.id ?? 'custom', options, custom }
}

const barTone = (status: Simulation['status']) =>
  status === 'Compliant' ? 'bg-success' : status === 'At risk' ? 'bg-warning' : 'bg-critical'

/* -------------------------------------------------------------------------- */
/* Sidebar: a live card that opens a plan menu                                 */
/* -------------------------------------------------------------------------- */

export function SidebarPlanSwitcher() {
  const [open, setOpen] = useState(false)
  const { sim, planName, applySuggestion } = usePlan()
  const { activeId, options, custom } = usePlanOptions()
  const rows = custom ? [custom, ...options] : options

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={`Active plan: ${planName}. Change plan`}
        className="group relative w-full overflow-hidden rounded-md border border-sidebar-border bg-ink-raised px-2.5 py-2 text-left transition-colors hover:border-brand/60 focus-visible:outline-2 focus-visible:outline-ring data-popup-open:border-brand"
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-x-0 top-0 h-[2px] transition-colors duration-500',
            barTone(sim.status),
          )}
        />
        <span className="flex items-center justify-between">
          <span className="text-[10px] tracking-[0.08em] text-sidebar-foreground/50 uppercase">
            Active plan
          </span>
          <CaretUpDown size={12} className="text-sidebar-foreground/50" aria-hidden="true" />
        </span>
        <span
          key={planName}
          className="animate-in fade-in slide-in-from-bottom-1 mt-0.5 block truncate text-[12px] font-medium text-white duration-300"
        >
          {planName}
        </span>
        <span className="mt-1.5 flex items-center justify-between">
          <CountUp
            value={sim.yearEnd}
            duration={800}
            className="num text-[16px] font-semibold text-white"
          />
          <StatusChip status={sim.status} className="bg-white/10" />
        </span>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="right" align="end" sideOffset={10} className="z-50">
          <Popover.Popup className="w-[348px] origin-(--transform-origin) rounded-lg border border-border bg-popover text-popover-foreground shadow-xl outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <div className="border-b border-border px-3.5 py-2.5">
              <Popover.Title className="font-display text-[13.5px] font-semibold tracking-tight">
                Switch plan
              </Popover.Title>
              <Popover.Description className="mt-0.5 text-[11.5px] leading-4 text-muted-foreground">
                Every page recalculates with the plan you pick. Required score is {REQUIRED_SCORE}.
              </Popover.Description>
            </div>
            <ul className="flex flex-col gap-0.5 p-1.5">
              {rows.map((option) => {
                const selected = option.id === activeId
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        if (option.id !== 'custom') applySuggestion(option.id)
                        setOpen(false)
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-ring',
                        selected ? 'bg-brand-soft' : 'hover:bg-secondary',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'flex size-4 shrink-0 items-center justify-center rounded-[2px] border transition-colors',
                          selected ? 'border-brand bg-brand text-white' : 'border-input',
                        )}
                      >
                        {selected && <Check size={11} weight="bold" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="eyebrow block">{option.tag}</span>
                        <span className="font-display block truncate text-[13px] leading-5 font-semibold tracking-tight">
                          {option.name}
                        </span>
                        <span className="mt-1 block h-[3px] bg-border" aria-hidden="true">
                          <span
                            className={cn('block h-full', barTone(option.sim.status))}
                            style={{
                              width: `${Math.min(100, Math.max(0, ((option.sim.yearEnd - 610) / 90) * 100))}%`,
                            }}
                          />
                        </span>
                      </span>
                      <span className="text-right">
                        <span
                          className={cn(
                            'num block text-[15px] leading-5 font-semibold',
                            statusText(option.sim.status),
                          )}
                        >
                          {fmt(option.sim.yearEnd)}
                        </span>
                        <span className="num block text-[11px] leading-4 text-muted-foreground">
                          {fmtSigned(option.sim.gap)} pts
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="border-t border-border px-3.5 py-2">
              <Link
                href="/simulation"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between text-[12px] font-medium text-brand-deep hover:underline focus-visible:outline-2 focus-visible:outline-ring"
              >
                Fine tune the open months in Simulation
                <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

/* -------------------------------------------------------------------------- */
/* Panel body: the same choice as a live grid                                  */
/* -------------------------------------------------------------------------- */

export function PlanOptionGrid() {
  const { applySuggestion } = usePlan()
  const { activeId, options, custom } = usePlanOptions()
  const rows = custom ? [...options, custom] : options

  return (
    <div role="group" aria-label="Choose a plan" className="grid grid-cols-2 gap-2 p-3">
      {rows.map((option) => {
        const selected = option.id === activeId
        const isCustom = option.id === 'custom'
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => !isCustom && applySuggestion(option.id)}
            className={cn(
              'sheen relative flex flex-col gap-1.5 overflow-hidden rounded-md border p-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              isCustom && 'col-span-2',
              selected
                ? 'border-brand bg-brand-soft/70'
                : 'border-border bg-card hover:border-input hover:bg-secondary/60',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'absolute inset-x-0 top-0 h-[2px] origin-left bg-brand transition-transform duration-500 ease-out',
                selected ? 'scale-x-100' : 'scale-x-0',
              )}
            />
            <span className="flex items-start justify-between gap-2">
              <span className="min-w-0">
                <span
                  className={cn(
                    'block text-[10px] font-medium tracking-[0.08em] uppercase',
                    selected ? 'text-brand-deep' : 'text-muted-foreground',
                  )}
                >
                  {option.tag}
                </span>
                <span className="font-display mt-0.5 block truncate text-[13px] leading-5 font-semibold tracking-tight">
                  {option.name}
                </span>
              </span>
              <CountUp
                value={option.sim.yearEnd}
                duration={900}
                className={cn(
                  'num text-[19px] leading-6 font-semibold',
                  statusText(option.sim.status),
                )}
              />
            </span>
            <span className="relative block h-1 bg-border" aria-hidden="true">
              <span
                className={cn(
                  'absolute inset-y-0 left-0 transition-[width] duration-700 ease-out',
                  barTone(option.sim.status),
                )}
                style={{
                  width: `${Math.min(100, Math.max(0, ((option.sim.yearEnd - 610) / 90) * 100))}%`,
                }}
              />
              <span
                className="absolute -top-1 -bottom-1 w-px bg-foreground"
                style={{ left: `${((REQUIRED_SCORE - 610) / 90) * 100}%` }}
              />
            </span>
            <span className="tnum flex items-center justify-between text-[11px] text-muted-foreground">
              <span className={cn('font-medium', statusText(option.sim.status))}>
                {fmtSigned(option.sim.gap)} pts
              </span>
              <span>{option.sim.cost > 0 ? fmtCost(option.sim.cost) : 'No spend'}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
