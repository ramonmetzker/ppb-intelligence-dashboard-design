'use client'

import { useMemo, useState } from 'react'
import {
  SCENARIOS,
  matchScenario,
  simulate,
  type LeverKey,
  type Levers,
  type Scenario,
} from '@/lib/ppb-model'
import { PageHeader } from '@/components/app/page-header'
import { ScoreStatus } from '@/components/app/score-status'
import { ScenarioPicker } from '@/components/app/scenario-picker'
import { TrajectoryPanel } from '@/components/app/trajectory-panel'
import { LeverPanel } from '@/components/app/lever-panel'
import { BridgePanel } from '@/components/app/bridge-panel'
import { ItemScoresPanel } from '@/components/app/item-scores-panel'
import { VolumePanel } from '@/components/app/volume-panel'
import { DriversPanel } from '@/components/app/drivers-panel'
import { ReadinessPanel } from '@/components/app/readiness-panel'

const DEFAULT_SCENARIO = SCENARIOS[1]

export function PpbWorkspace() {
  const [levers, setLevers] = useState<Levers>(DEFAULT_SCENARIO.levers)
  const [lastScenario, setLastScenario] = useState<Scenario>(DEFAULT_SCENARIO)

  const sim = useMemo(() => simulate(levers), [levers])
  const active = matchScenario(levers)
  const scenarioName = active?.name ?? 'Custom scenario'

  const selectScenario = (scenario: Scenario) => {
    setLastScenario(scenario)
    setLevers(scenario.levers)
  }

  const changeLever = (key: LeverKey, value: number) =>
    setLevers((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="flex flex-col gap-3">
      <PageHeader />
      <ScoreStatus sim={sim} scenarioName={scenarioName} />
      <ScenarioPicker
        activeId={active?.id ?? 'custom'}
        customFrom={lastScenario.name.split(' ')[0]}
        onSelect={selectScenario}
        onReset={() => setLevers(lastScenario.levers)}
      />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <TrajectoryPanel sim={sim} scenarioName={scenarioName} />
        <div id="changes" className="min-w-0">
          <LeverPanel sim={sim} onChange={changeLever} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <BridgePanel sim={sim} />
        <ItemScoresPanel sim={sim} />
      </div>

      <VolumePanel levers={levers} />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <DriversPanel sim={sim} />
        <ReadinessPanel />
      </div>

      <footer className="pt-1 pb-4 text-[11.5px] text-muted-foreground">
        Scenario results are model estimates built on October actuals. Changes apply to November and December production only.
      </footer>
    </div>
  )
}
