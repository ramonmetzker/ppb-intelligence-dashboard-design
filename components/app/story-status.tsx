'use client'

import { useEffect, useState } from 'react'
import { CaretRight } from '@phosphor-icons/react'
import {
  BASE_FORECAST,
  CURRENT_SCORE,
  REQUIRED_SCORE,
  fmt,
  fmtSigned,
  statusFor,
} from '@/lib/ppb-model'
import { CountUp } from '@/components/app/count-up'
import { usePlan } from '@/components/app/plan-provider'
import { StatusChip, statusText } from '@/components/app/status-chip'
import { cn } from '@/lib/utils'

const AXIS_MIN = 560
const AXIS_MAX = 700
const TICKS = [560, 580, 600, 620, 640, 660, 680, 700]
const EASE = 'cubic-bezier(0.2, 0.7, 0.2, 1)'

const pos = (score: number) =>
  `${Math.min(100, Math.max(0, ((score - AXIS_MIN) / (AXIS_MAX - AXIS_MIN)) * 100))}%`

/** 0 = before mount, 1 = intro playing, 2 = intro finished (interactions stop waiting). */
function useIntroPhase() {
  const [phase, setPhase] = useState<0 | 1 | 2>(0)
  useEffect(() => {
    const start = requestAnimationFrame(() => setPhase(1))
    const settle = setTimeout(() => setPhase(2), 2600)
    return () => {
      cancelAnimationFrame(start)
      clearTimeout(settle)
    }
  }, [])
  return phase
}

