'use client'

import { useState } from 'react'
import {
  CaretDown,
  CaretRight,
  Check,
  DownloadSimple,
  Info,
  LockKey,
} from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/app/page-header'
import { Panel } from '@/components/app/panel'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
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

function formatNumber(value: number) {
  return decimal.format(value)
}

function formatSigned(value: number, suffix = '') {
  return `${value > 0 ? '+' : ''}${formatNumber(value)}${suffix}`
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

function ScenarioSelector({
  selectedIds,
  onToggle,
}: {
  selectedIds: string[]
  onToggle: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selectedScenarios = selectedIds.map((id) => simulationScenarios.find((item) => item.id === id)).filter((item): item is SimulationScenario => Boolean(item))
  const primaryScenario = selectedScenarios[0] ?? simulationScenarios[1]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            aria-label={`Simulations selected: ${selectedScenarios.map((item) => item.name).join(', ')}`}
            className="h-12 w-full justify-between gap-3 px-3 text-left"
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-[2px] bg-brand text-primary-foreground">
            <LockKey size={14} />
          </span>
          <span className="flex min-w-0 flex-col items-start gap-0.5">
            <span className="eyebrow">Simulations · {selectedScenarios.length}/3</span>
            <span className="truncate text-[12px] font-semibold">{primaryScenario.name}{selectedScenarios.length > 1 ? ` + ${selectedScenarios.length - 1}` : ''}</span>
          </span>
        </span>
        <CaretDown size={15} className="shrink-0 text-muted-foreground" aria-hidden="true" />
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-[min(360px,calc(100vw-24px))] gap-0 p-0">
        <PopoverHeader className="px-3 py-3">
          <PopoverTitle>Choose simulations</PopoverTitle>
          <PopoverDescription>Select up to three. The first selected is predominant.</PopoverDescription>
        </PopoverHeader>
        <div className="flex flex-col gap-1 border-t border-border p-2">
          {simulationScenarios.map((scenario) => {
            const selectedIndex = selectedIds.indexOf(scenario.id)
            const selected = selectedIndex !== -1
            const maxReached = selectedIds.length >= 3 && !selected
            const delta = scenario.score - reportFacts.sopScore
            const savings = scenario.knownCostDelta === null ? null : Math.abs(scenario.knownCostDelta)

            return (
              <button
                key={scenario.id}
                type="button"
                aria-pressed={selected}
                aria-disabled={maxReached}
                disabled={maxReached}
                onClick={() => onToggle(scenario.id)}
                className={cn('flex items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45', selected && 'bg-brand-soft/35')}
              >
                <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-[2px] border', selected ? 'border-brand bg-brand text-primary-foreground' : 'border-border text-transparent')}>
                  <Check size={11} weight="bold" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="truncate text-[12px] font-semibold">{scenario.name}</span>
                    <span className={cn('num shrink-0 font-semibold', selectedIndex === 0 ? 'text-[13px]' : 'text-[11px] text-muted-foreground')}>{formatNumber(scenario.score)}</span>
                  </span>
                  <span className="mt-1 flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
                    <span>{selectedIndex === 0 ? 'Predominant · ' : ''}{scenario.simulatedMonths.join(' · ')} · <ScenarioStatus scenario={scenario} /></span>
                    <span className={cn('num font-semibold', savings ? 'text-success' : delta >= 0 ? 'text-success' : 'text-muted-foreground')}>
                      {savings === null ? formatSigned(delta, ' pts') : `${formatCurrency(savings)} saved`}
                    </span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
        <div className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">{selectedIds.length} of 3 simulations selected</div>
      </PopoverContent>
    </Popover>
  )
}

function scorePosition(value: number) {
  return Math.min(100, Math.max(0, ((value - 660) / 20) * 100))
}

function ScoreRail({ label, score, predominant = false, sop = false }: { label: string; score: number; predominant?: boolean; sop?: boolean }) {
  return (
    <div className={cn('space-y-1', !predominant && !sop && 'opacity-75')}>
      <div className="flex items-center justify-between gap-3">
        <span className={cn('truncate', predominant ? 'text-[11px] font-semibold text-foreground' : 'text-[10px] text-muted-foreground')}>{label}</span>
        <span className={cn('num shrink-0 font-semibold', predominant ? 'text-[14px] text-foreground' : sop ? 'text-[11px] text-foreground' : 'text-[11px] text-muted-foreground')}>{formatNumber(score)}</span>
      </div>
      <div className="relative h-3" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border" />
        <div className={cn('absolute left-0 top-1/2 -translate-y-1/2', predominant ? 'h-[3px] bg-brand' : sop ? 'h-[2px] bg-foreground/70' : 'h-[2px] bg-brand/55')} style={{ width: `${scorePosition(score)}%` }} />
        <span className="absolute top-0 h-3 w-px bg-warning/80" style={{ left: `${scorePosition(reportFacts.requestedScore)}%` }} />
      </div>
    </div>
  )
}

function ScoreResult({ scenarios }: { scenarios: SimulationScenario[] }) {
  const primaryScenario = scenarios[0]
  const scoreDelta = primaryScenario.score - reportFacts.sopScore
  const targetGap = primaryScenario.score - reportFacts.requestedScore
  const months = Array.from(new Set(scenarios.flatMap((scenario) => scenario.simulatedMonths))).join(' · ')

  return (
    <Panel title="Simulation result" description={`${primaryScenario.name}${scenarios.length > 1 ? ` + ${scenarios.length - 1} comparison` : ''} · ${months}`}>
      <div className="grid gap-5 lg:grid-cols-[1fr_190px] lg:items-center">
        <div>
          <p className="eyebrow">Predominant score achieved</p>
          <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
            <p className="num text-[44px] leading-10 font-semibold">{formatNumber(primaryScenario.score)}</p>
            <span className={cn('num pb-1 text-[14px] font-semibold', scoreDelta >= 0 ? 'text-success' : 'text-warning')}>
              {formatSigned(scoreDelta, ' vs SOP')}
            </span>
          </div>
          <p className="mt-2 text-[12px] text-muted-foreground">SOP / current plan without simulation: <span className="num font-semibold text-foreground">{formatNumber(reportFacts.sopScore)}</span></p>

          <div className="mt-7 space-y-3" role="group" aria-label={`Selected simulation scores compared with SOP. Target ${formatNumber(reportFacts.requestedScore)}.`}>
            {scenarios.map((scenario, index) => (
              <ScoreRail key={scenario.id} label={index === 0 ? `Simulation · ${scenario.shortName}` : `Also selected · ${scenario.shortName}`} score={scenario.score} predominant={index === 0} />
            ))}
            <div className="border-t border-border pt-3">
              <ScoreRail label="SOP / current plan" score={reportFacts.sopScore} sop />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground"><span>660</span><span>670</span><span>680</span></div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-[1px] bg-brand" /> Simulation</span>
            <span className="flex items-center gap-1.5"><span className="size-2 rounded-[1px] bg-foreground" /> SOP</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-px bg-warning" /> Target {formatNumber(reportFacts.requestedScore)}</span>
          </div>
        </div>

        <div className="border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <p className="eyebrow">Target gap</p>
          <p className={cn('num mt-1 text-[30px] leading-8 font-semibold', targetGap >= 0 ? 'text-success' : 'text-warning')}>
            {formatSigned(targetGap, ' pts')}
          </p>
          <p className="mt-1 text-[11px] leading-4 text-muted-foreground">Target {formatNumber(reportFacts.requestedScore)}</p>
          <p className="mt-4 border-t border-border pt-3 text-[11px] leading-4 text-muted-foreground">The first selected simulation is the predominant result.</p>
        </div>
      </div>
    </Panel>
  )
}

function CostImpact({ scenario }: { scenario: SimulationScenario }) {
  const savings = scenario.knownCostDelta === null ? null : Math.abs(scenario.knownCostDelta)

  return (
    <Panel title="Cost impact" description="Known cost compared with the SOP / current plan.">
      <div className="border-b border-border pb-4">
        <p className="eyebrow">Potential saving vs SOP</p>
        <p className={cn('num mt-1 text-[32px] leading-9 font-semibold', savings ? 'text-success' : 'text-muted-foreground')}>
          {savings === null ? '—' : formatCurrency(savings)}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">{savings === null ? 'Cost not reconstructed for this run' : 'Known reduction from the simulated sourcing mix'}</p>
      </div>
      <dl className="divide-y divide-border">
        <DetailRow label="SOP / current plan" value={formatCurrency(reportFacts.sopKnownCost)} />
        <DetailRow label="Simulation known cost" value={formatCurrency(scenario.knownCost)} />
        <DetailRow label="Simulated months" value={scenario.simulatedMonths.join(' · ')} />
      </dl>
    </Panel>
  )
}

function DetailRow({ label, value, tone = 'default' }: { label: string; value: string; tone?: MetricTone }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 first:pt-3 last:pb-0">
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className={cn('num text-right text-[12px] font-semibold', toneClasses(tone))}>{value}</dd>
    </div>
  )
}

function MonthlyDeltaTable({ scenario }: { scenario: SimulationScenario }) {
  const [expanded, setExpanded] = useState(false)
  const visibleChanges = expanded ? scenario.monthlyChanges : scenario.monthlyChanges.slice(0, 4)
  const hasMoreRows = scenario.monthlyChanges.length > 4

  return (
    <Panel
      title="Simulated months"
      description="Line-item impact within the selected simulation window."
      action={hasMoreRows ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-[11px]"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Collapse table' : `Full table (${scenario.monthlyChanges.length})`}
          <CaretDown size={13} className={cn('transition-transform', expanded && 'rotate-180')} />
        </Button>
      ) : null}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[12px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              <th scope="col" className="pb-2 font-medium">Month</th>
              <th scope="col" className="pb-2 font-medium">Item</th>
              <th scope="col" className="pb-2 font-medium">PN</th>
              <th scope="col" className="pb-2 text-right font-medium">SOP</th>
              <th scope="col" className="pb-2 text-right font-medium">Simulation</th>
              <th scope="col" className="pb-2 text-right font-medium">Saving</th>
            </tr>
          </thead>
          <tbody>
            {visibleChanges.map((change) => (
              <tr key={`${scenario.id}-${change.month}-${change.pn}`} className="border-t border-border/70">
                <th scope="row" className="py-2.5 text-left font-medium">{change.month}</th>
                <td className="py-2.5 text-muted-foreground">{change.item}</td>
                <td className="num py-2.5 text-muted-foreground">{change.pn}</td>
                <td className="num py-2.5 text-right">{formatCurrency(change.baseline)}</td>
                <td className="num py-2.5 text-right">{formatCurrency(change.scenario)}</td>
                <td className={cn('num py-2.5 text-right font-semibold', change.delta < 0 ? 'text-success' : change.delta > 0 ? 'text-warning' : 'text-muted-foreground')}>
                  {change.delta < 0 ? formatCurrency(Math.abs(change.delta)) : change.delta > 0 ? `+${formatCurrency(change.delta)}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function PendingInputs({ scenario }: { scenario: SimulationScenario }) {
  return (
    <Panel title="Data completeness" description="Validation items kept separate from the simulation result.">
      <div className="grid gap-3 sm:grid-cols-3">
        <PendingMetric label="Origin pending" value={String(scenario.unknownOriginLines)} detail="Lines outside score" />
        <PendingMetric label="Priced lines" value={`${scenario.pricedLines} / ${scenario.totalLines}`} detail="Price coverage" />
        <PendingMetric label="Confidence" value={scenario.type === 'previous' ? 'Low' : reportFacts.confidence} detail="Current run" />
      </div>
      <div className="mt-4 flex items-start gap-2 border-t border-border pt-3 text-[11px] leading-4 text-muted-foreground">
        <Info className="mt-0.5 shrink-0 text-brand" size={14} />
        <span>Pending inputs do not change the selected score until origin and price are confirmed.</span>
      </div>
    </Panel>
  )
}

function PendingMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="border-l-2 border-warning/50 pl-3">
      <p className="eyebrow">{label}</p>
      <p className="num mt-1 text-[20px] font-semibold text-warning">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
    </div>
  )
}

function DecisionNotes({ scenario }: { scenario: SimulationScenario }) {
  return (
    <Panel title="Decision notes" description="Technical readout for the selected simulation.">
      <div className="grid gap-3 sm:grid-cols-3">
        {scenario.keyChanges.map((note) => (
          <div key={note} className="flex gap-2 border-l-2 border-brand/40 pl-3 text-[12px] leading-5 text-muted-foreground">
            <CaretRight className="mt-1 shrink-0 text-brand" size={13} />
            <span>{note}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

export function SimulationAnalyzer() {
  const [selectedScenarioIds, setSelectedScenarioIds] = useState(['recommended'])
  const selectedScenarios = selectedScenarioIds.map((id) => simulationScenarios.find((item) => item.id === id)).filter((item): item is SimulationScenario => Boolean(item))
  const primaryScenario = selectedScenarios[0] ?? simulationScenarios[1]

  function toggleScenario(id: string) {
    setSelectedScenarioIds((current) => {
      if (current.includes(id)) {
        return current.length === 1 ? current : current.filter((item) => item !== id)
      }
      return current.length >= 3 ? current : [...current, id]
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <PageHeader title="Simulation analysis" description="Compare selected simulation months with the SOP / current plan.">
        <Button variant="outline" className="gap-2"><DownloadSimple size={15} /> Export</Button>
      </PageHeader>

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,3fr)_minmax(270px,1fr)]">
        <main className="flex min-w-0 flex-col gap-3">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
            <ScoreResult scenarios={selectedScenarios.length > 0 ? selectedScenarios : [primaryScenario]} />
            <CostImpact scenario={primaryScenario} />
          </div>
          <MonthlyDeltaTable scenario={primaryScenario} />
          <DecisionNotes scenario={primaryScenario} />
          <PendingInputs scenario={primaryScenario} />
        </main>

        <aside className="flex min-w-0 flex-col gap-3">
          <ScenarioSelector selectedIds={selectedScenarioIds} onToggle={toggleScenario} />
          <div className="xl:sticky xl:top-3">
            <MockAnalysisChat scenario={primaryScenario} />
          </div>
        </aside>
      </div>
    </div>
  )
}
