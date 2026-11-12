import type { Metadata } from 'next'
import { MaterialPricesView } from '@/components/materials/material-prices-view'

export const metadata: Metadata = { title: 'Material Prices | PPB' }

export default function MaterialPricesPage() {
  return <MaterialPricesView />
}
