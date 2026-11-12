import type { Metadata } from 'next'
import { UiParametersView } from '@/components/ui-parameters/ui-parameters-view'

export const metadata: Metadata = { title: 'UI Parameters | Raw Data | PPB' }

export default function UiParametersPage() {
  return <UiParametersView />
}
