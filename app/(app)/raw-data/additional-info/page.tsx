import type { Metadata } from 'next'
import { AdditionalInfoView } from '@/components/additional-info/additional-info-view'

export const metadata: Metadata = { title: 'Additional Info | Raw Data | PPB' }

export default function RawDataAdditionalInfoPage() {
  return <AdditionalInfoView />
}
