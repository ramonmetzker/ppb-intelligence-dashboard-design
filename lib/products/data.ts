import type { ColumnSchema } from '@/lib/data-table/types'
import { productIconSvg } from './icons'

export const GBMS = ['MX', 'VD', 'DA'] as const
export type Gbm = (typeof GBMS)[number]
export type YesNo = 'Y' | 'N'

export type Product = {
  product_slug: string
  product_name: string
  product_code: string
  order: number
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
    order: 1,
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
    order: 2,
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
    order: 3,
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
    order: 1,
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
    order: 2,
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
    order: 1,
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
    order: 2,
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

export const PRODUCT_SCORE_YEARS = ['2027', '2026', '2025'] as const
export type ProductScoreYear = (typeof PRODUCT_SCORE_YEARS)[number]
export type ProductAnnualScoreType = 'quota' | 'points'

export type ProductAnnualScore = {
  product_slug: string
  annual_score: number
  score_type: ProductAnnualScoreType
  year: ProductScoreYear
}

export const PRODUCT_ANNUAL_SCORE_SEED: readonly ProductAnnualScore[] = [
  { product_slug: 'mobile', annual_score: 62, score_type: 'quota', year: '2027' },
  { product_slug: 'tablet', annual_score: 28, score_type: 'points', year: '2027' },
  { product_slug: 'wearables', annual_score: 18, score_type: 'points', year: '2027' },
  { product_slug: 'tv', annual_score: 55, score_type: 'quota', year: '2027' },
  { product_slug: 'monitor', annual_score: 24, score_type: 'points', year: '2027' },
  { product_slug: 'indoor-unit', annual_score: 48, score_type: 'quota', year: '2027' },
  { product_slug: 'outdoor-unit', annual_score: 22, score_type: 'points', year: '2027' },
  { product_slug: 'mobile', annual_score: 60, score_type: 'quota', year: '2026' },
  { product_slug: 'tablet', annual_score: 26, score_type: 'points', year: '2026' },
  { product_slug: 'wearables', annual_score: 16, score_type: 'points', year: '2026' },
  { product_slug: 'tv', annual_score: 52, score_type: 'quota', year: '2026' },
  { product_slug: 'monitor', annual_score: 22, score_type: 'points', year: '2026' },
  { product_slug: 'indoor-unit', annual_score: 45, score_type: 'quota', year: '2026' },
  { product_slug: 'outdoor-unit', annual_score: 20, score_type: 'points', year: '2026' },
  { product_slug: 'mobile', annual_score: 58, score_type: 'quota', year: '2025' },
  { product_slug: 'tablet', annual_score: 24, score_type: 'points', year: '2025' },
  { product_slug: 'wearables', annual_score: 15, score_type: 'points', year: '2025' },
  { product_slug: 'tv', annual_score: 50, score_type: 'quota', year: '2025' },
  { product_slug: 'monitor', annual_score: 21, score_type: 'points', year: '2025' },
  { product_slug: 'indoor-unit', annual_score: 43, score_type: 'quota', year: '2025' },
  { product_slug: 'outdoor-unit', annual_score: 19, score_type: 'points', year: '2025' },
]

export function annualScoreFor(productSlug: string, year: ProductScoreYear): ProductAnnualScore {
  return PRODUCT_ANNUAL_SCORE_SEED.find((score) => score.product_slug === productSlug && score.year === year) ?? {
    product_slug: productSlug,
    annual_score: 0,
    score_type: 'points',
    year,
  }
}

export const PRODUCT_SCHEMA: ColumnSchema<Product>[] = [
  { id: 'icon', header: 'Icon', kind: 'text' },
  { id: 'product_name', header: 'Product Name', kind: 'text' },
  { id: 'product_slug', header: 'Product Slug', kind: 'text' },
  { id: 'product_code', header: 'Product Code', kind: 'text' },
  { id: 'order', header: 'Order', kind: 'number' },
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
