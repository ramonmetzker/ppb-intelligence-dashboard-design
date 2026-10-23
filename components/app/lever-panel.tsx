'use client'

import { Sparkle } from '@phosphor-icons/react'
import {
  buildReadout,
  fmt,
  fmtCost,
  fmtSigned,
  type LeverKey,
  type Simulation,
} from '@/lib/ppb-model'
import { Panel } from '@/components/app/panel'
import { cn } from '@/lib/utils'

export function LeverPanel({
  sim,
  onChange,
}: {
  sim: Simulation
  onChange: (key: LeverKey, value: number) => void
}) {
  const readout = buildReadout(sim)

  return (
    <Panel
      title="What changes"
      description="Levers behind this scenario. Drag any slider to fine-tune it."
      className="h-full"
      action={
        <p className="num text-right text-[12px] leading-4 font-medium">
          <span className={sim.gain >= 0 ? 'text-success' : 'text-critical'}>
            {fmtSigned(sim.gain)} pts
          </span>
          <span className="text-muted-foreground"> / {fmtCost(sim.cost)}</span>
        </p>
      }
      bodyClassName="flex flex-col gap-3 p-3"
    >
      <div className="rounded-md border border-brand/20 bg-brand-soft/60 p-2.5">
        <p className="flex items-center gap-1.5 text-[10px] font-medium tracking-[0.08em] text-brand-deep uppercase">
          <Sparkle size={11} weight="fill" aria-hidden="true" />
          Model read-out
        </p>
        <ul aria-live="polite" className="mt-1 flex flex-col gap-1 text-[12px] leading-[1.45]">
          {readout.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <ul className="flex flex-col divide-y divide-border">
        {sim.leverRows.map((row) => {
          const { def } = row
          const changed = Math.abs(row.delta) > 0.001
          const fill = ((row.delta - def.min) / (def.max - def.min)) * 100
          const unit = def.key === 'mix' ? '%' : '%'
          return (
            <li key={def.key} className="flex flex-col gap-1 py-2.5 first:pt-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-3">
                <label
                  htmlFor={`lever-${def.key}`}
                  className="text-[12.5px] leading-4 font-medium"
                >
                  {def.label}
                </label>
                <p className="num shrink-0 text-[12.5px] leading-4">
                  {changed && (
                    <span className="text-muted-foreground">
                      {def.base.toFixed(def.key === 'mix' ? 0 : 1)}
                      {unit} {'\u2192 '}
                    </span>
                  )}
                  <span className={cn('font-semibold', changed && 'text-brand')}>
                    {row.value.toFixed(def.key === 'mix' ? 0 : 1)}
                    {unit}
                  </span>
                </p>
              </div>
              <input
                id={`lever-${def.key}`}
                type="range"
                className="lever"
                min={def.min}
                max={def.max}
                step={def.step}
                value={row.delta}
                style={{ ['--fill' as string]: `${fill}%` }}
                onChange={(e) => onChange(def.key, Number(e.target.value))}
                aria-valuetext={`${row.value.toFixed(1)} percent, ${fmtSigned(row.pts)} points`}
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="truncate pr-3">{def.detail}</span>
                <span className="num shrink-0">
                  <span
                    className={cn(
                      'font-medium',
                      row.pts > 0 ? 'text-success' : row.pts < 0 ? 'text-critical' : '',
                    )}
                  >
                    {changed ? `${fmtSigned(row.pts)} pts` : `${fmt(0)} pts`}
                  </span>
                  {row.cost > 0 && <span> / {fmtCost(row.cost)}</span>}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
