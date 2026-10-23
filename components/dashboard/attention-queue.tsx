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
      <ul className="divide-y divide-border border-y border-border">
        {attention.map((item) => {
          const Icon = ICONS[item.icon]
          return (
            <li key={item.text}>
              <a
                href="#"
                className="group flex items-center gap-4 px-2 py-4 transition-colors hover:bg-secondary/60"
              >
                <Icon
                  size={18}
                  className="shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="flex-1 text-[14px] font-medium">{item.text}</span>
                <span className="num-mono w-10 text-right text-[18px] font-medium">
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
