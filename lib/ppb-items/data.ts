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
