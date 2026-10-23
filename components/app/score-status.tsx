import {
  BASE_FORECAST,
  CURRENT_SCORE,
  REQUIRED_SCORE,
  fmt,
  fmtSigned,
  type Simulation,
} from '@/lib/ppb-model'
import { StatusChip, statusText } from '@/components/app/status-chip'
import { cn } from '@/lib/utils'

const AXIS_MIN = 560
const AXIS_MAX = 700
const TICKS = [560, 580, 600, 620, 640, 660, 680, 700]

const pos = (score: number) =>
  `${Math.min(100, Math.max(0, ((score - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * 100))}%`

export function ScoreStatus({
  sim,
  scenarioName,
}: {
  sim: Simulation
  scenarioName: string
}) {
  const forecastGap = BASE_FORECAST - REQUIRED_SCORE
  const forecastStatus = sim.gain === 0 ? sim.status : 'At risk'
  const isBaseline = sim.gain === 0

  return (
    <section
      aria-label="PPB score status"
      className="rounded-lg border border-border bg-card"
    >
      <div className="grid grid-cols-2 divide-y divide-border md:grid-cols-4 md:divide-x md:divide-y-0">
        <Metric
          eyebrow="Now"
          note="Actual accumulated, Oct close"
          value={fmt(CURRENT_SCORE)}
          valueClass="text-foreground"
          foot={
            <span className="tnum text-muted-foreground">
              {fmt(REQUIRED_SCORE - CURRENT_SCORE)} pts to target
            </span>
          }
        />
        <Metric
          eyebrow="Forecast"
          note="AI year-end projection"
          value={fmt(BASE_FORECAST)}
          valueClass="text-brand"
          foot={
            <span className="flex items-center gap-2">
              <span className="num text-[12px] font-medium text-warning">
                {fmtSigned(forecastGap)} pts
              </span>
              <StatusChip status={forecastStatus === 'Compliant' ? 'At risk' : 'At risk'} />
            </span>
          }
        />
        <Metric
          eyebrow={isBaseline ? 'Scenario' : 'Scenario'}
          note={scenarioName}
          highlight
          value={fmt(sim.yearEnd)}
          valueClass={statusText(sim.status)}
          foot={
            <span className="flex items-center gap-2">
              <span className={cn('num text-[12px] font-medium', statusText(sim.status))}>
                {fmtSigned(sim.gap)} pts
              </span>
              <StatusChip status={sim.status} />
            </span>
          }
        />
        <Metric
          eyebrow="Required"
          note="Regulatory benchmark"
          value={String(REQUIRED_SCORE)}
          valueClass="text-muted-foreground"
          foot={<span className="text-muted-foreground">Target for 2026</span>}
        />
      </div>

      <div className="border-t border-border px-4 pt-3 pb-2">
        <div className="relative h-14" role="img" aria-label={`Score ruler. Now ${fmt(CURRENT_SCORE)}, forecast ${fmt(BASE_FORECAST)}, scenario ${fmt(sim.yearEnd)}, required ${REQUIRED_SCORE}.`}>
          {/* compliance zone */}
          <div
            aria-hidden="true"
            className="absolute top-3 bottom-4 right-0 bg-success/[0.07]"
            style={{ left: pos(REQUIRED_SCORE) }}
          />
          {/* axis */}
          <div aria-hidden="true" className="absolute inset-x-0 top-[26px] h-px bg-border" />
          {/* now → forecast */}
          <div
            aria-hidden="true"
            className="absolute top-[25px] h-[3px]"
            style={{
              left: pos(CURRENT_SCORE),
              width: `calc(${pos(BASE_FORECAST)} - ${pos(CURRENT_SCORE)})`,
              background: 'linear-gradient(to right, #0a1128, #2457e6)',
            }}
          />
          {/* forecast → scenario */}
          <div
            aria-hidden="true"
            className="absolute top-[25px] h-[3px] bg-brand transition-all duration-500 ease-out"
            style={{
              left: `min(${pos(BASE_FORECAST)}, ${pos(sim.yearEnd)})`,
              width: `calc(max(${pos(BASE_FORECAST)}, ${pos(sim.yearEnd)}) - min(${pos(BASE_FORECAST)}, ${pos(sim.yearEnd)}))`,
              opacity: isBaseline ? 0 : 1,
            }}
          />
          {/* target */}
          <div
            aria-hidden="true"
            className="absolute top-1 bottom-4 w-px bg-foreground"
            style={{ left: pos(REQUIRED_SCORE) }}
          />
          <span
            className="num absolute top-[-2px] -translate-x-1/2 bg-card px-1 text-[10.5px] font-medium text-foreground"
            style={{ left: pos(REQUIRED_SCORE) }}
          >
            Required {REQUIRED_SCORE}
          </span>

          <Marker score={CURRENT_SCORE} className="bg-foreground" />
          <Marker score={BASE_FORECAST} className="bg-card ring-2 ring-brand" />
          <Marker
            score={sim.yearEnd}
            className={cn(
              'transition-all duration-500 ease-out',
              sim.status === 'Compliant'
                ? 'bg-success'
                : sim.status === 'At risk'
                  ? 'bg-warning'
                  : 'bg-critical',
            )}
            hidden={isBaseline}
            large
          />

          {/* scale */}
          {TICKS.map((t) => (
            <span
              key={t}
              aria-hidden="true"
              className="num absolute bottom-0 -translate-x-1/2 text-[10px] text-muted-foreground/80"
              style={{ left: pos(t) }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function Marker({
  score,
  className,
  hidden,
  large,
}: {
  score: number
  className?: string
  hidden?: boolean
  large?: boolean
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute top-[26px] -translate-x-1/2 -translate-y-1/2 rounded-[2px]',
        large ? 'size-3.5' : 'size-2.5',
        className,
      )}
      style={{ left: pos(score), opacity: hidden ? 0 : 1 }}
    />
  )
}

function Metric({
  eyebrow,
  note,
  value,
  valueClass,
  foot,
  highlight,
}: {
  eyebrow: string
  note: string
  value: string
  valueClass: string
  foot: React.ReactNode
  highlight?: boolean
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1 px-4 py-3', highlight && 'bg-brand-soft/60')}>
      <p className="eyebrow">{eyebrow}</p>
      <p className={cn('num text-[34px] leading-9 font-semibold transition-colors', valueClass)}>
        {value}
      </p>
      <p className="truncate text-[11.5px] text-muted-foreground">{note}</p>
      <div className="mt-0.5 min-h-5 text-[12px]">{foot}</div>
    </div>
  )
}
