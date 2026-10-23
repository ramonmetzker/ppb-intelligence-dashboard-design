'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  ArrowsClockwise,
  Check,
  CircleNotch,
  Cpu,
  Flag,
  ListChecks,
  MagnifyingGlass,
  Play,
  Stop,
  TreeStructure,
  Warning,
  X,
  type Icon,
} from '@phosphor-icons/react'
import {
  BASELINE,
  ITEMS,
  OPEN_MONTHS,
  REQUIRED_SCORE,
  fmt,
  fmtCost,
  fmtCreated,
  fmtSigned,
} from '@/lib/ppb-model'
import { PRICE_FEED, QUOTES, premium } from '@/lib/material-prices'
import { TARGET_SCORE, type AgentStep, type Phase } from '@/lib/planner-agent'
import { CountUp } from '@/components/app/count-up'
import { usePlan } from '@/components/app/plan-provider'
import { statusText } from '@/components/app/status-chip'
import { useAgent, type RunState } from '@/components/agent/agent-provider'
import { cn } from '@/lib/utils'

const PHASES: { id: Phase; label: string; icon: Icon }[] = [
  { id: 'analyze', label: 'Analyze', icon: MagnifyingGlass },
  { id: 'model', label: 'Model', icon: TreeStructure },
  { id: 'solve', label: 'Solve', icon: Cpu },
  { id: 'check', label: 'Check', icon: ListChecks },
  { id: 'reoptimize', label: 'Re-optimize', icon: ArrowsClockwise },
  { id: 'deliver', label: 'Deliver', icon: Flag },
]
const PHASE_ICON = Object.fromEntries(PHASES.map((p) => [p.id, p.icon])) as Record<Phase, Icon>

const toneText = {
  neutral: 'text-muted-foreground',
  ok: 'text-success',
  warn: 'text-warning',
  bad: 'text-critical',
} as const

const toneNode = {
  neutral: 'border-border bg-secondary text-muted-foreground',
  ok: 'border-success/40 bg-success/10 text-success',
  warn: 'border-warning/50 bg-warning/10 text-warning',
  bad: 'border-critical/40 bg-critical/10 text-critical',
} as const

/* -------------------------------------------------------------------------- */
/* Progress helpers                                                            */
/* -------------------------------------------------------------------------- */

const stepFinished = (run: RunState, index: number) =>
  index < run.stepIndex ||
  run.status === 'done' ||
  (index === run.stepIndex && run.lineCount >= run.data.steps[index].lines.length)

function progressOf(run: RunState) {
  if (run.status === 'done') return 1
  const step = run.data.steps[run.stepIndex]
  const within = step ? run.lineCount / Math.max(step.lines.length, 1) : 0
  return (run.stepIndex + within) / run.data.steps.length
}

/* -------------------------------------------------------------------------- */
/* Idle state                                                                  */
/* -------------------------------------------------------------------------- */

const PREMIUM_SCALE = 0.13

