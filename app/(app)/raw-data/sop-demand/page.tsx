import type { Metadata } from 'next'
import { SopDemandView } from '@/components/sop-demand/sop-demand-view'

export const metadata: Metadata = { title: 'SOP Demand | Raw Data | PPB' }

export default function RawDataSopDemandPage() {
  return <SopDemandView />
}
