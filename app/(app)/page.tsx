import type { Metadata } from 'next'
import { StoryStatus } from '@/components/app/story-status'
import { VolumePanel } from '@/components/app/volume-panel'
import { TrajectoryPanel } from '@/components/app/trajectory-client'
import { PlanSummary } from '@/components/app/plan-summary'
import { Reveal } from '@/components/app/reveal'

export const metadata: Metadata = { title: 'Overview | PPB Intelligence' }

export default function OverviewPage() {
  return (
    <>
      <div className="flex flex-col gap-3">
        <StoryStatus />
        <Reveal>
          <VolumePanel />
        </Reveal>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Reveal className="flex h-full flex-col *:flex-1">
            <TrajectoryPanel />
          </Reveal>
          <Reveal delay={140} className="flex h-full flex-col *:flex-1">
            <PlanSummary />
          </Reveal>
        </div>
      </div>
    </>
  )
}
