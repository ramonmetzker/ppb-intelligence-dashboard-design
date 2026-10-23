'use client'

import { useState } from 'react'
import { ArrowCounterClockwise } from '@phosphor-icons/react'
import {
  BASE_PLAN,
  ITEMS,
  OPEN_MONTHS,
  WEIGHT,
  ceilingFor,
  fmtPercent,
  fmtSigned,
  type ItemKey,
} from '@/lib/ppb-model'
import { Panel } from '@/components/app/panel'
import { usePlan } from '@/components/app/plan-provider'
import { cn } from '@/lib/utils'

export function PlanEditor() {
  const { plan, sim, setShare, resetItem, resetToForecast } = usePlan()
  const edited = sim.changes.length > 0

  return (
    <Panel
      id="editor"
      title="Local share for the open months"
      description="Type a percentage or drag the slider. Points, spend and risk update as you go."
      action={
        <button
          type="button"
          onClick={resetToForecast}
          disabled={!edited}
          className="flex h-6 items-center gap-1 rounded-md border border-input px-2 text-[11.5px] font-medium transition-colors hover:bg-secondary disabled:pointer-events-none disabled:opacity-40"
        >
          <ArrowCounterClockwise size={12} aria-hidden="true" />
          Reset to forecast
        </button>
      }
      bodyClassName="p-0"
    >
      <div className="hidden grid-cols-[minmax(0,1.05fr)_72px_minmax(0,1.2fr)_minmax(0,1.2fr)_72px] items-end gap-4 border-b border-border px-4 py-2 text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase md:grid">
        <span>PPB item</span>
        <span className="text-right">Share to Oct</span>
        <span>{OPEN_MONTHS[0]} local share</span>
        <span>{OPEN_MONTHS[1]} local share</span>
        <span className="text-right">Points</span>
      </div>

      <ul className="flex flex-col">
        {ITEMS.map((item) => {
          const row = sim.items.find((r) => r.key === item.key)!
          const touched =
            Math.abs(plan[item.key][0] - BASE_PLAN[item.key][0]) >= 0.05 ||
            Math.abs(plan[item.key][1] - BASE_PLAN[item.key][1]) >= 0.05
          return (
            <li
              key={item.key}
              className="grid grid-cols-1 items-center gap-x-4 gap-y-2 border-b border-border/70 px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1.05fr)_72px_minmax(0,1.2fr)_minmax(0,1.2fr)_72px]"
            >
              <div className="flex min-w-0 items-start gap-2">
                <span
                  aria-hidden="true"
                  className="mt-1 size-2 shrink-0 rounded-[1px]"
                  style={{ background: item.color }}
                />
                <div className="min-w-0">
                  <p className="truncate text-[13px] leading-5 font-medium">{item.name}</p>
                  <p className="tnum truncate text-[11px] leading-4 text-muted-foreground">
                    {(WEIGHT[item.key] / 100).toFixed(2)} pts per pp of full-year share
                  </p>
                  {touched && (
                    <button
                      type="button"
                      onClick={() => resetItem(item.key)}
                      className="mt-0.5 text-[11px] font-medium text-brand hover:underline"
                    >
                      Reset item
                    </button>
                  )}
                </div>
              </div>

              <p className="num text-[13px] font-medium md:text-right">
                <span className="mr-2 text-[11px] font-normal text-muted-foreground md:hidden">
                  Share to Oct
                </span>
                {fmtPercent(row.shareNow)}
              </p>

              {([0, 1] as const).map((open) => (
                <ShareCell
                  key={open}
                  itemKey={item.key}
                  itemName={item.name}
                  open={open}
                  value={plan[item.key][open]}
                  onChange={(v) => setShare(item.key, open, v)}
                />
              ))}

              <p
                className={cn(
                  'num text-[13px] font-semibold md:text-right',
                  Math.abs(row.delta) < 0.005
                    ? 'text-muted-foreground'
                    : row.delta > 0
                      ? 'text-success'
                      : 'text-critical',
                )}
              >
                <span className="mr-2 text-[11px] font-normal text-muted-foreground md:hidden">
                  Points
                </span>
                {Math.abs(row.delta) < 0.005 ? '0.00' : fmtSigned(row.delta)}
              </p>
            </li>
          )
        })}
      </ul>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border bg-secondary/50 px-4 py-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-px bg-foreground" />
          AI forecast
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-px bg-warning" />
          Supplier ceiling
        </span>
        <span>Points are the change in the year-end score versus the forecast.</span>
      </div>
    </Panel>
  )
}

function ShareCell({
  itemKey,
  itemName,
  open,
  value,
  onChange,
}: {
  itemKey: ItemKey
  itemName: string
  open: 0 | 1
  value: number
  onChange: (value: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const base = BASE_PLAN[itemKey][open]
  const ceiling = ceilingFor(itemKey, open)
  const lo = Math.max(0, Math.floor(base - 20))
  const hi = Math.min(100, Math.ceil(ceiling + 8))
  const at = (v: number) => `${Math.min(100, Math.max(0, ((v - lo) / (hi - lo)) * 100))}%`
  const delta = value - base
  const over = value > ceiling + 0.05
  const label = `${itemName} local share in ${OPEN_MONTHS[open]}`

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <label className="relative">
          <span className="sr-only">{label}</span>
          <input
            type="number"
            inputMode="decimal"
            step={0.5}
            min={0}
            max={100}
            value={draft ?? value.toFixed(1)}
            onChange={(e) => {
              setDraft(e.target.value)
              const parsed = parseFloat(e.target.value)
              if (!Number.isNaN(parsed)) onChange(parsed)
            }}
            onBlur={() => setDraft(null)}
            className={cn(
              'num h-7 w-[84px] rounded-md border bg-card pr-6 pl-2 text-right text-[13px] font-medium outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
              over ? 'border-warning text-warning' : 'border-input',
            )}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[11px] text-muted-foreground"
          >
            %
          </span>
        </label>
        <span
          className={cn(
            'num text-[11.5px]',
            Math.abs(delta) < 0.05
              ? 'text-muted-foreground'
              : delta > 0
                ? 'text-success'
                : 'text-critical',
          )}
        >
          {Math.abs(delta) < 0.05 ? 'forecast' : `${fmtSigned(delta, 1)} pp`}
        </span>
        {over && <span className="text-[11px] font-medium text-warning">Above ceiling</span>}
      </div>

      <div className="relative">
        <input
          type="range"
          className="lever"
          aria-label={label}
          min={lo}
          max={hi}
          step={0.5}
          value={Math.min(hi, Math.max(lo, value))}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{ ['--fill' as string]: at(value) }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0.5 bottom-0.5 w-px bg-foreground"
          style={{ left: at(base) }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-0.5 bottom-0.5 w-px bg-warning"
          style={{ left: at(ceiling) }}
        />
      </div>
    </div>
  )
}
