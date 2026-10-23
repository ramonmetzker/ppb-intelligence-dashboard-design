'use client'

import { Lock, LockOpen, Play, Stop } from '@phosphor-icons/react'
import { BASELINE, ITEMS, REQUIRED_SCORE, fmt, fmtCost, fmtSigned } from '@/lib/ppb-model'
import { LIMITS, targetScore } from '@/lib/planner-agent'
import { Segmented } from '@/components/app/segmented'
import { useAgent } from '@/components/agent/agent-provider'
import { cn } from '@/lib/utils'

function Field({
  label,
  value,
  children,
}: {
  label: string
  value: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[11.5px] font-medium text-foreground">{label}</span>
        <span className="num text-[12px] font-semibold">{value}</span>
      </div>
      {children}
    </div>
  )
}

function Range({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <input
      type="range"
      aria-label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-4 w-full cursor-pointer accent-brand disabled:cursor-not-allowed disabled:opacity-50"
    />
  )
}

export function BriefPanel() {
  const { params, patchParams, run, start, stop } = useAgent()
  const running = run?.status === 'running'
  const gap = BASELINE.yearEnd - REQUIRED_SCORE

  return (
    <section aria-label="Brief" className="flex min-h-0 flex-col bg-card">
      <div className="border-b border-border px-4 py-3">
        <p className="eyebrow">Brief</p>
        <p className="font-display mt-0.5 text-[14px] leading-5 font-semibold tracking-tight">
          What the agent optimizes
        </p>
        <p className="num mt-1.5 text-[11.5px] leading-4 text-muted-foreground">
          Forecast {fmt(BASELINE.yearEnd)} against {REQUIRED_SCORE} required, {fmtSigned(gap)} pts.
        </p>
      </div>

      <fieldset disabled={running} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        <Field label="Objective" value="">
          <Segmented
            label="Objective"
            value={params.objective}
            onChange={(objective) => patchParams({ objective })}
            options={[
              { value: 'min-cost', label: 'Minimize spend' },
              { value: 'max-score', label: 'Maximize score' },
            ]}
          />
        </Field>

        <Field
          label="Target score"
          value={`${targetScore(params).toFixed(1)}  (+${params.margin.toFixed(1)})`}
        >
          <Range
            label="Margin over the required score"
            value={params.margin}
            min={LIMITS.margin[0]}
            max={LIMITS.margin[1]}
            step={0.5}
            onChange={(margin) => patchParams({ margin })}
          />
        </Field>

        <Field label="Spend cap" value={fmtCost(params.budget)}>
          <Range
            label="Spend cap in thousands of dollars"
            value={params.budget}
            min={LIMITS.budget[0]}
            max={LIMITS.budget[1]}
            step={100}
            onChange={(budget) => patchParams({ budget })}
          />
        </Field>

        <Field label="Confidence floor" value={`${params.confidenceFloor}%`}>
          <Range
            label="Lowest acceptable confidence"
            value={params.confidenceFloor}
            min={LIMITS.confidenceFloor[0]}
            max={LIMITS.confidenceFloor[1]}
            step={1}
            onChange={(confidenceFloor) => patchParams({ confidenceFloor })}
          />
        </Field>

        <Field label="Months to change" value="">
          <Segmented
            label="Months to change"
            value={params.months}
            onChange={(months) => patchParams({ months })}
            options={[
              { value: 'both', label: 'Nov and Dec' },
              { value: 'dec', label: 'Dec only' },
            ]}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11.5px] font-medium">Locked items</span>
          <div className="flex flex-wrap gap-1.5">
            {ITEMS.map((item) => {
              const locked = params.locked.includes(item.key)
              const Icon = locked ? Lock : LockOpen
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={locked}
                  onClick={() =>
                    patchParams({
                      locked: locked
                        ? params.locked.filter((k) => k !== item.key)
                        : [...params.locked, item.key],
                    })
                  }
                  className={cn(
                    'flex h-7 items-center gap-1.5 rounded-md border px-2 text-[11.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50',
                    locked
                      ? 'border-brand bg-brand-soft text-brand-deep'
                      : 'border-border bg-card text-muted-foreground hover:border-input hover:text-foreground',
                  )}
                >
                  <Icon size={12} weight={locked ? 'fill' : 'regular'} aria-hidden="true" />
                  {item.name}
                </button>
              )
            })}
          </div>
          <p className="text-[11px] leading-4 text-muted-foreground">
            Locked items keep the forecast share. The agent plans around them.
          </p>
        </div>
      </fieldset>

      <div className="border-t border-border p-3">
        {running ? (
          <button
            type="button"
            onClick={stop}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-input bg-card text-[12.5px] font-medium transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Stop size={14} weight="fill" aria-hidden="true" />
            Stop run
          </button>
        ) : (
          <button
            type="button"
            onClick={() => start()}
            className="flex h-9 w-full items-center justify-center gap-2 rounded-md bg-brand text-[12.5px] font-medium text-white transition-[filter,transform] hover:brightness-110 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Play size={14} weight="fill" aria-hidden="true" />
            {run ? 'Run again' : 'Run simulation'}
          </button>
        )}
      </div>
    </section>
  )
}
