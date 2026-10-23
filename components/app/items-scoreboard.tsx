'use client'

import { fmt, fmtPercent, fmtSigned } from '@/lib/ppb-model'
import { Panel } from '@/components/app/panel'
import { usePlan } from '@/components/app/plan-provider'
import { cn } from '@/lib/utils'

export function ItemsScoreboard() {
  const { sim, planName } = usePlan()
  const total = (pick: (r: (typeof sim.items)[number]) => number) =>
    sim.items.reduce((sum, r) => sum + pick(r), 0)

  return (
    <Panel
      id="scoreboard"
      title="Points by PPB item"
      description={`Accumulated points per item at the October close, in the forecast and in ${planName}.`}
      bodyClassName="overflow-x-auto p-0"
    >
      <table className="w-full min-w-[820px] border-collapse text-[12.5px]">
        <caption className="sr-only">PPB points and local share per item</caption>
        <thead>
          <tr className="border-b border-border bg-secondary/50 text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            <th scope="col" className="px-4 py-2 text-left">
              Item
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              Weight
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              Share to Oct
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              Dec forecast
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              Dec plan
            </th>
            <th scope="col" className="border-l border-border px-3 py-2 text-right">
              Pts now
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              Pts forecast
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              Pts plan
            </th>
            <th scope="col" className="px-4 py-2 text-right">
              Vs forecast
            </th>
          </tr>
        </thead>
        <tbody>
          {sim.items.map((r) => (
            <tr key={r.key} className="border-b border-border/70">
              <th scope="row" className="px-4 py-2 text-left font-medium">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0 rounded-[1px]"
                    style={{ background: r.color }}
                  />
                  <span>
                    {r.name}
                    <span className="block text-[11px] font-normal text-muted-foreground">
                      {r.detail}
                    </span>
                  </span>
                </span>
              </th>
              <td className="num px-3 py-2 text-right text-muted-foreground">{r.weight.toFixed(0)}</td>
              <td className="num px-3 py-2 text-right">{fmtPercent(r.shareNow)}</td>
              <td className="num px-3 py-2 text-right text-muted-foreground">
                {fmtPercent(r.shareForecast)}
              </td>
              <td className="num px-3 py-2 text-right font-medium">{fmtPercent(r.shareScenario)}</td>
              <td className="num border-l border-border px-3 py-2 text-right">{fmt(r.current)}</td>
              <td className="num px-3 py-2 text-right text-muted-foreground">{fmt(r.forecast)}</td>
              <td className="num px-3 py-2 text-right font-semibold">{fmt(r.scenario)}</td>
              <td
                className={cn(
                  'num px-4 py-2 text-right font-medium',
                  Math.abs(r.delta) < 0.005
                    ? 'text-muted-foreground'
                    : r.delta > 0
                      ? 'text-success'
                      : 'text-critical',
                )}
              >
                {Math.abs(r.delta) < 0.005 ? '0.00' : fmtSigned(r.delta)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-foreground/80 bg-secondary/50 font-semibold">
            <th scope="row" className="px-4 py-2 text-left">
              Total score
            </th>
            <td className="num px-3 py-2 text-right text-muted-foreground">
              {total((r) => r.weight).toFixed(0)}
            </td>
            <td colSpan={3} />
            <td className="num border-l border-border px-3 py-2 text-right">
              {fmt(total((r) => r.current))}
            </td>
            <td className="num px-3 py-2 text-right text-muted-foreground">
              {fmt(total((r) => r.forecast))}
            </td>
            <td className="num px-3 py-2 text-right text-brand-deep">{fmt(sim.yearEnd)}</td>
            <td
              className={cn(
                'num px-4 py-2 text-right',
                Math.abs(sim.gain) < 0.005
                  ? 'text-muted-foreground'
                  : sim.gain > 0
                    ? 'text-success'
                    : 'text-critical',
              )}
            >
              {Math.abs(sim.gain) < 0.005 ? '0.00' : fmtSigned(sim.gain)}
            </td>
          </tr>
        </tfoot>
      </table>
    </Panel>
  )
}
