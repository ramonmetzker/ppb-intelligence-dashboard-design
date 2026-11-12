import type { ColumnSchema, SelectOption } from '@/lib/data-table/types'

export const SOP_PLANTS = ['P81J', 'P81M', 'P81N', 'P81L', 'P81P'] as const

export const SOP_WEEKS = [
  { id: '202645', label: 'W45', month: 'November 2026' },
  { id: '202646', label: 'W46', month: 'November 2026' },
  { id: '202647', label: 'W47', month: 'November 2026' },
  { id: '202648', label: 'W48', month: 'November 2026' },
  { id: '202649', label: 'W49', month: 'December 2026' },
  { id: '202650', label: 'W50', month: 'December 2026' },
  { id: '202651', label: 'W51', month: 'December 2026' },
  { id: '202652', label: 'W52', month: 'December 2026' },
  { id: '202701', label: 'W01', month: 'January 2027' },
  { id: '202702', label: 'W02', month: 'January 2027' },
  { id: '202703', label: 'W03', month: 'January 2027' },
  { id: '202704', label: 'W04', month: 'January 2027' },
  { id: '202705', label: 'W05', month: 'February 2027' },
  { id: '202706', label: 'W06', month: 'February 2027' },
  { id: '202707', label: 'W07', month: 'February 2027' },
  { id: '202708', label: 'W08', month: 'February 2027' },
  { id: '202709', label: 'W09', month: 'March 2027' },
  { id: '202710', label: 'W10', month: 'March 2027' },
  { id: '202711', label: 'W11', month: 'March 2027' },
  { id: '202712', label: 'W12', month: 'March 2027' },
] as const

export type SopWeekId = (typeof SOP_WEEKS)[number]['id']

export type SopDemand = {
  id: string
  model: string
  plant: (typeof SOP_PLANTS)[number]
  weeks: Record<SopWeekId, number | null>
}

const SKU_WINDOWS = [
  ['SM-A015BRKZO', 'P81J', 0, 7],
  ['SM-A025BRKZO', 'P81M', 1, 11],
  ['SM-A035BRKZO', 'P81N', 4, 14],
  ['SM-A045BRKZO', 'P81L', 7, 19],
  ['SM-A055BRKZO', 'P81P', 9, 13],
  ['SM-A065BRKZO', 'P81J', 2, 5],
  ['SM-A075BRKZO', 'P81M', 5, 17],
  ['SM-A085BRKZO', 'P81N', 0, 3],
  ['SM-A095BRKZO', 'P81L', 8, 12],
  ['SM-A105BRKZO', 'P81P', 3, 18],
  ['SM-B110BRKZO', 'P81J', 6, 10],
  ['SM-B120BRKZO', 'P81M', 10, 19],
  ['SM-B130BRKZO', 'P81N', 0, 15],
  ['SM-B140BRKZO', 'P81L', 4, 8],
  ['SM-B150BRKZO', 'P81P', 11, 16],
  ['SM-B160BRKZO', 'P81J', 1, 4],
  ['SM-C210BRKZO', 'P81M', 2, 9],
  ['SM-C220BRKZO', 'P81N', 12, 19],
  ['SM-C230BRKZO', 'P81L', 5, 7],
  ['SM-C240BRKZO', 'P81P', 0, 19],
  ['SM-C250BRKZO', 'P81J', 14, 17],
  ['SM-C260BRKZO', 'P81M', 3, 6],
  ['SM-C270BRKZO', 'P81N', 8, 16],
  ['SM-C280BRKZO', 'P81L', 10, 19],
] as const satisfies readonly [string, (typeof SOP_PLANTS)[number], number, number][]

export const PLANT_OPTIONS: readonly SelectOption[] = SOP_PLANTS.map((plant) => ({ value: plant, label: plant }))

function buildRows(): SopDemand[] {
  return SKU_WINDOWS.map(([model, plant, startWeek, endWeek], skuIndex) => {
    const weeks = Object.fromEntries(
      SOP_WEEKS.map((week, weekIndex) => {
        const active = weekIndex >= startWeek && weekIndex <= endWeek
        const hasVolume = active && (weekIndex + skuIndex) % 7 !== 0
        const volume = 240 + skuIndex * 38 + weekIndex * 24 + ((skuIndex + weekIndex) % 4) * 30
        return [week.id, hasVolume ? Math.round(volume / 10) * 10 : null]
      }),
    ) as Record<SopWeekId, number | null>

    return {
      id: `sop-${model}`,
      model,
      plant,
      weeks,
    }
  })
}

export const SOP_DEMAND_ROWS: readonly SopDemand[] = buildRows()

export const SOP_SCHEMA: ColumnSchema<SopDemand>[] = [
  { id: 'model', header: 'Model', kind: 'text' },
  { id: 'plant', header: 'Plant', kind: 'select', options: PLANT_OPTIONS },
  ...SOP_WEEKS.map((week) => ({
    id: week.id,
    header: week.label,
    kind: 'number' as const,
    accessor: (row: SopDemand) => row.weeks[week.id],
  })),
]
