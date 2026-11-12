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
  { id: 'display-module', itemName: 'Display Module', itemSlug: 'display-module', category: 'In-house Production', mapping: 'Y', active: 'Y' },
  { id: 'main-board', itemName: 'Main Board', itemSlug: 'main-board', category: 'Local Purchasing', mapping: 'Y', active: 'Y' },
  { id: 'battery-pack', itemName: 'Battery Pack', itemSlug: 'battery-pack', category: 'Local Purchasing', mapping: 'Y', active: 'Y' },
  { id: 'camera-module', itemName: 'Camera Module', itemSlug: 'camera-module', category: 'Localization N/A', mapping: 'N', active: 'Y' },
  { id: 'housing', itemName: 'Housing', itemSlug: 'housing', category: 'In-house Production', mapping: 'Y', active: 'Y' },
  { id: 'flex-cable', itemName: 'Flex Cable', itemSlug: 'flex-cable', category: 'Local Purchasing', mapping: 'N', active: 'Y' },
  { id: 'speaker-module', itemName: 'Speaker Module', itemSlug: 'speaker-module', category: 'Local Purchasing', mapping: 'Y', active: 'N' },
  { id: 'charger-adapter', itemName: 'Charger Adapter', itemSlug: 'charger-adapter', category: 'Localization N/A', mapping: 'N', active: 'Y' },
  { id: 'antenna-set', itemName: 'Antenna Set', itemSlug: 'antenna-set', category: 'In-house Production', mapping: 'Y', active: 'Y' },
  { id: 'connector-set', itemName: 'Connector Set', itemSlug: 'connector-set', category: 'Local Purchasing', mapping: 'Y', active: 'Y' },
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
  { id: 'p81j-display-module', plant: 'P81J', ncm: '85176259', suframa: '1201', itemId: 'display-module', lastUpdated: '2026-11-12' },
  { id: 'p81j-main-board', plant: 'P81J', ncm: '85176239', suframa: '1202', itemId: 'main-board', lastUpdated: '2026-11-11' },
  { id: 'p81j-battery-pack', plant: 'P81J', ncm: '85076000', suframa: '1203', itemId: 'battery-pack', lastUpdated: '2026-11-08' },
  { id: 'p81m-display-module', plant: 'P81M', ncm: '85176259', suframa: '1301', itemId: 'display-module', lastUpdated: '2026-11-10' },
  { id: 'p81m-camera-module', plant: 'P81M', ncm: '85258929', suframa: '1302', itemId: 'camera-module', lastUpdated: '2026-11-07' },
  { id: 'p81m-housing', plant: 'P81M', ncm: '39269090', suframa: '1303', itemId: 'housing', lastUpdated: '2026-11-05' },
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
