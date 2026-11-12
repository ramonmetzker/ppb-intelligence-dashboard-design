import type { Metadata } from 'next'
import { PpbItemsView } from '@/components/ppb-items/ppb-items-view'

export const metadata: Metadata = { title: 'PPB Items | Raw Data | PPB' }

export default function PpbItemsPage() {
  return <PpbItemsView />
}
