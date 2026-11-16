import type { Metadata } from 'next'
import { ConstraintsView } from '@/components/constraints/constraints-view'

export const metadata: Metadata = { title: 'Constraints | Simulation | PPB' }

export default function ConstraintsPage() {
  return <ConstraintsView />
}
