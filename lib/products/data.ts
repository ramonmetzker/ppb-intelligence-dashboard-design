import type { ColumnSchema } from '@/lib/data-table/types'

export const GBMS = ['MX', 'VD', 'DA'] as const
export type Gbm = (typeof GBMS)[number]

export type Product = {
  id: string
  gbm: Gbm
  name: string
  slug: string
  /** Comma separated plant names, e.g. "Manaus, Suwon". Use `parsePlants` to read it. */
  plants: string
  order: number
}

export const PRODUCT_SEED: readonly Product[] = [
  { id: 'mobile', gbm: 'MX', name: 'Mobile', slug: 'mobile', plants: 'Gumi, Hanoi, Noida, Manaus', order: 1 },
  { id: 'tablet', gbm: 'MX', name: 'Tablet', slug: 'tablet', plants: 'Hanoi, Manaus', order: 2 },
  { id: 'wearables', gbm: 'MX', name: 'Wearables', slug: 'wearables', plants: 'Gumi, Hanoi', order: 3 },
  { id: 'tv', gbm: 'VD', name: 'TV', slug: 'tv', plants: 'Tijuana, Manaus, Hanoi', order: 1 },
  { id: 'monitor', gbm: 'VD', name: 'Monitor', slug: 'monitor', plants: 'Tijuana, Suwon', order: 2 },
  { id: 'indoor-unit', gbm: 'DA', name: 'Indoor Unit', slug: 'indoor-unit', plants: 'Noida, Suwon, Manaus', order: 1 },
  { id: 'outdoor-unit', gbm: 'DA', name: 'Outdoor Unit', slug: 'outdoor-unit', plants: 'Noida, Suwon', order: 2 },
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
  { id: 'name', header: 'Product Name', kind: 'text' },
  { id: 'slug', header: 'Product Slug', kind: 'text' },
  {
    id: 'plants',
    header: 'Plants',
    kind: 'text',
    searchText: (row) => parsePlants(row.plants).join(' '),
  },
  { id: 'order', header: 'Order', kind: 'number' },
]
