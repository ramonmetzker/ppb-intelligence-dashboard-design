import type { Metadata } from 'next'
import { SalesDemandView } from '@/components/sales-demand/sales-demand-view'

export const metadata: Metadata = { title: 'Sales Demand | PPB' }

export default function SalesDemandPage() {
  return <SalesDemandView />
}
