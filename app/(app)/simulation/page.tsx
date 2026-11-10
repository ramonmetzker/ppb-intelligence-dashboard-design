import type { Metadata } from 'next'
import { PageHeader } from '@/components/app/page-header'
import { SuggestionPicker } from '@/components/app/suggestion-picker'
import { PlanEditor } from '@/components/app/plan-editor'
import { PlanResult } from '@/components/app/plan-result'
import { BridgeClient } from '@/components/app/bridge-client'
import { TrajectoryPanel } from '@/components/app/trajectory-client'

export const metadata: Metadata = { title: 'Simulation | PPB' }

export default function SimulationPage() {
  return (
    <>
      <PageHeader
        title="Simulation"
        description="Set the local share you expect in November and December. Closed months stay as they are."
      />
      <div className="flex flex-col gap-3">
        <SuggestionPicker />
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <PlanEditor />
          <PlanResult />
        </div>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <BridgeClient />
          <TrajectoryPanel />
        </div>
      </div>
    </>
  )
}
