'use client'

import { TrajectoryPanel as Chart } from '@/components/app/trajectory-panel'
import { usePlan } from '@/components/app/plan-provider'
import { TrajectoryPanelSkeleton } from '@/components/app/overview-skeletons'

export function TrajectoryPanel() {
  const { sim, planName, isLoading } = usePlan()
  if (isLoading) return <TrajectoryPanelSkeleton />
  return <Chart sim={sim} scenarioName={planName} />
}
