import type { ColumnSchema, SelectOption } from '@/lib/data-table/types'
import { SOP_PLANTS, SOP_WEEKS } from '@/lib/sop-demand/data'

export const SALES_WEEKS = SOP_WEEKS
export const SALES_PLANTS = SOP_PLANTS
export type SalesWeekId = (typeof SALES_WEEKS)[number]['id']

export type SalesDemand = {
  id: string
  model: string
  plant: (typeof SALES_PLANTS)[number]
  weeks: Record<SalesWeekId, number | null>
}

const SKU_WINDOWS = [
  ['SM-S098', 'P81J', 0, 7],
  ['SM-A017', 'P81M', 2, 12],
  ['SM-A024', 'P81N', 5, 15],
  ['SM-A031', 'P81L', 0, 3],
  ['SM-A046', 'P81P', 8, 19],
  ['SM-S112', 'P81J', 4, 9],
  ['SM-S128', 'P81M', 10, 14],
  ['SM-A059', 'P81N', 1, 18],
  ['SM-A063', 'P81L', 6, 11],
  ['SM-S144', 'P81P', 12, 19],
  ['SM-A071', 'P81J', 0, 5],
  ['SM-A086', 'P81M', 7, 17],
  ['SM-S153', 'P81N', 3, 7],
  ['SM-A092', 'P81L', 14, 19],
  ['SM-S167', 'P81P', 9, 13],
  ['SM-A104', 'P81J', 2, 16],
] as const satisfies readonly [string, (typeof SALES_PLANTS)[number], number, number][]

export const SALES_PLANT_OPTIONS: readonly SelectOption[] = SALES_PLANTS.map((plant) => ({
  value: plant,
  label: plant,
}))

function buildRows(): SalesDemand[] {
  return SKU_WINDOWS.map(([model, plant, startWeek, endWeek], skuIndex) => {
    const weeks = Object.fromEntries(
      SALES_WEEKS.map((week, weekIndex) => {
        const active = weekIndex >= startWeek && weekIndex <= endWeek
        const hasVolume = active && (weekIndex + skuIndex) % 6 !== 0
        const volume = 120 + skuIndex * 28 + weekIndex * 18 + ((skuIndex + weekIndex) % 3) * 20
        return [week.id, hasVolume ? Math.round(volume / 10) * 10 : null]
      }),
    ) as Record<SalesWeekId, number | null>

    return {
      id: `sales-${model}`,
      model,
      plant,
      weeks,
    }
  })
}

export const SALES_DEMAND_ROWS: readonly SalesDemand[] = buildRows()

export const SALES_SCHEMA: ColumnSchema<SalesDemand>[] = [
  { id: 'model', header: 'Model', kind: 'text' },
  { id: 'plant', header: 'Plant', kind: 'select', options: SALES_PLANT_OPTIONS },
  ...SALES_WEEKS.map((week) => ({
    id: week.id,
    header: week.label,
    kind: 'number' as const,
    accessor: (row: SalesDemand) => row.weeks[week.id],
  })),
]
