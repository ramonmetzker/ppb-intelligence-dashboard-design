import type { Metadata } from 'next'
import { SopDemandView } from '@/components/sop-demand/sop-demand-view'

export const metadata: Metadata = { title: 'SOP Demand | PPB' }

export default function SopDemandPage() {
  return <SopDemandView />
}
