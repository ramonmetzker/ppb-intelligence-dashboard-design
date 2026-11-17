import type { Metadata } from 'next'
import { SimulationAnalyzer } from '@/components/simulation/simulation-analyzer'

export const metadata: Metadata = { title: 'Simulações & relatório | PPB' }

export default function SimulationPage() {
  return <SimulationAnalyzer />
}
