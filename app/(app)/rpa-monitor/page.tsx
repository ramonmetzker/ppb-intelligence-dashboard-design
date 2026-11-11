import type { Metadata } from 'next'
import { RpaMonitorView } from '@/components/rpa/rpa-monitor-view'

export const metadata: Metadata = { title: 'RPA Monitor | PPB' }

export default function RpaMonitorPage() {
  return <RpaMonitorView />
}
