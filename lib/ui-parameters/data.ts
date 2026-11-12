import type { ColumnSchema } from '@/lib/data-table/types'
import { PPB_ITEM_SEED, type YesNo } from '@/lib/ppb-items/data'

export const UI_PARAMETER_YEARS = ['2027', '2026', '2025'] as const
export type UiParameterYear = (typeof UI_PARAMETER_YEARS)[number]

export type UiParameter = {
  id: string
  order: number
  itemId: string
  display: YesNo
  collapse: YesNo
  year: string
}

export type UiParameterFormValues = Omit<UiParameter, 'id'>

export const UI_PARAMETER_SEED: readonly UiParameter[] = [
  { id: 'display-module-2026', order: 1, itemId: 'display-module', display: 'Y', collapse: 'N', year: '2026' },
  { id: 'main-board-2026', order: 2, itemId: 'main-board', display: 'Y', collapse: 'N', year: '2026' },
  { id: 'battery-pack-2026', order: 3, itemId: 'battery-pack', display: 'Y', collapse: 'N', year: '2026' },
  { id: 'camera-module-2026', order: 4, itemId: 'camera-module', display: 'Y', collapse: 'Y', year: '2026' },
  { id: 'housing-2026', order: 5, itemId: 'housing', display: 'Y', collapse: 'N', year: '2026' },
  { id: 'flex-cable-2026', order: 6, itemId: 'flex-cable', display: 'Y', collapse: 'N', year: '2026' },
  { id: 'speaker-module-2026', order: 7, itemId: 'speaker-module', display: 'N', collapse: 'N', year: '2026' },
  { id: 'charger-adapter-2026', order: 8, itemId: 'charger-adapter', display: 'Y', collapse: 'Y', year: '2026' },
  { id: 'antenna-set-2026', order: 9, itemId: 'antenna-set', display: 'Y', collapse: 'N', year: '2026' },
  { id: 'connector-set-2026', order: 10, itemId: 'connector-set', display: 'Y', collapse: 'N', year: '2026' },
]

export const UI_PARAMETER_SCHEMA: ColumnSchema<UiParameter>[] = [
  { id: 'order', header: 'Order', kind: 'number' },
  {
    id: 'item',
    header: 'Item',
    kind: 'text',
    accessor: (row) => PPB_ITEM_SEED.find((item) => item.id === row.itemId)?.itemName ?? row.itemId,
    searchText: (row) => PPB_ITEM_SEED.find((item) => item.id === row.itemId)?.itemName ?? row.itemId,
  },
  { id: 'display', header: 'Display', kind: 'boolean', accessor: (row) => row.display === 'Y', searchText: (row) => row.display },
  { id: 'collapse', header: 'Collapse', kind: 'boolean', accessor: (row) => row.collapse === 'Y', searchText: (row) => row.collapse },
  { id: 'year', header: 'Year', kind: 'number' },
]

export function itemNameForUiParameter(itemId: string) {
  return PPB_ITEM_SEED.find((item) => item.id === itemId)?.itemName ?? itemId
}
