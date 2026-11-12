import type { Metadata } from 'next'
import { SalesDemandView } from '@/components/sales-demand/sales-demand-view'

export const metadata: Metadata = { title: 'Sales Demand | Raw Data | PPB' }

export default function RawDataSalesDemandPage() {
  return <SalesDemandView />
}
