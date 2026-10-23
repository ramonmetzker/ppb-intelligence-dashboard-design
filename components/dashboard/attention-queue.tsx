import {
  CaretRight,
  CurrencyCircleDollar,
  DeviceMobile,
  MapPinLine,
} from '@phosphor-icons/react/dist/ssr'
import { attention, type Risk } from '@/lib/ppb-data'
import { cn } from '@/lib/utils'
import { SectionHeader } from './section-header'

const ICONS = {
  bom: DeviceMobile,
  origin: MapPinLine,
  price: CurrencyCircleDollar,
}

const SEVERITY: Record<Risk, string> = {
  High: 'bg-warning/10 text-warning',
  Medium: 'bg-secondary text-foreground/80',
  Low: 'bg-secondary text-muted-foreground',
}

export function AttentionQueue() {
  return (
    <section aria-labelledby="attention-heading">
      <SectionHeader
        id="attention-heading"
        title="Requires attention"
        description="Open data items blocking the October calculation."
      />
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {attention.map((item) => {
          const Icon = ICONS[item.icon]
          return (
            <li key={item.text}>
              <a
                href="#"
                className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-secondary/60"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground/70">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <span className="flex-1 text-[14px] font-medium">{item.text}</span>
                <span className="tnum w-10 text-right text-[18px] font-semibold">
                  {item.count}
                </span>
                <span
                  className={cn(
                    'w-[72px] rounded-md px-2 py-0.5 text-center text-[11px] font-medium',
                    SEVERITY[item.severity],
                  )}
                >
                  {item.severity}
                </span>
                <CaretRight
                  size={14}
                  className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
