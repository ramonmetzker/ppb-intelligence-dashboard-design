import type { Metadata } from 'next'
import { PageHeader } from '@/components/app/page-header'
import { ProductionKpis } from '@/components/app/production-kpis'
import { VolumePanel } from '@/components/app/volume-panel'

export const metadata: Metadata = { title: 'Production | PPB' }

export default function ProductionPage() {
  return (
    <>
      <PageHeader
        title="Production"
        description="Volume, local share and points for every PPB item, month by month. Switch to accumulated to see the running score."
      />
      <div className="flex flex-col gap-3">
        <ProductionKpis />
        <VolumePanel layout="full" />
      </div>
    </>
  )
}
