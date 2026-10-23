'use client'

import { DriversPanel } from '@/components/app/drivers-panel'
import { usePlan } from '@/components/app/plan-provider'

export function DriversClient() {
  const { sim } = usePlan()
  return <DriversPanel sim={sim} />
}
