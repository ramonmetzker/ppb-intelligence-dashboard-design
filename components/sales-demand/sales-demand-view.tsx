'use client'

import { useState } from 'react'
import { DataTable } from '@/components/data-table/data-table'
import { PageHeader } from '@/components/app/page-header'
import { SalesDemandImportDialog } from '@/components/sales-demand/sales-demand-import-dialog'
import type { DataTableColumnDefinition } from '@/lib/data-table/types'
import { SALES_DEMAND_ROWS, SALES_MONTHS, SALES_SCHEMA, type SalesDemand } from '@/lib/sales-demand/data'

const number = new Intl.NumberFormat('en-US')
const schemaById = new Map(SALES_SCHEMA.map((schema) => [schema.id, schema]))
const base = (id: string) => schemaById.get(id)!

const monthColumn = (month: (typeof SALES_MONTHS)[number]) => ({
  ...base(month.id),
  width: 136,
  minWidth: 120,
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
  ...SALES_MONTHS.map(monthColumn),
  {
    ...base('total'),
    header: 'Total',
    width: 136,
    minWidth: 120,
    pin: 'right',
    align: 'right',
    cell: ({ value }: { value: unknown }) => number.format(Number(value)),
  },
]

export function SalesDemandView() {
  const [rows, setRows] = useState<readonly SalesDemand[]>(SALES_DEMAND_ROWS)

  return (
    <>
      <PageHeader
        title="Sales Demand"
        description="Monthly sales provision by model for the full 2027 calendar year."
      >
        <SalesDemandImportDialog onImport={setRows} />
      </PageHeader>

      <DataTable<SalesDemand>
        caption="Monthly sales demand by model and total volume"
        persistenceKey="sales-demand-2027"
        bordered
        columns={COLUMNS}
        data={rows}
        getRowId={(row) => row.id}
      />
    </>
  )
}
