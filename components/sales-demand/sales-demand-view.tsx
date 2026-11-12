'use client'

import { useMemo, useState } from 'react'
import { DataTable } from '@/components/data-table/data-table'
import { PageHeader } from '@/components/app/page-header'
import { SalesDemandImportDialog } from '@/components/sales-demand/sales-demand-import-dialog'
import type { DataTableColumnDefinition } from '@/lib/data-table/types'
import { SALES_DEMAND_ROWS, SALES_SCHEMA, SALES_WEEKS, type SalesDemand } from '@/lib/sales-demand/data'

const number = new Intl.NumberFormat('en-US')
const schemaById = new Map(SALES_SCHEMA.map((schema) => [schema.id, schema]))
const base = (id: string) => schemaById.get(id)!

const monthGroups = Array.from(new Set(SALES_WEEKS.map((week) => week.month))).map((month) => ({
  id: month.toLowerCase().replaceAll(' ', '-'),
  header: month,
  weeks: SALES_WEEKS.filter((week) => week.month === month),
}))

const weekColumn = (week: (typeof SALES_WEEKS)[number]) => ({
  ...base(week.id),
  width: 112,
  minWidth: 104,
  align: 'right' as const,
  cell: ({ value }: { value: unknown }) => (value == null || value === 0 ? '-' : number.format(Number(value))),
})

const COLUMNS: DataTableColumnDefinition<SalesDemand>[] = [
  {
    ...base('model'),
    header: 'Model',
    width: 180,
    minWidth: 160,
    pin: 'left',
    grow: true,
  },
  {
    ...base('plant'),
    header: 'Plant',
    width: 126,
    minWidth: 112,
  },
  ...monthGroups.map((month) => ({
    id: month.id,
    header: month.header,
    children: month.weeks.map(weekColumn),
  })),
]

export function SalesDemandView() {
  const [rows, setRows] = useState<readonly SalesDemand[]>(SALES_DEMAND_ROWS)

  return (
    <>
      <PageHeader
        title="Sales Demand"
        description="Sales provision by SKU and plant from W45 2026 through W12 2027."
      >
        <SalesDemandImportDialog onImport={setRows} />
      </PageHeader>

      <DataTable<SalesDemand>
        caption="Sales demand by model, plant, and week"
        persistenceKey="sales-demand"
        bordered
        columns={COLUMNS}
        data={rows}
        getRowId={(row) => row.id}
      />
    </>
  )
}
