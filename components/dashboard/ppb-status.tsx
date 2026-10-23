import { CheckCircle, WarningCircle } from '@phosphor-icons/react/dist/ssr'
import { status } from '@/lib/ppb-data'
import { cn } from '@/lib/utils'

const TARGET_ALONG_SEGMENT =
  (status.required - status.forecast) / (status.optimized - status.forecast)

const fmt = (n: number) => n.toFixed(2)
const delta = (n: number) => `${n >= 0 ? '+' : '\u2212'}${Math.abs(n).toFixed(2)}`

export function PpbStatus() {
  const gapToTarget = status.forecast - status.required
  const marginToTarget = status.optimized - status.required

  return (
    <section
      aria-labelledby="ppb-status-heading"
      className="rounded-xl border border-border bg-card"
    >
      <h2 id="ppb-status-heading" className="sr-only">
        PPB status: current {fmt(status.current)}, forecast {fmt(status.forecast)},
        optimized {fmt(status.optimized)}, against a required score of{' '}
        {status.required}
      </h2>

      <div className="flex items-center justify-between px-6 pt-5 lg:px-8">
        <p className="eyebrow">Year-end PPB position</p>
        <GrammarKey />
      </div>

      <div
        aria-hidden="true"
        className="mt-3 hidden grid-cols-3 px-8 lg:grid"
      >
        <div className="relative flex h-[72px] items-center">
          <span className="size-[11px] shrink-0 rounded-full bg-actual" />
          <div className="relative mr-1.5 ml-1.5 h-full flex-1">
            <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-linear-to-r from-actual/45 to-forecast" />
            <SegmentDelta className="left-1/2">
              {delta(status.forecast - status.current)}
            </SegmentDelta>
          </div>
        </div>

        <div className="relative flex h-[72px] items-center">
          <span className="size-[11px] shrink-0 rounded-full border-2 border-forecast bg-card" />
          <div className="relative mr-1.5 ml-1.5 h-full flex-1">
            <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-linear-to-r from-forecast to-optimized" />
            <SegmentDelta className="left-[30%]">
              {delta(status.optimized - status.forecast)}
            </SegmentDelta>
            <div
              className="absolute inset-y-0 flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${TARGET_ALONG_SEGMENT * 100}%` }}
            >
              <span className="num-mono text-[10.5px] font-medium tracking-normal whitespace-nowrap text-target uppercase">
                Target {status.required}
              </span>
              <span className="mt-1 mb-2 w-px flex-1 bg-target" />
            </div>
          </div>
        </div>

        <div className="relative flex h-[72px] items-center">
          <span className="size-[11px] shrink-0 rounded-full bg-optimized" />
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-border px-6 pb-2 lg:mt-0 lg:grid-cols-3 lg:divide-y-0 lg:px-8 lg:pb-7">
        <State
          label="Current"
          value={fmt(status.current)}
          valueClass="text-actual"
          caption="Actual accumulated score"
        />
        <State
          label="Year-end forecast"
          value={fmt(status.forecast)}
          valueClass="text-forecast"
          caption={`${delta(-Math.abs(gapToTarget))} pts from target`}
          captionClass="text-warning"
          tag={{ tone: 'warning', text: 'At risk' }}
        />
        <State
          label="Optimized plan"
          value={fmt(status.optimized)}
          valueClass="text-optimized"
          caption={`${delta(marginToTarget)} pts above target`}
          captionClass="text-success"
          tag={{ tone: 'success', text: 'Compliant' }}
        />
      </div>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-border px-6 py-3.5 lg:px-8">
        <p className="eyebrow">Required score</p>
        <p className="num-mono text-[15px] font-medium">{status.required}</p>
        <p className="text-[12.5px] text-muted-foreground">
          Brazil PPB compliance benchmark. Forecast and optimized are measured
          against it.
        </p>
      </div>
    </section>
  )
}

function State({
  label,
  value,
  valueClass,
  caption,
  captionClass,
  tag,
}: {
  label: string
  value: string
  valueClass: string
  caption: string
  captionClass?: string
  tag?: { tone: 'warning' | 'success'; text: string }
}) {
  return (
    <div className="py-5 lg:py-0 lg:pr-6">
      <p className="eyebrow">{label}</p>
      <p
        className={cn(
          'num-mono mt-2.5 text-[44px] leading-none font-medium xl:text-[52px]',
          valueClass,
        )}
      >
        {value}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <p
          className={cn(
            'num-mono text-[13px]',
            captionClass ?? 'text-muted-foreground',
          )}
        >
          {caption}
        </p>
        {tag && <StatusTag tone={tag.tone}>{tag.text}</StatusTag>}
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

function SegmentDelta({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'num-mono absolute top-[calc(50%+9px)] -translate-x-1/2 text-[11px] whitespace-nowrap text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}

function GrammarKey() {
  return (
    <ul
      aria-hidden="true"
      className="hidden items-center gap-4 text-[11.5px] text-muted-foreground sm:flex"
    >
      <li className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-actual" /> Actual
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-2 rounded-full border-[1.5px] border-forecast" />{' '}
        Forecast
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-optimized" /> Optimized
      </li>
      <li className="flex items-center gap-1.5">
        <span className="h-3 w-px bg-target" /> Target
      </li>
    </ul>
  )
}
