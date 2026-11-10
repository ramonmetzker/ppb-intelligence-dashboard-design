import { AirVent, Fan, Monitor, Package, Smartphone, Tablet, Tv, Watch, type LucideIcon } from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  mobile: Smartphone,
  tablet: Tablet,
  wearables: Watch,
  tv: Tv,
  monitor: Monitor,
  'indoor-unit': AirVent,
  'outdoor-unit': Fan,
}

export function ProductIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? Package
  return <Icon aria-hidden="true" className={className} />
}
