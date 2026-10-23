import {
  REQUIRED_SCORE,
  fmt,
  fmtSigned,
  type Simulation,
} from '@/lib/ppb-model'
import { Panel } from '@/components/app/panel'
import { cn } from '@/lib/utils'

const MIN = 600
const MAX = 700
const TICKS = [600, 620, 640, 660, 680, 700]
const at = (v: number) => Math.min(100, Math.max(0, ((v - MIN) / (MAX - MIN)) * 100))

export function BridgePanel({ sim }: { sim: Simulation }) {
  return (
    <Panel
      title="Path from forecast to plan"
      description="Points each item adds to or removes from the year-end score."
      className="h-full"
      bodyClassName="p-3"
    >
      <div
        role="img"
        aria-label={`Bridge from forecast 641.2 to plan ${sim.yearEnd}: ${sim.steps
          .filter((s) => s.kind !== 'total')
          .map((s) => `${s.label} ${fmtSigned(s.end - s.start)}`)
          .join(', ') || 'no changes'}.`}
      >
        <div className="relative">
        <ul className="flex flex-col">
          {sim.steps.map((step) => {
            const isTotal = step.kind === 'total'
            const lo = isTotal ? MIN : Math.min(step.start, step.end)
            const hi = Math.max(step.start, step.end)
            const delta = step.end - step.start
            const isScenario = step.label === 'Plan'
            return (
              <li
                key={step.label}
                className="grid h-8 grid-cols-[132px_1fr_56px] items-center gap-2 border-b border-border/70 last:border-b-0"
              >
                <span
                  className={cn(
                    'truncate text-[12px]',
                    isTotal ? 'font-medium' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
                <div className="relative h-full">
                  <div
                    className={cn(
                      'absolute top-1/2 h-3.5 -translate-y-1/2 transition-all duration-500 ease-out',
                      isTotal
                        ? isScenario
                          ? 'bg-brand'
                          : 'bg-foreground/80'
                        : step.kind === 'up'
                          ? 'bg-success'
                          : 'bg-critical',
                    )}
                    style={{ left: `${at(lo)}%`, width: `${at(hi) - at(lo)}%` }}
                  />
                </div>
                <span
                  className={cn(
                    'num text-right text-[12.5px] font-medium',
                    !isTotal && (delta >= 0 ? 'text-success' : 'text-critical'),
                  )}
                >
                  {isTotal ? fmt(step.end) : fmtSigned(delta)}
                </span>
              </li>
            )
          })}
        </ul>

        {/* shared axis and target line, aligned to the bar track column */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-[64px] left-[140px]"
        >
          <div
            className="absolute top-0 bottom-0 w-px bg-foreground"
            style={{ left: `${at(REQUIRED_SCORE)}%` }}
          />
        </div>
        </div>
        <div
          aria-hidden="true"
          className="relative mt-1.5 mr-[64px] ml-[140px] h-4"
        >
          {TICKS.map((t) => (
            <span
              key={t}
              className="num absolute -translate-x-1/2 text-[10px] text-muted-foreground/80"
              style={{ left: `${at(t)}%` }}
            >
              {t}
            </span>
          ))}
        </div>
        <p className="mt-1 mr-[64px] ml-[140px] text-[10.5px] text-muted-foreground">
          Black line marks the {REQUIRED_SCORE} requirement.
        </p>
      </div>
    </Panel>
  )
}
