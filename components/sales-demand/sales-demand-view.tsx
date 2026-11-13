'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { PageHeader } from '@/components/app/page-header'
import { SalesDemandImportDialog } from '@/components/sales-demand/sales-demand-import-dialog'
import { Button } from '@/components/ui/button'
import type { DataTableColumnDefinition } from '@/lib/data-table/types'
import {
  SALES_DEMAND_ROWS,
  SALES_DEMAND_YEARS,
  SALES_MONTHS,
  SALES_SCHEMA,
  type SalesDemand,
  type SalesDemandYear,
} from '@/lib/sales-demand/data'

const number = new Intl.NumberFormat('en-US')
const schemaById = new Map(SALES_SCHEMA.map((schema) => [schema.id, schema]))
const base = (id: string) => schemaById.get(id)!

const monthColumn = (month: (typeof SALES_MONTHS)[number]) => ({
  ...base(month.id),
  width: 120,
  minWidth: 104,
  align: 'right' as const,
  cell: ({ value }: { value: unknown }) => (value == null || value === 0 ? '-' : number.format(Number(value))),
})

function createColumns(year: SalesDemandYear): DataTableColumnDefinition<SalesDemand>[] {
  return [
    {
      ...base('model'),
      header: 'Model',
      width: 180,
      minWidth: 160,
      pin: 'left',
      grow: true,
    },
    {
      id: `year-${year}`,
      header: year,
      children: SALES_MONTHS.map(monthColumn),
    },
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
}

function YearSelector({ year, onChange }: { year: SalesDemandYear; onChange: (year: SalesDemandYear) => void }) {
  const yearOptions = [...SALES_DEMAND_YEARS].map(Number).sort((a, b) => a - b)
  const numericYear = Number(year)
  const yearIndex = yearOptions.indexOf(numericYear)
  const canGoPrevious = yearIndex > 0
  const canGoNext = yearIndex >= 0 && yearIndex < yearOptions.length - 1

  return (
    <div className="flex h-9 shrink-0 items-stretch overflow-hidden rounded-lg border border-input bg-card" aria-label="Year filter">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-full w-9 rounded-none"
        disabled={!canGoPrevious}
        aria-label="Previous year"
        onClick={() => canGoPrevious && onChange(String(yearOptions[yearIndex - 1]) as SalesDemandYear)}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <input
        type="number"
        inputMode="numeric"
        min={yearOptions[0]}
        max={yearOptions[yearOptions.length - 1]}
        step="1"
        value={year}
        aria-label="Year filter"
        onChange={(event) => {
          const next = event.target.value
          if (SALES_DEMAND_YEARS.includes(next as SalesDemandYear)) onChange(next as SalesDemandYear)
        }}
        className="tnum h-full w-16 appearance-none border-x border-input bg-transparent px-1 text-center text-[13px] font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-full w-9 rounded-none"
        disabled={!canGoNext}
        aria-label="Next year"
        onClick={() => canGoNext && onChange(String(yearOptions[yearIndex + 1]) as SalesDemandYear)}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  )
}

export function SalesDemandView() {
  const [year, setYear] = useState<SalesDemandYear>(SALES_DEMAND_YEARS[0])
  const [rows, setRows] = useState<readonly SalesDemand[]>(SALES_DEMAND_ROWS)
  const columns = useMemo(() => createColumns(year), [year])
  const visibleRows = useMemo(() => rows.filter((row) => row.year === year), [rows, year])

  return (
    <>
      <PageHeader
        title="Sales Demand"
        description={`Monthly sales provision by model for the full ${year} calendar year.`}
      >
        <SalesDemandImportDialog
          year={year}
          onImport={(importedRows) => setRows((current) => [...current.filter((row) => row.year !== year), ...importedRows])}
        />
      </PageHeader>

      <DataTable<SalesDemand>
        caption="Monthly sales demand by model and total volume"
        persistenceKey="sales-demand"
        bordered
        columns={columns}
        data={visibleRows}
        getRowId={(row) => row.id}
        toolbarStart={<YearSelector year={year} onChange={setYear} />}
      />
    </>
  )
}
