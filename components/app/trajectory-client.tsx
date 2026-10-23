'use client'

import { TrajectoryPanel as Chart } from '@/components/app/trajectory-panel'
import { usePlan } from '@/components/app/plan-provider'

export function TrajectoryPanel() {
  const { sim, planName } = usePlan()
  return <Chart sim={sim} scenarioName={planName} />
}
