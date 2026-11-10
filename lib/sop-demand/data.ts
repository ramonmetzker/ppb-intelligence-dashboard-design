import type { ColumnSchema, SelectOption } from '@/lib/data-table/types'

export type SopStatus = 'draft' | 'submitted' | 'approved' | 'locked'
export type SopFamily = 'MX' | 'VD' | 'DA'

export type SopDemand = {
  id: string
  itemCode: string
  description: string
  family: SopFamily
  product: string
  region: string
  plant: string
  owner: string
  status: SopStatus
  demand: number
  supply: number
  gap: number
  accuracy: number
  unitPrice: number
  revenue: number
  needDate: string
  updatedAt: string
  critical: boolean
}

export const STATUS_OPTIONS: readonly SelectOption[] = [
  { value: 'draft', label: 'Draft', color: 'var(--muted-foreground)' },
  { value: 'submitted', label: 'Submitted', color: 'var(--warning)' },
  { value: 'approved', label: 'Approved', color: 'var(--success)' },
  { value: 'locked', label: 'Locked', color: 'var(--brand)' },
]

const FAMILY_PRODUCTS: Record<SopFamily, string[]> = {
  MX: ['Mobile', 'Tablet', 'Wearables'],
  VD: ['TV', 'Monitor'],
  DA: ['Indoor Unit', 'Outdoor Unit'],
}

export const FAMILY_OPTIONS: readonly SelectOption[] = [
  { value: 'MX', label: 'MX' },
  { value: 'VD', label: 'VD' },
  { value: 'DA', label: 'DA' },
]

export const PRODUCT_OPTIONS: readonly SelectOption[] = Object.values(FAMILY_PRODUCTS)
  .flat()
  .map((product) => ({ value: product, label: product }))

const REGIONS = ['North America', 'Europe', 'Latin America', 'Southeast Asia', 'Middle East', 'Korea']
const PLANTS = ['Manaus', 'Suwon', 'Hanoi', 'Tijuana', 'Gumi', 'Noida']
const OWNERS = ['Ana Lima', 'Rafael Alves', 'Min-jun Park', 'Carla Souza', 'Daniel Cho', 'Marta Reis', 'Joon Kim']

export const REGION_OPTIONS: readonly SelectOption[] = REGIONS.map((r) => ({ value: r, label: r }))
export const PLANT_OPTIONS: readonly SelectOption[] = PLANTS.map((r) => ({ value: r, label: r }))
export const OWNER_OPTIONS: readonly SelectOption[] = OWNERS.map((r) => ({ value: r, label: r }))

function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const iso = (offsetDays: number) => new Date(Date.UTC(2026, 10, 10) + offsetDays * 86_400_000).toISOString().slice(0, 10)

function build(count: number): SopDemand[] {
  const rand = mulberry32(2026)
  const pick = <V,>(list: readonly V[]) => list[Math.floor(rand() * list.length)]
  const families = Object.keys(FAMILY_PRODUCTS) as SopFamily[]
  const statuses: SopStatus[] = ['draft', 'submitted', 'submitted', 'approved', 'approved', 'approved', 'locked']

  return Array.from({ length: count }, (_, index) => {
    const family = pick(families)
    const product = pick(FAMILY_PRODUCTS[family])
    const demand = Math.round((400 + rand() * 18_000) / 50) * 50
    const supply = Math.max(0, Math.round(demand * (0.78 + rand() * 0.4)))
    const unitPrice = Math.round((family === 'VD' ? 320 : family === 'DA' ? 540 : 210) * (0.6 + rand() * 1.2) * 100) / 100
    return {
      id: `sop-${String(index + 1).padStart(4, '0')}`,
      itemCode: `${family}-${product.slice(0, 3).toUpperCase()}-${String(1000 + Math.floor(rand() * 8999))}`,
      description: `${product} ${['Pro', 'Lite', 'Ultra', 'Plus', 'Core', 'Max'][Math.floor(rand() * 6)]} ${2025 + Math.floor(rand() * 3)}`,
      family,
      product,
      region: pick(REGIONS),
      plant: pick(PLANTS),
      owner: pick(OWNERS),
      status: pick(statuses),
      demand,
      supply,
      gap: supply - demand,
      accuracy: Math.round((62 + rand() * 36) * 10) / 10,
      unitPrice,
      revenue: Math.round(demand * unitPrice),
      needDate: iso(Math.floor(rand() * 150) - 20),
      updatedAt: iso(-Math.floor(rand() * 45)),
      critical: rand() < 0.12,
    }
  })
}

export const SOP_DEMAND_ROWS: readonly SopDemand[] = build(240)

/**
 * Query schema shared by the browser (client mode) and the API route (server mode).
 * It carries no JSX, so importing it on the server is safe.
 */
export const SOP_SCHEMA: ColumnSchema<SopDemand>[] = [
  { id: 'itemCode', header: 'Item code', kind: 'text' },
  { id: 'description', header: 'Description', kind: 'text' },
  { id: 'family', header: 'Family', kind: 'select', options: FAMILY_OPTIONS },
  { id: 'product', header: 'Product', kind: 'select', options: PRODUCT_OPTIONS },
  { id: 'region', header: 'Region', kind: 'select', options: REGION_OPTIONS },
  { id: 'plant', header: 'Plant', kind: 'select', options: PLANT_OPTIONS },
  { id: 'owner', header: 'Owner', kind: 'select', options: OWNER_OPTIONS },
  { id: 'status', header: 'Status', kind: 'select', options: STATUS_OPTIONS },
  { id: 'demand', header: 'Demand', kind: 'number' },
  { id: 'supply', header: 'Supply', kind: 'number' },
  { id: 'gap', header: 'Gap', kind: 'number' },
  { id: 'accuracy', header: 'Accuracy %', kind: 'number' },
  { id: 'unitPrice', header: 'Unit price', kind: 'number' },
  { id: 'revenue', header: 'Revenue', kind: 'number' },
  { id: 'needDate', header: 'Need date', kind: 'date' },
  { id: 'updatedAt', header: 'Updated', kind: 'date' },
  { id: 'critical', header: 'Critical', kind: 'boolean' },
]
