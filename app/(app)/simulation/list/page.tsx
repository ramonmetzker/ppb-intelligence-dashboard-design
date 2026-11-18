import type { Metadata } from 'next'
import { SimulationListView } from '@/components/simulation/simulation-list-view'

export const metadata: Metadata = { title: 'Simulation List | PPB' }

export default function SimulationListPage() {
  return <SimulationListView />
}
