import { CaretRight, CheckCircle, WarningCircle } from '@phosphor-icons/react/dist/ssr'
import { status } from '@/lib/ppb-data'
import { cn } from '@/lib/utils'

const SCALE_MIN = 560
const SCALE_MAX = 680
const pos = (v: number) => `${((v - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100}%`

export function PpbStatus() {
  return (
    <section
      aria-labelledby="ppb-status-heading"
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <h2 id="ppb-status-heading" className="sr-only">
        PPB status: current, forecast, optimized and required score
      </h2>

      <div className="grid grid-cols-1 items-stretch lg:grid-cols-[1fr_88px_1.15fr_88px_1.15fr_auto]">
        <Metric
          label="Current"
          value="573.74"
          caption="Actual accumulated score"
          tone="muted"
        />
        <Connector label="+67.46" />
        <Metric
          label="Year-end forecast"
          value="641.20"
          caption="-20.80 pts from target"
          badge={{ tone: 'warning', text: 'At risk' }}
        />
        <Connector label="+27.10" accent />
        <Metric
          label="Optimized plan"
          value="668.30"
          caption="+6.30 pts above target"
          badge={{ tone: 'success', text: 'Compliant' }}
        />
        <div className="flex flex-col justify-center border-t border-dashed border-border bg-secondary/60 p-6 lg:min-w-[220px] lg:border-t-0 lg:border-l lg:px-8">
          <p className="eyebrow">Required score</p>
          <p className="tnum mt-3 text-[44px] leading-none font-semibold tracking-tight">
            662
          </p>
          <p className="mt-3 text-[13px] text-muted-foreground">
            Brazil PPB compliance target
          </p>
        </div>
      </div>

      <div className="hidden border-t border-border px-8 pt-3 pb-4 lg:block">
        <ScoreRule />
      </div>
    </section>
  )
}

function Metric({
  label,
  value,
  caption,
  badge,
  tone,
}: {
  label: string
  value: string
  caption: string
  badge?: { tone: 'warning' | 'success'; text: string }
  tone?: 'muted'
}) {
  return (
    <div className="flex flex-col justify-center p-6 lg:px-8 lg:py-7">
      <p className="eyebrow">{label}</p>
      <p
        className={cn(
          'tnum mt-3 text-[44px] leading-none font-semibold tracking-tight',
          tone === 'muted' && 'text-foreground/70',
        )}
      >
        {value}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="tnum text-[13px] text-muted-foreground">{caption}</p>
        {badge && <StatusTag tone={badge.tone}>{badge.text}</StatusTag>}
      </div>
    </div>
  )
}

function StatusTag({
  tone,
  children,
}: {
  tone: 'warning' | 'success'
  children: React.ReactNode
}) {
  const Icon = tone === 'warning' ? WarningCircle : CheckCircle
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium',
        tone === 'warning'
          ? 'bg-warning/10 text-warning'
          : 'bg-success/10 text-success',
      )}
    >
      <Icon size={13} weight="fill" aria-hidden="true" />
      {children}
    </span>
  )
}

function Connector({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="relative hidden items-center justify-center lg:flex"
    >
      <span className="tnum absolute top-1/2 mb-2 -translate-y-[calc(100%+4px)] text-[11px] text-muted-foreground">
        {label}
      </span>
      <div className="flex w-full items-center">
        <span
          className={cn('h-px flex-1', accent ? 'bg-brand/60' : 'bg-input')}
        />
        <CaretRight
          size={12}
          weight="bold"
          className={cn('-ml-1.5', accent ? 'text-brand' : 'text-muted-foreground')}
        />
      </div>
    </div>
  )
}

function ScoreRule() {
  return (
    <div
      role="img"
      aria-label="Score scale from 560 to 680. Current 573.74, forecast 641.20, required 662, optimized 668.30."
      className="relative mx-2 h-[60px]"
    >
      <div className="absolute top-1/2 right-0 left-0 h-px bg-input" />

      <span
        className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-warning/70"
        style={{ left: pos(status.forecast), right: `calc(100% - ${pos(status.required)})` }}
      />
      <span
        className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-success/70"
        style={{ left: pos(status.required), right: `calc(100% - ${pos(status.optimized)})` }}
      />

      <Mark at={status.current} dot="bg-foreground" label="Current" value="573.74" below />
      <Mark at={status.forecast} dot="bg-brand" label="Forecast" value="641.20" below />
      <Mark at={status.optimized} dot="bg-brand-deep" label="Optimized" value="668.30" below align="left" />
      <div
        className="absolute top-0 bottom-1/2 flex -translate-x-1/2 flex-col items-center"
        style={{ left: pos(status.required) }}
      >
        <span className="tnum text-[11px] font-medium whitespace-nowrap">
          Required 662
        </span>
        <span className="mt-0.5 w-px flex-1 bg-foreground" />
      </div>

      <span className="tnum absolute top-1/2 left-0 -translate-y-[calc(100%+6px)] text-[10px] text-muted-foreground/70">
        560
      </span>
      <span className="tnum absolute top-1/2 right-0 -translate-y-[calc(100%+6px)] text-[10px] text-muted-foreground/70">
        680
      </span>
    </div>
  )
}

function Mark({
  at,
  dot,
  label,
  value,
  align,
}: {
  at: number
  dot: string
  label: string
  value: string
  below?: boolean
  align?: 'left'
}) {
  return (
    <div
      className={cn(
        'absolute top-1/2 flex flex-col',
        align === 'left' ? 'items-start' : 'items-center -translate-x-1/2',
      )}
      style={{ left: pos(at), transform: align === 'left' ? 'translateX(-6px)' : undefined }}
    >
      <span
        className={cn(
          'size-[11px] -translate-y-1/2 rounded-full ring-2 ring-card',
          dot,
        )}
      />
      <span className="tnum -mt-0.5 text-[11px] whitespace-nowrap text-muted-foreground">
        {label} <span className="font-medium text-foreground">{value}</span>
      </span>
    </div>
  )
}
