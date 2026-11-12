'use client'

import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumnDefinition } from '@/lib/data-table/types'
import { SOP_DEMAND_ROWS, SOP_SCHEMA, SOP_WEEKS, type SopDemand } from '@/lib/sop-demand/data'

const number = new Intl.NumberFormat('en-US')
const schemaById = new Map(SOP_SCHEMA.map((schema) => [schema.id, schema]))
const base = (id: string) => schemaById.get(id)!

const monthGroups = Array.from(new Set(SOP_WEEKS.map((week) => week.month))).map((month) => ({
  id: month.toLowerCase().replaceAll(' ', '-'),
  header: month,
  weeks: SOP_WEEKS.filter((week) => week.month === month),
}))

const weekColumn = (week: (typeof SOP_WEEKS)[number]) => ({
  ...base(week.id),
  width: 112,
  minWidth: 104,
  align: 'right' as const,
  cell: ({ value }: { value: unknown }) => number.format(Number(value)),
})

const COLUMNS: DataTableColumnDefinition<SopDemand>[] = [
  {
    ...base('model'),
    header: 'Model',
    width: 220,
    minWidth: 180,
    pin: 'left',
    grow: true,
  },
  {
    ...base('plant'),
    header: 'Plant',
    width: 110,
    minWidth: 96,
  },
  ...monthGroups.map((month) => ({
    id: month.id,
    header: month.header,
    children: month.weeks.map(weekColumn),
  })),
]

export function SopDemandView() {
  return (
    <>
      <div className="mb-4">
        <h1 className="text-balance font-display text-2xl font-semibold tracking-tight text-foreground">SOP Demand</h1>
        <p className="mt-1 max-w-3xl text-pretty text-sm leading-6 text-muted-foreground">
          Weekly demand volume by model and plant from W45 2026 through W12 2027.
        </p>
      </div>

      <DataTable<SopDemand>
        caption="SOP demand by model, plant, and week"
        persistenceKey="sop-demand"
        bordered
        columns={COLUMNS}
        mergeEqualRows={['model']}
        data={SOP_DEMAND_ROWS}
        getRowId={(row) => row.id}
      />
    </>
  )
}
