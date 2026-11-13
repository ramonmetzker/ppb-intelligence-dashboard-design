import type { ColumnSchema } from '@/lib/data-table/types'
import { productIconSvg } from './icons'

export const GBMS = ['MX', 'VD', 'DA'] as const
export type Gbm = (typeof GBMS)[number]
export type YesNo = 'Y' | 'N'

export type Product = {
  product_slug: string
  product_name: string
  product_code: string
  gbm: Gbm
  /** Comma separated plant names, e.g. "Manaus, Suwon". Use `parsePlants` to read it. */
  plants: string
  icon: string
  active_yn: YesNo
  created_at: string
  updated_at: string
}

export const PRODUCT_SEED: readonly Product[] = [
  {
    product_slug: 'mobile',
    product_name: 'Mobile',
    product_code: 'MX-MOB',
    gbm: 'MX',
    plants: 'Gumi, Hanoi, Noida, Manaus',
    icon: productIconSvg('smartphone'),
    active_yn: 'Y',
    created_at: '2026-11-01T09:00:00Z',
    updated_at: '2026-11-12T14:30:00Z',
  },
  {
    product_slug: 'tablet',
    product_name: 'Tablet',
    product_code: 'MX-TAB',
    gbm: 'MX',
    plants: 'Hanoi, Manaus',
    icon: productIconSvg('tablet'),
    active_yn: 'Y',
    created_at: '2026-11-01T09:10:00Z',
    updated_at: '2026-11-12T14:25:00Z',
  },
  {
    product_slug: 'wearables',
    product_name: 'Wearables',
    product_code: 'MX-WEA',
    gbm: 'MX',
    plants: 'Gumi, Hanoi',
    icon: productIconSvg('watch'),
    active_yn: 'Y',
    created_at: '2026-11-01T09:20:00Z',
    updated_at: '2026-11-12T14:20:00Z',
  },
  {
    product_slug: 'tv',
    product_name: 'TV',
    product_code: 'VD-TV',
    gbm: 'VD',
    plants: 'Tijuana, Manaus, Hanoi',
    icon: productIconSvg('tv'),
    active_yn: 'Y',
    created_at: '2026-11-01T09:30:00Z',
    updated_at: '2026-11-12T14:15:00Z',
  },
  {
    product_slug: 'monitor',
    product_name: 'Monitor',
    product_code: 'VD-MON',
    gbm: 'VD',
    plants: 'Tijuana, Suwon',
    icon: productIconSvg('monitor'),
    active_yn: 'Y',
    created_at: '2026-11-01T09:40:00Z',
    updated_at: '2026-11-12T14:10:00Z',
  },
  {
    product_slug: 'indoor-unit',
    product_name: 'Indoor Unit',
    product_code: 'DA-IN',
    gbm: 'DA',
    plants: 'Noida, Suwon, Manaus',
    icon: productIconSvg('air-vent'),
    active_yn: 'Y',
    created_at: '2026-11-01T09:50:00Z',
    updated_at: '2026-11-12T14:05:00Z',
  },
  {
    product_slug: 'outdoor-unit',
    product_name: 'Outdoor Unit',
    product_code: 'DA-OUT',
    gbm: 'DA',
    plants: 'Noida, Suwon',
    icon: productIconSvg('fan'),
    active_yn: 'Y',
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-12T14:00:00Z',
  },
]

/** Splits the stored comma separated string into trimmed, de-duplicated plant names. */
export function parsePlants(value: string): string[] {
  const seen = new Set<string>()
  const plants: string[] = []
  for (const part of value.split(',')) {
    const plant = part.trim()
    const key = plant.toLowerCase()
    if (!plant || seen.has(key)) continue
    seen.add(key)
    plants.push(plant)
  }
  return plants
}

export const formatPlants = (plants: readonly string[]) => plants.join(', ')

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const PRODUCT_SCHEMA: ColumnSchema<Product>[] = [
  { id: 'icon', header: 'Icon', kind: 'text' },
  { id: 'product_name', header: 'Product Name', kind: 'text' },
  { id: 'product_slug', header: 'Product Slug', kind: 'text' },
  { id: 'product_code', header: 'Product Code', kind: 'text' },
  { id: 'gbm', header: 'GBM', kind: 'text' },
  {
    id: 'plants',
    header: 'Plants',
    kind: 'text',
    searchText: (row) => parsePlants(row.plants).join(' '),
  },
  { id: 'active_yn', header: 'Active', kind: 'text' },
  { id: 'created_at', header: 'Created At', kind: 'text' },
  { id: 'updated_at', header: 'Updated At', kind: 'text' },
]
