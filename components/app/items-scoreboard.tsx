'use client'

import { useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { fmt, fmtPercent, fmtSigned } from '@/lib/ppb-model'
import { Panel } from '@/components/app/panel'
import { usePlan } from '@/components/app/plan-provider'
import { useUiParameters } from '@/components/ui-parameters/ui-parameters-provider'
import { additionalParameters, isItemDisplayed } from '@/lib/ui-parameters/behavior'
import { itemNameForUiParameter } from '@/lib/ui-parameters/data'
import { cn } from '@/lib/utils'

export function ItemsScoreboard() {
  const { sim, planName } = usePlan()
  const { parameters } = useUiParameters()
  const [expanded, setExpanded] = useState(false)
  const visibleRows = useMemo(() => sim.items.filter((row) => isItemDisplayed(row.name, parameters)), [sim.items, parameters])
  const extraItems = useMemo(() => additionalParameters(parameters), [parameters])
  const total = (pick: (r: (typeof sim.items)[number]) => number) =>
    visibleRows.reduce((sum, r) => sum + pick(r), 0)

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
          {visibleRows.map((r) => (
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
          {extraItems.length > 0 && (
            <>
              <tr className="border-b border-border/70">
                <th scope="row" colSpan={9} className="px-4 py-2 text-left">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setExpanded((current) => !current)}
                    className="group flex w-full items-center gap-2 text-left text-[12px] font-semibold focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded border border-border bg-muted/50 text-muted-foreground transition-colors group-hover:border-brand/50 group-hover:text-brand">
                      <ChevronRight
                        aria-hidden="true"
                        className={cn('size-3.5 transition-transform duration-200', expanded && 'rotate-90')}
                      />
                    </span>
                    <span>Additional Items</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
                      {extraItems.length}
                    </span>
                  </button>
                </th>
              </tr>
              {expanded && extraItems.map((parameter, index) => (
                <tr
                  key={parameter.id}
                  className="additional-item-row border-b border-border/70"
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  <th scope="row" className="px-4 py-2 pl-11 text-left font-normal text-muted-foreground">
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-muted-foreground/45" />
                      {itemNameForUiParameter(parameter.itemId)}
                    </span>
                  </th>
                  <td colSpan={8} className="px-3 py-2 text-right text-muted-foreground/70">—</td>
                </tr>
              ))}
            </>
          )}
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
