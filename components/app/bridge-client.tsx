'use client'

import { BridgePanel } from '@/components/app/bridge-panel'
import { usePlan } from '@/components/app/plan-provider'

export function BridgeClient() {
  const { sim } = usePlan()
  return <BridgePanel sim={sim} />
}
