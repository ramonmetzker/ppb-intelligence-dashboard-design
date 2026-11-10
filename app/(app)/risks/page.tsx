import type { Metadata } from 'next'
import { PageHeader } from '@/components/app/page-header'
import { DriversClient } from '@/components/app/drivers-client'
import { ReadinessPanel } from '@/components/app/readiness-panel'

export const metadata: Metadata = { title: 'Risks and data | PPB' }

export default function RisksPage() {
  return (
    <>
      <PageHeader
        title="Risks and data"
        description="What pulls the score down, and whether the data behind the numbers is ready."
      />
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <DriversClient />
        <ReadinessPanel />
      </div>
    </>
  )
}
