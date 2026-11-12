import type { ColumnSchema } from '@/lib/data-table/types'

export const SALES_MONTHS = [
  { id: '202701', label: 'Jan 2027' },
  { id: '202702', label: 'Feb 2027' },
  { id: '202703', label: 'Mar 2027' },
  { id: '202704', label: 'Apr 2027' },
  { id: '202705', label: 'May 2027' },
  { id: '202706', label: 'Jun 2027' },
  { id: '202707', label: 'Jul 2027' },
  { id: '202708', label: 'Aug 2027' },
  { id: '202709', label: 'Sep 2027' },
  { id: '202710', label: 'Oct 2027' },
  { id: '202711', label: 'Nov 2027' },
  { id: '202712', label: 'Dec 2027' },
] as const

export type SalesMonthId = (typeof SALES_MONTHS)[number]['id']

export type SalesDemand = {
  id: string
  model: string
  months: Record<SalesMonthId, number | null>
  total: number
}

const SKU_WINDOWS = [
  ['SM-S098', 0, 5],
  ['SM-A017', 1, 3],
  ['SM-A024', 2, 8],
  ['SM-A031', 0, 1],
  ['SM-A046', 6, 11],
  ['SM-S112', 1, 5],
  ['SM-S128', 4, 7],
  ['SM-A059', 0, 11],
  ['SM-A063', 2, 6],
  ['SM-S144', 8, 11],
  ['SM-A071', 0, 4],
  ['SM-A086', 5, 10],
  ['SM-S153', 3, 6],
  ['SM-A092', 9, 11],
  ['SM-S167', 7, 8],
  ['SM-A104', 1, 10],
] as const satisfies readonly [string, number, number][]

function buildRows(): SalesDemand[] {
  return SKU_WINDOWS.map(([model, startMonth, endMonth], skuIndex) => {
    const months = Object.fromEntries(
      SALES_MONTHS.map((month, monthIndex) => {
        const active = monthIndex >= startMonth && monthIndex <= endMonth
        const hasVolume = active && (monthIndex + skuIndex) % 6 !== 0
        const volume = 180 + skuIndex * 34 + monthIndex * 45 + ((skuIndex + monthIndex) % 3) * 30
        return [month.id, hasVolume ? Math.round(volume / 10) * 10 : null]
      }),
    ) as Record<SalesMonthId, number | null>

    const total = Object.values(months).reduce<number>((sum, value) => sum + (value ?? 0), 0)

    return {
      id: `sales-${model}`,
      model,
      months,
      total,
    }
  })
}

export const SALES_DEMAND_ROWS: readonly SalesDemand[] = buildRows()

export const SALES_SCHEMA: ColumnSchema<SalesDemand>[] = [
  { id: 'model', header: 'Model', kind: 'text' },
  ...SALES_MONTHS.map((month) => ({
    id: month.id,
    header: month.label,
    kind: 'number' as const,
    accessor: (row: SalesDemand) => row.months[month.id],
  })),
  { id: 'total', header: 'Total', kind: 'number', accessor: (row: SalesDemand) => row.total },
]
