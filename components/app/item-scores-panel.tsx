import { fmt, fmtSigned, type Simulation } from '@/lib/ppb-model'
import { Panel } from '@/components/app/panel'
import { cn } from '@/lib/utils'

const SCALE_MAX = 250

const w = (v: number) => `${(Math.max(0, v) / SCALE_MAX) * 100}%`

export function ItemScoresPanel({ sim }: { sim: Simulation }) {
  const totals = sim.items.reduce(
    (t, i) => ({
      current: t.current + i.current,
      forecast: t.forecast + i.forecast,
      scenario: t.scenario + i.scenario,
    }),
    { current: 0, forecast: 0, scenario: 0 },
  )

  return (
    <Panel
      title="Score by PPB item"
      description="Where each item stands now, in the forecast, and in the scenario."
      className="h-full"
      action={
        <ul className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <Key className="bg-foreground" label="Now" />
          <Key className="bg-[#9dbcff]" label="To forecast" />
          <Key className="bg-brand" label="Scenario change" />
        </ul>
      }
      bodyClassName="p-0"
    >
      <table className="w-full text-[12px]">
        <caption className="sr-only">PPB score by item</caption>
        <thead>
          <tr className="border-b border-border text-left text-[10px] tracking-[0.08em] text-muted-foreground uppercase">
            <th scope="col" className="px-4 py-2 font-medium">Item</th>
            <th scope="col" className="px-2 py-2 text-right font-medium">Now</th>
            <th scope="col" className="px-2 py-2 text-right font-medium">Forecast</th>
            <th scope="col" className="w-[34%] px-3 py-2 font-medium">Composition</th>
            <th scope="col" className="px-2 py-2 text-right font-medium">Scenario</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Change</th>
          </tr>
        </thead>
        <tbody>
          {sim.items.map((item) => {
            const up = item.delta > 0.004
            const down = item.delta < -0.004
            return (
              <tr key={item.key} className="border-b border-border/70">
                <th scope="row" className="px-4 py-2 text-left font-medium">
                  {item.name}
                </th>
                <td className="num px-2 py-2 text-right text-muted-foreground">
                  {fmt(item.current)}
                </td>
                <td className="num px-2 py-2 text-right text-muted-foreground">
                  {fmt(item.forecast)}
                </td>
                <td className="px-3 py-2">
                  <div className="relative flex h-2.5 w-full bg-secondary" aria-hidden="true">
                    <div className="h-full bg-foreground" style={{ width: w(item.current) }} />
                    <div
                      className="h-full bg-[#9dbcff]"
                      style={{ width: w(item.forecast - item.current) }}
                    />
                    {up && (
                      <div
                        className="h-full bg-brand transition-all duration-500"
                        style={{ width: w(item.delta) }}
                      />
                    )}
                    {down && (
                      <div
                        className="absolute top-0 h-full bg-critical/80 transition-all duration-500"
                        style={{ left: w(item.scenario), width: w(-item.delta) }}
                      />
                    )}
                  </div>
                </td>
                <td className="num px-2 py-2 text-right font-semibold">
                  {fmt(item.scenario)}
                </td>
                <td
                  className={cn(
                    'num px-4 py-2 text-right font-medium',
                    up ? 'text-success' : down ? 'text-critical' : 'text-muted-foreground',
                  )}
                >
                  {up || down ? fmtSigned(item.delta) : '\u2013'}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="bg-secondary/60 font-medium">
            <th scope="row" className="px-4 py-2 text-left">Total</th>
            <td className="num px-2 py-2 text-right">{fmt(totals.current)}</td>
            <td className="num px-2 py-2 text-right">{fmt(totals.forecast)}</td>
            <td />
            <td className="num px-2 py-2 text-right text-brand">{fmt(totals.scenario)}</td>
            <td
              className={cn(
                'num px-4 py-2 text-right',
                sim.gain > 0 ? 'text-success' : sim.gain < 0 ? 'text-critical' : 'text-muted-foreground',
              )}
            >
              {sim.gain === 0 ? '\u2013' : fmtSigned(sim.gain)}
            </td>
          </tr>
        </tfoot>
      </table>
    </Panel>
  )
}

function Key({ className, label }: { className: string; label: string }) {
  return (
    <li className="flex items-center gap-1.5">
      <span aria-hidden="true" className={cn('size-2 rounded-[1px]', className)} />
      {label}
    </li>
  )
}
