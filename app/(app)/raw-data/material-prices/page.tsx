import type { Metadata } from 'next'
import { MaterialPricesView } from '@/components/materials/material-prices-view'

export const metadata: Metadata = { title: 'Material Prices | Raw Data | PPB' }

export default function RawDataMaterialPricesPage() {
  return <MaterialPricesView />
}
