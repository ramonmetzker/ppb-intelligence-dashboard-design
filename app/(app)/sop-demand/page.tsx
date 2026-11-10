import type { Metadata } from 'next'
import { SopDemandView } from '@/components/sop-demand/sop-demand-view'

export const metadata: Metadata = { title: 'SOP Demand | PPB' }

export default async function SopDemandPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams
  return <SopDemandView initialMode={mode === 'server' ? 'server' : 'client'} />
}
