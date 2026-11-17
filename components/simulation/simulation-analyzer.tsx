'use client'

import { useState } from 'react'
import {
  ArrowRight,
  CaretRight,
  Check,
  DownloadSimple,
  Info,
  LockKey,
  Warning,
} from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/app/page-header'
import { Panel } from '@/components/app/panel'
import { cn } from '@/lib/utils'
import {
  reportFacts,
  simulationScenarios,
  type SimulationScenario,
} from '@/lib/simulation-report'
import { MockAnalysisChat } from '@/components/simulation/mock-analysis-chat'

type MetricTone = 'default' | 'positive' | 'warning'

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

const decimal = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatCurrency(value: number | null) {
  return value === null ? '—' : usd.format(value)
}

function formatCompactCurrency(value: number | null) {
  return value === null ? '—' : `$${(value / 1_000_000).toFixed(2)}M`
}

function formatNumber(value: number) {
  return decimal.format(value)
}

function toneClasses(tone: MetricTone) {
  if (tone === 'positive') return 'text-success'
  if (tone === 'warning') return 'text-warning'
  return 'text-foreground'
}

function ScenarioStatus({ scenario }: { scenario: SimulationScenario }) {
  const isWarning = scenario.status === 'Atenção'
  const isRecommended = scenario.status === 'Recomendado'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-medium',
        isWarning ? 'text-warning' : isRecommended ? 'text-brand' : 'text-success',
      )}
    >
      <span className="size-1.5 rounded-[1px] bg-current" aria-hidden="true" />
      {scenario.status}
    </span>
  )
}

function ScenarioCard({
  scenario,
  selected,
  onSelect,
}: {
  scenario: SimulationScenario
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        'flex min-w-0 flex-col border border-border bg-card p-3 text-left transition-colors hover:border-brand/50',
        selected && 'border-brand bg-brand-soft/35',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-foreground">{scenario.name}</p>
          <ScenarioStatus scenario={scenario} />
        </div>
        <span
          className={cn(
            'flex size-5 shrink-0 items-center justify-center rounded-[2px] border',
            selected ? 'border-brand bg-brand text-primary-foreground' : 'border-border text-transparent',
          )}
        >
          <Check size={12} weight="bold" />
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 divide-x divide-border border-t border-border pt-3">
        <Metric label="Score" value={formatNumber(scenario.score)} />
        <Metric label="Known cost" value={formatCompactCurrency(scenario.knownCost)} />
        <Metric label="Coverage" value={`${formatNumber(scenario.priceCoverage)}%`} />
      </div>
    </button>
  )
}

function Metric({ label, value, tone = 'default' }: { label: string; value: string; tone?: MetricTone }) {
  return (
    <div className="min-w-0 px-2 first:pl-0 last:pr-0">
      <p className="eyebrow truncate">{label}</p>
      <p className={cn('num mt-1 truncate text-[14px] font-semibold', toneClasses(tone))}>{value}</p>
    </div>
  )
}

function InlineMetric({ label, value, detail, tone = 'default' }: { label: string; value: string; detail?: string; tone?: MetricTone }) {
  return (
    <div className="border-l border-border pl-3 first:border-l-0 first:pl-0">
      <p className="eyebrow">{label}</p>
      <p className={cn('num mt-1 text-[22px] leading-6 font-semibold', toneClasses(tone))}>{value}</p>
      {detail ? <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p> : null}
    </div>
  )
}

