import {
  CheckCircle,
  CircleDashed,
  WarningCircle,
} from '@phosphor-icons/react/dist/ssr'
import { closingSteps } from '@/lib/ppb-data'
import { cn } from '@/lib/utils'

const STATE = {
  Complete: { icon: CheckCircle, tone: 'text-success', line: 'bg-success/40' },
  Warning: { icon: WarningCircle, tone: 'text-warning', line: 'bg-border' },
  Pending: { icon: CircleDashed, tone: 'text-muted-foreground', line: 'bg-border' },
} as const

export function OctoberClosing() {
  return (
    <section
      aria-labelledby="closing-heading"
      className="flex flex-col gap-6 border-t border-border pt-8 xl:flex-row xl:items-center"
    >
      <div className="xl:w-[180px] xl:shrink-0">
        <h2 id="closing-heading" className="text-[19px] font-semibold tracking-tight">
          October closing
        </h2>
        <p className="mt-1 text-[12px] text-muted-foreground">5 of 7 stages complete</p>
      </div>

      <ol className="grid flex-1 grid-cols-2 gap-y-5 sm:grid-cols-4 xl:grid-cols-7">
        {closingSteps.map((step, i) => {
          const s = STATE[step.state]
          const Icon = s.icon
          const first = i === 0
          const last = i === closingSteps.length - 1
          return (
            <li key={step.label} className="min-w-0">
              <div className="flex items-center" aria-hidden="true">
                <span
                  className={cn(
                    'h-px flex-1',
                    first ? 'bg-transparent' : closingSteps[i - 1].state === 'Complete' ? 'bg-success/40' : 'bg-border',
                  )}
                />
                <Icon size={22} weight={step.state === 'Pending' ? 'regular' : 'fill'} className={s.tone} />
                <span className={cn('h-px flex-1', last ? 'bg-transparent' : s.line)} />
              </div>
              <div className="mt-2 px-2 text-center">
                <p className="text-[12px] leading-4 font-medium text-balance">{step.label}</p>
                <p className={cn('mt-0.5 text-[11px]', s.tone)}>{step.state}</p>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="border-t border-border pt-5 xl:w-[150px] xl:shrink-0 xl:border-t-0 xl:border-l xl:pt-0 xl:pl-6">
        <p className="eyebrow">Data quality</p>
        <p className="num-mono mt-1.5 text-[30px] leading-none font-medium">
          98.7%
        </p>
      </div>
    </section>
  )
}
