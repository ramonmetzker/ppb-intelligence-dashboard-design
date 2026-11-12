import type { ColumnSchema } from '@/lib/data-table/types'

export const PPB_CATEGORIES = [
  'Local Purchasing',
  'In-house Production',
  'Localization N/A',
] as const

export type PpbCategory = (typeof PPB_CATEGORIES)[number]
export type YesNo = 'Y' | 'N'

export type PpbItem = {
  id: string
  itemName: string
  itemSlug: string
  category: PpbCategory
  mapping: YesNo
  active: YesNo
}

export const PPB_ITEM_SEED: readonly PpbItem[] = [
  { id: 'memory', itemName: 'Memory', itemSlug: 'memory', category: 'Local Purchasing', mapping: 'Y', active: 'Y' },
  { id: 'battery', itemName: 'Battery', itemSlug: 'battery', category: 'Local Purchasing', mapping: 'Y', active: 'Y' },
  { id: 'adapter', itemName: 'Adapter', itemSlug: 'adapter', category: 'Local Purchasing', mapping: 'Y', active: 'Y' },
  { id: 'pba-assy', itemName: 'PBA Assy', itemSlug: 'pba-assy', category: 'In-house Production', mapping: 'Y', active: 'Y' },
  { id: 'main', itemName: 'Main', itemSlug: 'main', category: 'In-house Production', mapping: 'Y', active: 'Y' },
  { id: 'insp-process', itemName: 'Insp. Process', itemSlug: 'insp-process', category: 'In-house Production', mapping: 'Y', active: 'Y' },
  { id: 'rfid', itemName: 'RFID', itemSlug: 'rfid', category: 'Local Purchasing', mapping: 'Y', active: 'Y' },
]

export type PpbPlant = 'P81J' | 'P81M'

export type PpbNcmMapping = {
  id: string
  plant: PpbPlant
  ncm: string
  suframa: string
  itemId: string
  lastUpdated: string
}

export const PPB_NCM_MAPPING_SEED: readonly PpbNcmMapping[] = [
  { id: 'p81j-memory', plant: 'P81J', ncm: '85176259', suframa: '1201', itemId: 'memory', lastUpdated: '2026-11-12' },
  { id: 'p81j-battery', plant: 'P81J', ncm: '85076000', suframa: '1202', itemId: 'battery', lastUpdated: '2026-11-11' },
  { id: 'p81j-pba-assy', plant: 'P81J', ncm: '85176239', suframa: '1203', itemId: 'pba-assy', lastUpdated: '2026-11-08' },
  { id: 'p81j-main', plant: 'P81J', ncm: '85176239', suframa: '1204', itemId: 'main', lastUpdated: '2026-11-07' },
  { id: 'p81m-adapter', plant: 'P81M', ncm: '85044090', suframa: '1301', itemId: 'adapter', lastUpdated: '2026-11-10' },
  { id: 'p81m-insp-process', plant: 'P81M', ncm: '85176239', suframa: '1302', itemId: 'insp-process', lastUpdated: '2026-11-07' },
  { id: 'p81m-rfid', plant: 'P81M', ncm: '85235910', suframa: '1303', itemId: 'rfid', lastUpdated: '2026-11-05' },
]

export type PpbScoreType = 'Points' | 'Quota %'

export type PpbScore = {
  id: string
  itemId: string
  score: number
  type: PpbScoreType
  sedaUsage: YesNo
  autoCount: YesNo
  validFrom: string
  validTo: string
}

export const PPB_SCORE_SEED: readonly PpbScore[] = [
  { id: 'memory-2026', itemId: 'memory', score: 30, type: 'Points', sedaUsage: 'Y', autoCount: 'Y', validFrom: '2026-01-01', validTo: '2026-12-31' },
  { id: 'battery-2026', itemId: 'battery', score: 20, type: 'Points', sedaUsage: 'Y', autoCount: 'N', validFrom: '2026-01-01', validTo: '2026-12-31' },
  { id: 'adapter-2026', itemId: 'adapter', score: 15, type: 'Points', sedaUsage: 'Y', autoCount: 'N', validFrom: '2026-01-01', validTo: '2026-12-31' },
  { id: 'pba-assy-2026', itemId: 'pba-assy', score: 25, type: 'Points', sedaUsage: 'Y', autoCount: 'Y', validFrom: '2026-01-01', validTo: '2026-12-31' },
  { id: 'main-2026', itemId: 'main', score: 25, type: 'Points', sedaUsage: 'Y', autoCount: 'N', validFrom: '2026-01-01', validTo: '2026-12-31' },
  { id: 'insp-process-2026', itemId: 'insp-process', score: 10, type: 'Points', sedaUsage: 'Y', autoCount: 'Y', validFrom: '2026-01-01', validTo: '2026-12-31' },
  { id: 'rfid-2026', itemId: 'rfid', score: 5, type: 'Points', sedaUsage: 'Y', autoCount: 'Y', validFrom: '2026-01-01', validTo: '2026-12-31' },
]

export const PPB_ITEM_SCHEMA: ColumnSchema<PpbItem>[] = [
  { id: 'itemName', header: 'Item Name', kind: 'text' },
  { id: 'itemSlug', header: 'Item Slug', kind: 'text' },
  {
    id: 'category',
    header: 'Category',
    kind: 'select',
    options: PPB_CATEGORIES.map((category) => ({ value: category, label: category })),
  },
  {
    id: 'mapping',
    header: 'Mapping',
    kind: 'boolean',
    accessor: (row) => row.mapping === 'Y',
    searchText: (row) => row.mapping,
  },
  {
    id: 'active',
    header: 'Active',
    kind: 'boolean',
    accessor: (row) => row.active === 'Y',
    searchText: (row) => row.active,
  },
]

export function slugifyPpbItem(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
