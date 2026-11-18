import type { Metadata } from 'next'
import { RpaDetailView } from '@/components/rpa/rpa-detail-view'

export const metadata: Metadata = { title: 'RPA Details | RPA Monitor | PPB' }

export default async function RpaDetailsPage({ params }: { params: Promise<{ rpaId: string }> }) {
  const { rpaId } = await params
  return <RpaDetailView rpaId={rpaId} />
}
