import type { Simulation } from '@/lib/ppb-model'
import { Panel } from '@/components/app/panel'
import { cn } from '@/lib/utils'

const SCALE = 24

export function DriversPanel({ sim }: { sim: Simulation }) {
  return (
    <Panel
      id="drivers"
      title="Risk drivers"
      description="Points each driver costs the year-end score, before and after this scenario."
      className="h-full"
      action={
        <ul className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-[1px] bg-border" />
            Forecast
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2 rounded-[1px] bg-warning" />
            Scenario
          </li>
        </ul>
      }
      bodyClassName="p-0"
    >
      <ul className="flex flex-col divide-y divide-border/70">
        {sim.drivers.map((d) => {
          const resolved = d.residual > -0.05 && d.baseline < -0.05
          const worse = d.residual < d.baseline - 0.05
          return (
            <li
              key={d.id}
              className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_92px] items-center gap-4 px-4 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-medium">{d.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{d.reason}</p>
              </div>
              <div className="relative h-4" aria-hidden="true">
                <div
                  className="absolute inset-y-0 left-0 bg-border transition-all duration-500"
                  style={{ width: `${(Math.abs(d.baseline) / SCALE) * 100}%` }}
                />
                <div
                  className={cn(
                    'absolute top-1 bottom-1 left-0 transition-all duration-500',
                    worse ? 'bg-critical' : 'bg-warning',
                  )}
                  style={{ width: `${(Math.abs(d.residual) / SCALE) * 100}%` }}
                />
              </div>
              <p className="num text-right text-[12.5px]">
                <span className="text-muted-foreground">{d.baseline.toFixed(1)}</span>
                <span className="text-muted-foreground"> {'\u2192'} </span>
                <span
                  className={cn(
                    'font-semibold',
                    resolved ? 'text-success' : worse ? 'text-critical' : 'text-foreground',
                  )}
                >
                  {d.residual === 0 ? '0.0' : d.residual.toFixed(1)}
                </span>
              </p>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