export function StoryStatus() {
  const { sim, planName } = usePlan()
  const phase = useIntroPhase()
  const toGo = REQUIRED_SCORE - CURRENT_SCORE
  const forecastGap = BASE_FORECAST - REQUIRED_SCORE
  const closedForecast = ((BASE_FORECAST - CURRENT_SCORE) / toGo) * 100
  const closedPlan = ((sim.yearEnd - CURRENT_SCORE) / toGo) * 100
  const unchanged = sim.changes.length === 0
  const ready = phase >= 1
  const intro = (ms: number) => (phase === 2 ? 0 : ms)

  const scenarioFill =
    sim.status === 'Compliant' ? 'bg-success' : sim.status === 'At risk' ? 'bg-warning' : 'bg-critical'

  return (
    <section aria-label="PPB score story" className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
        <p className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
          <span className="relative flex size-2" aria-hidden="true">
            <span className="absolute inline-flex size-full rounded-[2px] bg-brand/50 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2 rounded-[2px] bg-brand" />
          </span>
          Live model, GBM 2026. Actuals closed through October.
        </p>
        <p className="text-[11.5px] text-muted-foreground">
          Viewing{' '}
          <span
            key={planName}
            className="animate-in fade-in slide-in-from-bottom-1 inline-block font-medium text-foreground duration-300"
          >
            {planName}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-2 divide-y divide-border md:grid-cols-4 md:divide-x md:divide-y-0">
        <Step
          index={0}
          eyebrow="Now"
          caption="Where we are"
          value={<CountUp value={CURRENT_SCORE} delay={150} duration={1400} />}
          valueClass="text-foreground"
          foot={<span className="text-muted-foreground">Accumulated through the October close</span>}
        />
        <Step
          index={1}
          eyebrow="Required"
          caption="What the regulation asks"
          value={<CountUp value={REQUIRED_SCORE} decimals={0} delay={300} duration={1400} />}
          valueClass="text-foreground"
          foot={
            <span className="text-muted-foreground">
              <CountUp value={toGo} delay={500} /> pts still to earn
            </span>
          }
        />
        <Step
          index={2}
          eyebrow="Forecast"
          caption="Where the AI lands the year"
          value={<CountUp value={BASE_FORECAST} delay={450} duration={1400} />}
          valueClass="text-brand"
          foot={
            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-medium text-warning">
                <CountUp value={forecastGap} signed delay={700} suffix=" pts" className="num" />
              </span>
              <StatusChip status={statusFor(BASE_FORECAST)} />
            </span>
          }
        />
        <Step
          index={3}
          eyebrow="Scenario"
          caption={planName}
          value={<CountUp value={sim.yearEnd} delay={600} duration={1400} />}
          valueClass={statusText(sim.status)}
          highlight
          last
          foot={
            <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className={cn('font-medium', statusText(sim.status))}>
                <CountUp value={sim.gap} signed delay={900} suffix=" pts" className="num" />
              </span>
              <span
                key={sim.status}
                className="animate-in fade-in zoom-in-95 inline-flex duration-300"
              >
                <StatusChip status={sim.status} />
              </span>
            </span>
          }
        />
      </div>

      <div className="grid gap-x-8 gap-y-3 border-t border-border px-4 pt-3 md:grid-cols-[minmax(0,1fr)_300px]">
        <p className="text-[13px] leading-5 text-balance">
          We stand at <span className="num font-semibold">{fmt(CURRENT_SCORE)}</span> and need{' '}
          <span className="num font-semibold">{REQUIRED_SCORE}</span>. The forecast earns{' '}
          {Math.round(closedForecast)}% of the remaining distance and lands{' '}
          <span className="num font-semibold text-warning">{fmt(Math.abs(forecastGap))}</span> pts short.{' '}
          {unchanged ? (
            'No changes are planned for the open months yet.'
          ) : (
            <>
              Your plan lands at{' '}
              <span className={cn('num font-semibold', statusText(sim.status))}>
                {fmt(sim.yearEnd)}
              </span>
              , {fmtSigned(sim.gain)} pts versus the forecast.
            </>
          )}
        </p>
        <div className="flex flex-col gap-2" aria-label="Share of the remaining distance closed">
          <Meter
            label="Forecast closes"
            value={closedForecast}
            ready={ready}
            delay={500}
            fillClass="bg-brand"
          />
          <Meter
            label="Plan closes"
            value={closedPlan}
            ready={ready}
            delay={800}
            fillClass={scenarioFill}
          />
        </div>
      </div>

      <div className="px-4 pt-2 pb-2">
        <div
          className="relative h-12"
          role="img"
          aria-label={`Score ruler. Now ${fmt(CURRENT_SCORE)}, forecast ${fmt(BASE_FORECAST)}, scenario ${fmt(sim.yearEnd)}, required ${REQUIRED_SCORE}.`}
        >
          <div
            aria-hidden="true"
            className="absolute top-3 right-0 bottom-4 origin-left bg-success/[0.07] transition-transform duration-700"
            style={{
              left: pos(REQUIRED_SCORE),
              transform: ready ? 'scaleX(1)' : 'scaleX(0)',
              transitionDelay: `${intro(900)}ms`,
              transitionTimingFunction: EASE,
            }}
          />
          <div aria-hidden="true" className="absolute inset-x-0 top-[26px] h-px bg-border" />
          <div
            aria-hidden="true"
            className="absolute top-[25px] h-[3px]"
            style={{
              left: pos(CURRENT_SCORE),
              width: ready
                ? `calc(${pos(BASE_FORECAST)} - ${pos(CURRENT_SCORE)})`
                : '0px',
              background: 'linear-gradient(to right, #0a1128, #2457e6)',
              transition: `width 1200ms ${EASE} ${intro(450)}ms`,
            }}
          />
          <div
            aria-hidden="true"
            className={cn('absolute top-[25px] h-[3px]', scenarioFill)}
            style={{
              left: `min(${pos(BASE_FORECAST)}, ${pos(sim.yearEnd)})`,
              width: `calc(max(${pos(BASE_FORECAST)}, ${pos(sim.yearEnd)}) - min(${pos(BASE_FORECAST)}, ${pos(sim.yearEnd)}))`,
              opacity: unchanged || !ready ? 0 : 1,
              transition: `left 700ms ${EASE} ${intro(1700)}ms, width 700ms ${EASE} ${intro(1700)}ms, opacity 400ms ease ${intro(1700)}ms`,
            }}
          />
          <div
            aria-hidden="true"
            className="absolute top-1 bottom-4 w-px origin-top bg-foreground transition-transform duration-500"
            style={{
              left: pos(REQUIRED_SCORE),
              transform: ready ? 'scaleY(1)' : 'scaleY(0)',
              transitionDelay: `${intro(300)}ms`,
              transitionTimingFunction: EASE,
            }}
          />
          <span
            className="num absolute top-[-2px] -translate-x-1/2 bg-card px-1 text-[10.5px] font-medium transition-opacity duration-500"
            style={{
              left: pos(REQUIRED_SCORE),
              opacity: ready ? 1 : 0,
              transitionDelay: `${intro(600)}ms`,
            }}
          >
            Required {REQUIRED_SCORE}
          </span>

          <Marker score={CURRENT_SCORE} visible={ready} delay={intro(100)} className="bg-foreground" />
          <Marker
            score={ready ? BASE_FORECAST : CURRENT_SCORE}
            visible={ready}
            delay={intro(450)}
            duration={1200}
            className="bg-card ring-2 ring-brand"
          />
          <Marker
            score={sim.yearEnd}
            visible={ready && !unchanged}
            delay={intro(1700)}
            duration={700}
            large
            ping={sim.status === 'Compliant'}
            className={scenarioFill}
          />

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

function Meter({
  label,
  value,
  ready,
  delay,
  fillClass,
}: {
  label: string
  value: number
  ready: boolean
  delay: number
  fillClass: string
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-[11.5px]">
        <span className="text-muted-foreground">{label}</span>
        <CountUp
          value={value}
          decimals={0}
          suffix="% of the gap"
          delay={delay}
          duration={1300}
          className="num font-semibold"
        />
      </div>
      <div className="mt-1 h-1.5 bg-border" aria-hidden="true">
        <div
          className={cn('h-full transition-[width,background-color] duration-[1100ms]', fillClass)}
          style={{
            width: ready ? `${Math.min(100, Math.max(0, value))}%` : '0%',
            transitionDelay: `${delay}ms`,
            transitionTimingFunction: EASE,
          }}
        />
      </div>
    </div>
  )
}

function Marker({
  score,
  className,
  visible,
  delay = 0,
  duration = 900,
  large,
  ping,
}: {
  score: number
  className?: string
  visible: boolean
  delay?: number
  duration?: number
  large?: boolean
  ping?: boolean
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute top-[26px] -translate-x-1/2 -translate-y-1/2 rounded-[2px] transition-[left,scale,opacity,background-color]',
        large ? 'size-3.5' : 'size-2.5',
        visible ? 'scale-100 opacity-100' : 'scale-0 opacity-0',
        className,
      )}
      style={{
        left: pos(score),
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: EASE,
      }}
    >
      {ping && (
        <span className="absolute inset-0 rounded-[2px] bg-success/60 motion-safe:animate-ping" />
      )}
    </span>
  )
}

function Step({
  index,
  eyebrow,
  caption,
  value,
  valueClass,
  foot,
  highlight,
  last,
}: {
  index: number
  eyebrow: string
  caption: string
  value: React.ReactNode
  valueClass: string
  foot: React.ReactNode
  highlight?: boolean
  last?: boolean
}) {
  return (
    <div
      className={cn(
        'rise relative flex min-w-0 flex-col gap-1 px-4 py-3',
        highlight && 'bg-brand-soft/60',
      )}
      style={{ '--rise-delay': `${index * 110}ms` } as React.CSSProperties}
    >
      <p className="eyebrow">{eyebrow}</p>
      <p className={cn('num text-[34px] leading-9 font-semibold transition-colors', valueClass)}>
        {value}
      </p>
      <p className="truncate text-[12px] font-medium">{caption}</p>
      <div className="min-h-5 text-[12px]">{foot}</div>
      {!last && (
        <span
          aria-hidden="true"
          className="absolute top-1/2 right-0 z-10 hidden size-5 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[2px] border border-border bg-card text-muted-foreground md:flex"
        >
          <CaretRight size={11} weight="bold" />
        </span>
      )}
    </div>
  )
}
