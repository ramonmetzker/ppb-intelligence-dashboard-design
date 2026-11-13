import {
  AirVent,
  Fan,
  Monitor,
  Package,
  Smartphone,
  Tablet,
  Tv,
  Watch,
  type LucideIcon,
} from 'lucide-react'

export type ProductIconKey =
  | 'smartphone'
  | 'tablet'
  | 'watch'
  | 'tv'
  | 'monitor'
  | 'air-vent'
  | 'fan'
  | 'package'

type ProductIconOption = {
  key: ProductIconKey
  label: string
  Icon: LucideIcon
  svg: string
}

export const PRODUCT_ICON_OPTIONS: readonly ProductIconOption[] = [
  {
    key: 'smartphone',
    label: 'Smartphone',
    Icon: Smartphone,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><path d="M12 18h.01"></path></svg>`,
  },
  {
    key: 'tablet',
    label: 'Tablet',
    Icon: Tablet,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"></rect><line x1="12" x2="12.01" y1="18" y2="18"></line></svg>`,
  },
  {
    key: 'watch',
    label: 'Wearables',
    Icon: Watch,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 10v2.2l1.6 1"></path><path d="m16.13 7.66-.81-4.05a2 2 0 0 0-2-1.61h-2.68a2 2 0 0 0-2 1.61l-.78 4.05"></path><path d="m7.88 16.36.8 4a2 2 0 0 0 2 1.61h2.72a2 2 0 0 0 2-1.61l.81-4.05"></path><circle cx="12" cy="12" r="6"></circle></svg>`,
  },
  {
    key: 'tv',
    label: 'TV',
    Icon: Tv,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m17 2-5 5-5-5"></path><rect width="20" height="15" x="2" y="7" rx="2"></rect></svg>`,
  },
  {
    key: 'monitor',
    label: 'Monitor',
    Icon: Monitor,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"></rect><line x1="8" x2="16" y1="21" y2="21"></line><line x1="12" x2="12" y1="17" y2="21"></line></svg>`,
  },
  {
    key: 'air-vent',
    label: 'Indoor unit',
    Icon: AirVent,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 17.5a2.5 2.5 0 1 1-4 2.03V12"></path><path d="M6 12H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><path d="M6 8h12"></path><path d="M6.6 15.572A2 2 0 1 0 10 17v-5"></path></svg>`,
  },
  {
    key: 'fan',
    label: 'Outdoor unit',
    Icon: Fan,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.827 16.379a6.082 6.082 0 0 1-8.618-7.002l5.412 1.45a6.082 6.082 0 0 1 7.002-8.618l-1.45 5.412a6.082 6.082 0 0 1 8.618 7.002l-5.412-1.45a6.082 6.082 0 0 1-7.002 8.618l1.45-5.412Z"></path><path d="M12 12v.01"></path></svg>`,
  },
  {
    key: 'package',
    label: 'Package',
    Icon: Package,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path><path d="M12 22V12"></path><polyline points="3.29 7 12 12 20.71 7"></polyline><path d="m7.5 4.27 9 5.15"></path></svg>`,
  },
]

const OPTION_BY_KEY = new Map(PRODUCT_ICON_OPTIONS.map((option) => [option.key, option]))

export function productIconSvg(key: ProductIconKey) {
  return OPTION_BY_KEY.get(key)?.svg ?? OPTION_BY_KEY.get('package')!.svg
}

export function sanitizeIconSvg(value: string) {
  const svg = value.trim().match(/<svg\b[\s\S]*<\/svg>/i)?.[0] ?? ''
  if (!svg) return ''

  return svg
    .replace(/<\/?(?:script|foreignObject|iframe|object|embed|style|link)\b[^>]*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+(?:href|xlink:href|src|style)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/<svg\b([^>]*)>/i, (_, attributes: string) => {
      const cleanAttributes = attributes.replace(/\s+(?:width|height)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      return `<svg${cleanAttributes} width="100%" height="100%">`
    })
}
