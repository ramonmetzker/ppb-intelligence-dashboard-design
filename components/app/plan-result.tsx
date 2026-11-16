'use client'

import {
  REQUIRED_SCORE,
  buildReadout,
  fmt,
  fmtCost,
  fmtPercent,
  fmtSigned,
} from '@/lib/ppb-model'
import { Panel } from '@/components/app/panel'
import { usePlan } from '@/components/app/plan-provider'
import { StatusChip, statusText } from '@/components/app/status-chip'
import { cn } from '@/lib/utils'

export function PlanResult() {
  const { sim, planName } = usePlan()
  const readout = buildReadout(sim)

  return (
    <Panel
      id="result"
      title="What this plan delivers"
      description={planName}
      className="h-full"
      bodyClassName="flex flex-col gap-4 p-4"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Year-end score</p>
          <p className={cn('num text-[40px] leading-10 font-semibold', statusText(sim.status))}>
            {fmt(sim.yearEnd)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 pb-0.5">
          <StatusChip status={sim.status} />
          <p className={cn('num text-[12.5px] font-medium', statusText(sim.status))}>
            {fmtSigned(sim.gap)} vs {REQUIRED_SCORE}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-border border-y border-border">
        <Stat label="Vs SOP" value={`${fmtSigned(sim.gain)} pts`} />
        <Stat label="Est. spend" value={sim.cost > 0 ? fmtCost(sim.cost) : 'None'} />
        <Stat label="Confidence" value={`${sim.confidence}%`} />
      </dl>

      <div>
        <p className="eyebrow mb-1.5">Open months, SOP to plan</p>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-[10.5px] text-muted-foreground">
              <th scope="col" className="pb-1 font-medium">
                Month
              </th>
              <th scope="col" className="pb-1 text-right font-medium">
                Local share
              </th>
              <th scope="col" className="pb-1 text-right font-medium">
                Points
              </th>
            </tr>
          </thead>
          <tbody>
            {sim.openMonths.map((m) => (
              <tr key={m.month} className="border-t border-border/70">
                <th scope="row" className="py-1.5 text-left font-medium">
                  {m.month}
                </th>
                <td className="num py-1.5 text-right">
                  <span className="text-muted-foreground">{fmtPercent(m.forecastShare)}</span>
                  <span className="text-muted-foreground"> {'\u2192'} </span>
                  <span className="font-semibold">{fmtPercent(m.planShare)}</span>
                </td>
                <td className="num py-1.5 text-right">
                  <span className="text-muted-foreground">{fmt(m.forecastPoints, 1)}</span>
                  <span className="text-muted-foreground"> {'\u2192'} </span>
                  <span className="font-semibold">{fmt(m.planPoints, 1)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-1 text-[10.5px] text-muted-foreground">
          Both columns are accumulated through the month.
        </p>
      </div>

      <ul className="flex flex-col gap-1.5 border-t border-border pt-3">
        {readout.map((line) => (
          <li key={line} className="flex gap-2 text-[12.5px] leading-5">
            <span aria-hidden="true" className="mt-2 size-1 shrink-0 bg-brand" />
            <span className="text-pretty">{line}</span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2 first:pl-0">
      <dt className="text-[10.5px] text-muted-foreground">{label}</dt>
      <dd className="num text-[15px] font-semibold">{value}</dd>
    </div>
  )
}
