import type { Metadata } from 'next'
import { PageHeader } from '@/components/app/page-header'
import { PriceActions } from '@/components/materials/price-actions'
import { PriceSummary } from '@/components/materials/price-summary'
import { PriceTable } from '@/components/materials/price-table'

export const metadata: Metadata = { title: 'Material prices | PPB' }

export default function MaterialPricesPage() {
  return (
    <>
      <PageHeader
        title="Material prices"
        description="Vendor prices by material, with origin and full change history. Update them by uploading the Excel template."
      >
        <PriceActions />
      </PageHeader>
      <div className="flex flex-col gap-4">
        <PriceSummary />
        <PriceTable />
      </div>
    </>
  )
}