function ScorePosition({ scenario }: { scenario: SimulationScenario }) {
  const min = 660
  const max = 680
  const position = Math.min(100, Math.max(0, ((scenario.score - min) / (max - min)) * 100))
  const targetPosition = ((reportFacts.requestedScore - min) / (max - min)) * 100

  return (
    <Panel title="Score position" description="Scenario vs. target and calculated ceiling.">
      <div className="grid gap-5 md:grid-cols-[1fr_180px] md:items-center">
        <div>
          <div className="relative h-16">
            <div className="absolute inset-x-0 top-7 h-px bg-border" />
            <div className="absolute top-7 left-0 h-[3px] bg-brand" style={{ width: `${position}%` }} />
            <div className="absolute top-5 h-5 w-px bg-foreground" style={{ left: `${targetPosition}%` }} />
            <span className="absolute top-1 -translate-x-1/2 text-[10px] font-medium text-muted-foreground" style={{ left: `${targetPosition}%` }}>
              Target {formatNumber(reportFacts.requestedScore)}
            </span>
            <span className="absolute top-[22px] size-3 -translate-x-1/2 rounded-[2px] bg-brand ring-2 ring-brand/20" style={{ left: `${position}%` }} aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 flex justify-between text-[10px] text-muted-foreground"><span>{min}</span><span>670</span><span>{max}</span></div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground"><span className="size-2 rounded-[1px] bg-brand" /> Scenario <span className="ml-3 size-2 bg-foreground" /> Target</div>
        </div>
        <div className="border-t border-border pt-3 md:border-t-0 md:border-l md:pl-5 md:pt-0">
          <p className="eyebrow">Gap to target</p>
          <p className={cn('num mt-1 text-[28px] leading-8 font-semibold', scenario.score >= reportFacts.requestedScore ? 'text-success' : 'text-warning')}>
            {formatNumber(scenario.score - reportFacts.requestedScore)}
          </p>
          <p className="mt-1 text-[11px] leading-4 text-muted-foreground">Calculated ceiling {formatNumber(reportFacts.maxCalculableScore)}</p>
        </div>
      </div>
    </Panel>
  )
}

function RunDetails({ scenario }: { scenario: SimulationScenario }) {
  return (
    <Panel title="Run details" description="Inputs used by the selected scenario.">
      <dl className="divide-y divide-border">
        <DetailRow label="Period" value={reportFacts.scope} />
        <DetailRow label="Priced lines" value={`${scenario.pricedLines} / ${scenario.totalLines}`} />
        <DetailRow label="Origin pending" value={String(scenario.unknownOriginLines)} tone="warning" />
        <DetailRow label="Known cost" value={formatCurrency(scenario.knownCost)} />
        <DetailRow label="Confidence" value={scenario.type === 'previous' ? 'Low' : reportFacts.confidence} />
      </dl>
      <div className="mt-4 flex items-start gap-2 border-t border-border pt-3 text-[11px] leading-4 text-muted-foreground">
        <Info className="mt-0.5 shrink-0 text-brand" size={14} />
        <span>{scenario.unknownOriginLines} lines remain outside the score until origin and price are confirmed.</span>
      </div>
    </Panel>
  )
}

function DetailRow({ label, value, tone = 'default' }: { label: string; value: string; tone?: MetricTone }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0">
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className={cn('num text-right text-[12px] font-semibold', toneClasses(tone))}>{value}</dd>
    </div>
  )
}