function PriceSignals() {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <p className="eyebrow">Material price signals</p>
        <span className="rounded-[3px] bg-warning/10 px-1.5 py-px text-[10.5px] font-medium text-warning">
          {PRICE_FEED.note}
        </span>
      </div>
      <table className="w-full text-[12px]">
        <caption className="sr-only">Local price premium over import, per item and month</caption>
        <thead>
          <tr className="border-b border-border text-left text-[11px] text-muted-foreground">
            <th scope="col" className="px-3 py-1.5 font-medium">
              Item
            </th>
            {OPEN_MONTHS.map((m) => (
              <th key={m} scope="col" className="px-3 py-1.5 font-medium">
                {m} local premium
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {ITEMS.map((item) => {
            const lowest = Math.min(premium(item.key, 0), premium(item.key, 1))
            return (
              <tr key={item.key}>
                <th scope="row" className="px-3 py-1.5 text-left font-medium">
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className="size-2 rounded-[2px]" style={{ background: item.color }} />
                    {item.name}
                  </span>
                </th>
                {([0, 1] as const).map((open) => {
                  const p = premium(item.key, open)
                  const q = QUOTES[item.key].months[open]
                  const cheap = p === lowest
                  return (
                    <td key={open} className="px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-16 shrink-0 bg-border" aria-hidden="true">
                          <span
                            className={cn('block h-full', cheap ? 'bg-brand' : 'bg-muted-foreground/50')}
                            style={{ width: `${Math.min(100, (p / PREMIUM_SCALE) * 100)}%` }}
                          />
                        </span>
                        <span className={cn('num w-11 font-semibold', cheap && 'text-brand-deep')}>
                          {(p * 100).toFixed(1)}%
                        </span>
                        <span className="num hidden text-[11px] text-muted-foreground xl:inline">
                          ${q.local.toFixed(2)} vs ${q.imported.toFixed(2)}
                        </span>
                      </div>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function IdleState() {
  const { start, instructions } = useAgent()
  const gap = TARGET_SCORE - BASELINE.yearEnd

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-6 py-8">
        <div className="flex items-start gap-4">
          <div className="relative flex size-12 shrink-0 items-center justify-center rounded-md bg-ink text-brand-soft">
            <Cpu size={24} aria-hidden="true" />
            <span aria-hidden="true" className="absolute -inset-1 rounded-lg border border-brand/30" />
          </div>
          <div>
            <p className="eyebrow">Plan optimizer</p>
            <h3 className="font-display text-[22px] leading-7 font-semibold tracking-tight text-balance">
              Reach {TARGET_SCORE.toFixed(0)} at the lowest spend
            </h3>
            <p className="mt-1 max-w-lg text-[13px] leading-5 text-pretty text-muted-foreground">
              For the rest of the year, the agent moves each item&apos;s local share up or down in Nov and Dec
              by comparing material prices, solves the MILP, checks every limit and re-optimizes until the
              plan holds.
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-3 divide-x divide-border rounded-md border border-border bg-card">
          {[
            { label: 'Forecast', value: fmt(BASELINE.yearEnd), sub: 'year-end today' },
            { label: 'Target', value: TARGET_SCORE.toFixed(2), sub: `${REQUIRED_SCORE} required + buffer` },
            { label: 'To close', value: fmtSigned(gap), sub: 'points to find' },
          ].map((m) => (
            <div key={m.label} className="px-4 py-3">
              <dt className="eyebrow">{m.label}</dt>
              <dd className="num mt-0.5 text-[20px] leading-7 font-semibold">{m.value}</dd>
              <dd className="text-[11px] leading-4 text-muted-foreground">{m.sub}</dd>
            </div>
          ))}
        </dl>

        <PriceSignals />

        <ol className="flex flex-wrap items-center gap-x-1 gap-y-2" aria-label="How a run works">
          {PHASES.map((phase, i) => (
            <li key={phase.id} className="flex items-center gap-1">
              <span className="flex h-6 items-center gap-1.5 rounded-[4px] border border-border bg-card px-2 text-[11px] font-medium text-muted-foreground">
                <phase.icon size={12} aria-hidden="true" />
                {phase.label}
              </span>
              {i < PHASES.length - 1 && <ArrowRight size={11} className="text-border" aria-hidden="true" />}
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => start()}
            className="flex h-10 items-center gap-2 rounded-md bg-brand px-5 text-[13px] font-medium text-white transition-[filter,transform] hover:brightness-110 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Play size={15} weight="fill" aria-hidden="true" />
            Find the cheapest plan
          </button>
          <p className="text-[12px] text-muted-foreground">
            {instructions.length > 0
              ? `${instructions.length} instruction${instructions.length === 1 ? '' : 's'} from the chat will apply`
              : 'Or tell the agent where to push or pull in the chat'}
          </p>
        </div>
      </div>
    </div>
  )
}

function RunControls({ run }: { run: RunState }) {
  const { start, stop } = useAgent()
  return run.status === 'running' ? (
    <button
      type="button"
      onClick={stop}
      className="flex h-6 items-center gap-1.5 rounded-[4px] border border-input bg-card px-2 text-[11.5px] font-medium transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
    >
      <Stop size={11} weight="fill" aria-hidden="true" />
      Stop
    </button>
  ) : (
    <button
      type="button"
      onClick={() => start()}
      className="flex h-6 items-center gap-1.5 rounded-[4px] bg-brand px-2 text-[11.5px] font-medium text-white transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <Play size={11} weight="fill" aria-hidden="true" />
      Run again
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/* Header: phases, progress and the live score ruler                           */
/* -------------------------------------------------------------------------- */

const RULER_MIN = 600
const RULER_MAX = 700
const at = (v: number) => `${Math.min(100, Math.max(0, ((v - RULER_MIN) / (RULER_MAX - RULER_MIN)) * 100))}%`

function ScoreRuler({ run }: { run: RunState }) {
  const target = TARGET_SCORE
  const landed = run.data.steps
    .map((step, index) => ({ step, index }))
    .filter(({ step, index }) => step.phase === 'solve' && step.candidate && stepFinished(run, index))
    .map(({ step }) => step.candidate!)

  return (
    <div className="relative mx-1 mt-1 mb-9 h-12" role="img" aria-label="Candidate scores against the required score">
      <div className="absolute inset-x-0 top-6 h-1.5 bg-border" />
      <div
        className="absolute top-6 h-1.5 bg-brand/25"
        style={{ left: at(BASELINE.yearEnd), width: `calc(${at(target)} - ${at(BASELINE.yearEnd)})` }}
      />
      {/* forecast */}
      <div className="absolute top-5 h-3.5 w-px bg-muted-foreground" style={{ left: at(BASELINE.yearEnd) }}>
        <span className="num absolute top-4 -left-8 w-16 text-center text-[10.5px] leading-3 text-muted-foreground">
          Forecast {fmt(BASELINE.yearEnd, 1)}
        </span>
      </div>
      {/* required */}
      <div className="absolute top-4 h-5 w-0.5 bg-foreground" style={{ left: at(REQUIRED_SCORE) }}>
        <span className="num absolute top-5 right-1 text-[10.5px] leading-3 font-semibold whitespace-nowrap">
          Required {REQUIRED_SCORE}
        </span>
      </div>
      {/* target */}
      <div className="absolute top-5 h-3.5 w-px bg-brand" style={{ left: at(target) }}>
        <span className="num absolute top-4 left-1 text-[10.5px] leading-3 font-medium whitespace-nowrap text-brand-deep">
          Target {target.toFixed(1)}
        </span>
      </div>
      {/* candidates */}
      {landed.map((c, i) => {
        const isLatest = i === landed.length - 1
        const ok = c.sim.yearEnd + 0.004 >= target
        return (
          <div
            key={c.round}
            className="absolute transition-[left] duration-700 ease-out"
            style={{ left: at(c.sim.yearEnd), top: i % 2 === 0 ? 0 : 10 }}
          >
            <span
              className={cn(
                'num absolute bottom-0 left-0 -translate-x-1/2 text-[10.5px] leading-3 font-semibold whitespace-nowrap',
                ok ? 'text-success' : 'text-warning',
              )}
              style={{ transform: 'translate(-50%, 0)' }}
            >
              R{c.round} {c.sim.yearEnd.toFixed(1)}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'absolute top-3 left-0 size-2.5 -translate-x-1/2 rotate-45 animate-in zoom-in-50 duration-300',
                ok ? 'bg-success' : 'bg-warning',
                !isLatest && 'opacity-60',
              )}
              style={{ top: i % 2 === 0 ? 12 : 2 }}
            />
          </div>
        )
      })}
    </div>
  )
}

function Metric({
  label,
  children,
  tone,
}: {
  label: string
  children: React.ReactNode
  tone?: string
}) {
  return (
    <div className="min-w-0 border-l border-border pl-3 first:border-l-0 first:pl-0">
      <p className="eyebrow">{label}</p>
      <p className={cn('num mt-0.5 text-[18px] leading-6 font-semibold', tone)}>{children}</p>
    </div>
  )
}

function RunHeader({ run }: { run: RunState }) {
  const seen = new Set(run.data.steps.slice(0, run.stepIndex + 1).map((s) => s.phase))
  const current = run.status === 'running' ? run.data.steps[run.stepIndex]?.phase : null
  const progress = progressOf(run)
  const latest = [...run.data.steps]
    .map((step, index) => ({ step, index }))
    .filter(({ step, index }) => step.candidate && stepFinished(run, index))
    .pop()?.step.candidate
  const target = TARGET_SCORE

  return (
    <header className="border-b border-border bg-card px-5 pt-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="eyebrow">Solver trace, run {run.id}</p>
          <p className="font-display truncate text-[15px] leading-6 font-semibold tracking-tight">
            {run.data.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
        <RunControls run={run} />
        <ol className="flex items-center gap-1" aria-label="Phases">
          {PHASES.map((p) => {
            const active = current === p.id
            const done = seen.has(p.id) && !active
            return (
              <li
                key={p.id}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex h-6 items-center gap-1.5 rounded-[4px] border px-2 text-[11px] font-medium transition-colors duration-300',
                  active && 'border-brand bg-brand-soft text-brand-deep',
                  done && 'border-border bg-secondary text-foreground',
                  !active && !done && 'border-transparent text-muted-foreground/60',
                )}
              >
                <p.icon size={12} aria-hidden="true" />
                <span className="hidden xl:inline">{p.label}</span>
              </li>
            )
          })}
        </ol>
        </div>
      </div>

      <div className="mt-3 h-[3px] bg-border" role="progressbar" aria-label="Run progress" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={cn(
            'h-full transition-[width] duration-500 ease-out',
            run.status === 'stopped' ? 'bg-muted-foreground' : 'bg-brand',
          )}
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-3 py-4 sm:grid-cols-4">
        <Metric label="Latest score" tone={latest ? statusText(latest.sim.status) : 'text-muted-foreground'}>
          {latest ? <CountUp value={latest.sim.yearEnd} duration={650} /> : fmt(BASELINE.yearEnd)}
        </Metric>
        <Metric label="Against target">
          {latest ? (
            <CountUp
              value={latest.sim.yearEnd - target}
              duration={650}
              signed
              className={latest.sim.yearEnd + 0.004 >= target ? 'text-success' : 'text-warning'}
            />
          ) : (
            <span className="text-muted-foreground">{fmtSigned(BASELINE.yearEnd - target)}</span>
          )}
        </Metric>
        <Metric label="Spend">
          {latest ? fmtCost(latest.sim.cost) : <span className="text-muted-foreground">$0K</span>}
        </Metric>
        <Metric label="Confidence">
          {latest ? <CountUp value={latest.sim.confidence} decimals={0} suffix="%" duration={650} /> : '87%'}
        </Metric>
      </div>

      <ScoreRuler run={run} />
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/* Log                                                                         */
/* -------------------------------------------------------------------------- */

function LineText({ text, last, typing }: { text: string; last: boolean; typing: boolean }) {
  const kind = text.startsWith('pass') ? 'pass' : text.startsWith('FAIL') ? 'fail' : null
  return (
    <li
      className={cn(
        'animate-in fade-in slide-in-from-left-1 flex gap-2 text-[12px] leading-[18px] duration-200',
        text.startsWith('probe') || text.startsWith('simplex') || text.startsWith('branch')
          ? 'text-muted-foreground'
          : 'text-foreground/85',
      )}
    >
      <span aria-hidden="true" className={cn('select-none', kind === 'fail' ? 'text-critical' : 'text-brand/70')}>
        {kind === 'fail' ? '\u00d7' : '\u203a'}
      </span>
      <span className="tnum min-w-0 flex-1 break-words">
        {text}
        {last && typing && (
          <span
            aria-hidden="true"
            className="ml-0.5 inline-block h-3 w-[5px] translate-y-0.5 bg-brand motion-safe:animate-pulse"
          />
        )}
      </span>
    </li>
  )
}

function CheckTable({ step, shown }: { step: AgentStep; shown: number }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-md border border-border bg-card" aria-label="Constraint checks">
      {step.checks!.slice(0, shown).map((c) => (
        <li
          key={c.id}
          className="animate-in fade-in slide-in-from-left-1 grid grid-cols-[18px_minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-1.5 text-[12px] duration-200"
        >
          <span
            aria-hidden="true"
            className={cn(
              'flex size-4 items-center justify-center rounded-[3px]',
              c.pass ? 'bg-success/15 text-success' : 'bg-critical/15 text-critical',
            )}
          >
            {c.pass ? <Check size={10} weight="bold" /> : <X size={10} weight="bold" />}
          </span>
          <span className="truncate">
            {c.label}
            <span className="sr-only">{c.pass ? ', passed' : ', failed'}</span>
          </span>
          <span className={cn('num font-semibold', c.pass ? 'text-foreground' : 'text-critical')}>
            {c.actual}
          </span>
          <span className="num w-24 text-right text-muted-foreground">{c.limit}</span>
        </li>
      ))}
    </ul>
  )
}

function StepCard({
  step,
  active,
  lineCount,
  isLast,
}: {
  step: AgentStep
  active: boolean
  lineCount: number
  isLast: boolean
}) {
  const Icon = PHASE_ICON[step.phase]
  const finished = !active
  const shown = active ? lineCount : step.lines.length
  const tone = finished ? step.tone : 'neutral'
  const typing = active && shown < step.lines.length

  return (
    <li className="animate-in fade-in slide-in-from-bottom-2 relative flex gap-3 duration-300">
      <div className="flex flex-col items-center">
        <span
          aria-hidden="true"
          className={cn(
            'z-10 flex size-7 shrink-0 items-center justify-center rounded-[5px] border transition-colors duration-300',
            active ? 'border-brand bg-brand-soft text-brand-deep' : toneNode[tone],
          )}
        >
          {active ? <CircleNotch size={14} className="motion-safe:animate-spin" /> : <Icon size={14} />}
        </span>
        {!isLast && <span aria-hidden="true" className="mt-1 w-px flex-1 bg-border" />}
      </div>

      <div className={cn('min-w-0 flex-1', !isLast && 'pb-5')}>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h3 className="font-display text-[13.5px] leading-7 font-semibold tracking-tight">{step.title}</h3>
          <span className="rounded-[3px] bg-secondary px-1.5 py-px text-[10.5px] font-medium text-muted-foreground">
            {step.round > 0 ? `Round ${step.round}` : 'Setup'}
          </span>
          {finished && (
            <span
              className={cn(
                'animate-in fade-in zoom-in-95 ml-auto text-[11.5px] leading-4 font-medium duration-300',
                toneText[step.tone],
              )}
            >
              {step.outcome}
            </span>
          )}
        </div>

        {step.checks ? (
          <div className="mt-1.5">
            <CheckTable step={step} shown={shown} />
          </div>
        ) : (
          <ul className="mt-0.5 flex flex-col gap-0.5">
            {step.lines.slice(0, shown).map((line, i) => (
              <LineText key={`${step.id}-${i}`} text={line} last={i === shown - 1} typing={typing} />
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}

function Delivered({ run }: { run: RunState }) {
  const router = useRouter()
  const { setOpen } = useAgent()
  const { plans, active, applySuggestion } = usePlan()
  const option = plans.find((p) => p.suggestion.id === run.planId)
  if (!option) return null
  const { suggestion, sim } = option
  const applied = active?.id === suggestion.id

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 mt-1 overflow-hidden rounded-md border border-border bg-card duration-500">
      <div
        className={cn('h-[3px]', run.data.satisfied ? 'bg-success' : 'bg-warning')}
        aria-hidden="true"
      />
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <p className="eyebrow flex items-center gap-1.5">
            {run.data.satisfied ? (
              <Check size={12} weight="bold" className="text-success" aria-hidden="true" />
            ) : (
              <Warning size={12} weight="fill" className="text-warning" aria-hidden="true" />
            )}
            {run.data.satisfied ? 'Plan delivered' : 'Closest feasible plan delivered'},{' '}
            {fmtCreated(suggestion.createdAt)}
          </p>
          <p className="font-display mt-0.5 text-[18px] leading-7 font-semibold tracking-tight">
            {suggestion.name}
          </p>
          <p className="mt-0.5 max-w-md text-[12px] leading-4 text-pretty text-muted-foreground">
            {suggestion.blurb}
          </p>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className={cn('num text-[26px] leading-8 font-semibold', statusText(sim.status))}>
              <CountUp value={sim.yearEnd} duration={900} />
            </p>
            <p className={cn('num text-[11.5px] leading-4 font-medium', statusText(sim.status))}>
              {fmtSigned(sim.gap)} vs required
            </p>
          </div>
          <div className="tnum text-[11.5px] leading-5 text-muted-foreground">
            <p>{sim.cost > 0 ? fmtCost(sim.cost) : 'No spend'}</p>
            <p>{sim.confidence}% confidence</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2 border-t border-border bg-secondary/40 px-4 py-2.5">
        <button
          type="button"
          disabled={applied}
          onClick={() => applySuggestion(suggestion.id)}
          className={cn(
            'flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium transition-[filter] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            applied ? 'bg-brand-soft text-brand-deep' : 'bg-brand text-white hover:brightness-110',
          )}
        >
          {applied ? (
            <>
              <Check size={13} weight="bold" aria-hidden="true" />
              Applied to the app
            </>
          ) : (
            'Apply to the app'
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            if (!applied) applySuggestion(suggestion.id)
            setOpen(false)
            router.push('/')
          }}
          className="flex h-8 items-center gap-1.5 rounded-md border border-input bg-card px-3 text-[12px] font-medium transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Open the overview
          <ArrowRight size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function Log({ run }: { run: RunState }) {
  const scroller = useRef<HTMLDivElement>(null)
  const visible = run.data.steps.slice(0, run.stepIndex + 1)
  const running = run.status === 'running'

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [run.stepIndex, run.lineCount, run.status])

  return (
    <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
      <ol className="flex flex-col" aria-label="Agent steps">
        {visible.map((step, i) => (
          <StepCard
            key={step.id}
            step={step}
            active={running && i === run.stepIndex}
            lineCount={run.lineCount}
            isLast={i === visible.length - 1 && run.status !== 'done'}
          />
        ))}
      </ol>
      {run.status === 'done' && <Delivered run={run} />}
      {run.status === 'stopped' && (
        <p className="mt-2 rounded-md border border-border bg-secondary/60 px-3 py-2 text-[12px] text-muted-foreground">
          Run stopped. Nothing was added to your plans.
        </p>
      )}
    </div>
  )
}

export function ProcessPanel() {
  const { run } = useAgent()
  return (
    <section aria-label="Solver trace" className="flex min-h-0 flex-col bg-background">
      {run ? (
        <>
          <RunHeader run={run} />
          <Log run={run} />
        </>
      ) : (
        <IdleState />
      )}
    </section>
  )
}
