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
  weeks: Record<SopWeekId, number>
}

const MODELS = [
  'TV Core 2027',
  'Monitor Core 2027',
  'Wearables Core 2026',
  'Indoor Unit Max 2027',
  'Mobile Ultra 2027',
  'Tablet Pro 2026',
] as const

export const PLANT_OPTIONS: readonly SelectOption[] = SOP_PLANTS.map((plant) => ({ value: plant, label: plant }))

function buildRows(): SopDemand[] {
  return MODELS.flatMap((model, modelIndex) =>
    SOP_PLANTS.map((plant, plantIndex) => {
      const baseVolume = 280 + modelIndex * 145 + plantIndex * 80
      const weeks = Object.fromEntries(
        SOP_WEEKS.map((week, weekIndex) => [
          week.id,
          Math.round((baseVolume + weekIndex * 34 + ((modelIndex + plantIndex + weekIndex) % 4) * 42) / 10) * 10,
        ]),
      ) as Record<SopWeekId, number>

      return {
        id: `sop-${modelIndex + 1}-${plant}`,
        model,
        plant,
        weeks,
      }
    }),
  )
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