function MonthlyDeltaTable({ scenario }: { scenario: SimulationScenario }) {
  return (
    <Panel
      title="Monthly cost deltas"
      description="Known line-item changes from baseline."
      action={<Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-[11px]">Full table <ArrowRight size={13} /></Button>}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-left text-[12px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              <th scope="col" className="pb-2 font-medium">Month</th>
              <th scope="col" className="pb-2 font-medium">Item</th>
              <th scope="col" className="pb-2 font-medium">PN</th>
              <th scope="col" className="pb-2 text-right font-medium">Baseline</th>
              <th scope="col" className="pb-2 text-right font-medium">Scenario</th>
              <th scope="col" className="pb-2 text-right font-medium">Delta</th>
            </tr>
          </thead>
          <tbody>
            {scenario.monthlyChanges.map((change) => (
              <tr key={`${scenario.id}-${change.month}-${change.pn}`} className="border-t border-border/70">
                <th scope="row" className="py-2.5 text-left font-medium">{change.month}</th>
                <td className="py-2.5 text-muted-foreground">{change.item}</td>
                <td className="num py-2.5 text-muted-foreground">{change.pn}</td>
                <td className="num py-2.5 text-right">{formatCurrency(change.baseline)}</td>
                <td className="num py-2.5 text-right">{formatCurrency(change.scenario)}</td>
                <td className={cn('num py-2.5 text-right font-semibold', change.delta < 0 ? 'text-success' : change.delta > 0 ? 'text-warning' : 'text-muted-foreground')}>
                  {change.delta > 0 ? '+' : ''}{formatCurrency(change.delta)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

export function SimulationAnalyzer() {
  const [selectedScenarioId, setSelectedScenarioId] = useState('recommended')
  const [selectedIds, setSelectedIds] = useState(['baseline', 'recommended'])
  const scenario = simulationScenarios.find((item) => item.id === selectedScenarioId) ?? simulationScenarios[1]
  const knownSavings = scenario.knownCostDelta === null ? null : Math.abs(scenario.knownCostDelta)

  function toggleContext(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  return (
    <div className="flex flex-col gap-3">
      <PageHeader
        title="Simulation analysis"
        description="Compare sourcing scenarios against the PPB score target."
      >
        <Button variant="outline" className="gap-2"><DownloadSimple size={15} /> Export</Button>
      </PageHeader>

      <Panel
        title="Scenario comparison"
        description="Select a run to inspect its score, cost and coverage."
        action={<span className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><LockKey size={13} /> PPB / MX 2026</span>}
      >
        <div className="grid gap-2 xl:grid-cols-3">
          {simulationScenarios.map((item) => (
            <ScenarioCard key={item.id} scenario={item} selected={item.id === scenario.id} onSelect={() => setSelectedScenarioId(item.id)} />
          ))}
        </div>
      </Panel>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Panel title="Score" bodyClassName="p-3">
          <InlineMetric label="Selected run" value={formatNumber(scenario.score)} detail={`Target ${formatNumber(reportFacts.requestedScore)}`} />
        </Panel>
        <Panel title="Known cost" bodyClassName="p-3">
          <InlineMetric label="Scenario" value={formatCurrency(scenario.knownCost)} detail={knownSavings === null ? 'Not reconstructed' : `${formatCurrency(knownSavings)} vs baseline`} tone={knownSavings ? 'positive' : 'default'} />
        </Panel>
        <Panel title="Price coverage" bodyClassName="p-3">
          <InlineMetric label="Priced lines" value={`${formatNumber(scenario.priceCoverage)}%`} detail={`${scenario.pricedLines} of ${scenario.totalLines}`} />
        </Panel>
        <Panel title="Open inputs" bodyClassName="p-3">
          <InlineMetric label="Origin pending" value={String(scenario.unknownOriginLines)} detail="Requires validation" tone="warning" />
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
        <ScorePosition scenario={scenario} />
        <RunDetails scenario={scenario} />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <MonthlyDeltaTable scenario={scenario} />
        <Panel title="Analysis context" description="Scenarios available to the analyst.">
          <div className="space-y-2">
            {simulationScenarios.map((item) => {
              const checked = selectedIds.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleContext(item.id)}
                  className={cn('flex w-full items-center justify-between gap-3 border border-border px-3 py-2.5 text-left transition-colors hover:border-brand/50', checked && 'border-brand/35 bg-brand-soft/35')}
                >
                  <span className="flex min-w-0 items-center gap-2"><span className={cn('flex size-4 items-center justify-center rounded-[2px] border', checked ? 'border-brand bg-brand text-primary-foreground' : 'border-border text-transparent')}><Check size={10} weight="bold" /></span><span className="truncate text-[12px] font-medium">{item.name}</span></span>
                  <span className="num text-[12px] text-muted-foreground">{formatNumber(item.score)}</span>
                </button>
              )
            })}
          </div>
          <div className="mt-4 border-t border-border pt-3 text-[11px] leading-4 text-muted-foreground"><Warning className="mr-1 inline-block text-warning" size={13} /> Keep the same coverage scope when comparing scores.</div>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)]">
        <Panel title="Decision notes" description="Technical readout for the selected scenario.">
          <div className="grid gap-2 sm:grid-cols-3">
            {scenario.keyChanges.map((note) => (
              <div key={note} className="flex gap-2 border-l-2 border-brand/40 pl-3 text-[12px] leading-5 text-muted-foreground"><CaretRight className="mt-1 shrink-0 text-brand" size={13} /><span>{note}</span></div>
            ))}
          </div>
        </Panel>
        <MockAnalysisChat scenario={scenario} />
      </div>
    </div>
  )
}
