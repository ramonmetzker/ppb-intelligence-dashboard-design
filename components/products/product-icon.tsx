import { cn } from '@/lib/utils'
import { PRODUCT_ICON_OPTIONS, sanitizeIconSvg } from '@/lib/products/icons'

const ICON_BY_SLUG = {
  mobile: 'smartphone',
  tablet: 'tablet',
  wearables: 'watch',
  tv: 'tv',
  monitor: 'monitor',
  'indoor-unit': 'air-vent',
  'outdoor-unit': 'fan',
} as const

export function ProductIcon({
  icon,
  slug,
  className,
}: {
  icon?: string
  slug?: string
  className?: string
}) {
  const fallbackKey = slug && slug in ICON_BY_SLUG ? ICON_BY_SLUG[slug as keyof typeof ICON_BY_SLUG] : 'package'
  const fallback = PRODUCT_ICON_OPTIONS.find((option) => option.key === fallbackKey)?.svg ?? ''
  const svg = sanitizeIconSvg(icon ?? '') || fallback

  return <span aria-hidden="true" className={cn('inline-flex shrink-0', className)} dangerouslySetInnerHTML={{ __html: svg }} />
}
