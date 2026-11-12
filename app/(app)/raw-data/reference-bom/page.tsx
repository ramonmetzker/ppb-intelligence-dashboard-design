import type { Metadata } from 'next'
import { ReferenceBomView } from '@/components/reference-bom/reference-bom-view'

export const metadata: Metadata = { title: 'Reference BOM | Raw Data | PPB' }

export default function ReferenceBomPage() {
  return <ReferenceBomView />
}
