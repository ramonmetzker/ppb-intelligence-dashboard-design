'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, CircleX, Pencil, Plus } from 'lucide-react'
import { PageHeader } from '@/components/app/page-header'
import { DataTable } from '@/components/data-table/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DEFAULT_QUERY as DEFAULT_DATA_TABLE_QUERY,
  type DataTableColumn,
  type DataTableQuery,
  type RowAction,
} from '@/lib/data-table/types'
import { PPB_ITEM_SEED, type PpbItem } from '@/lib/ppb-items/data'
import { UI_PARAMETER_YEARS, itemNameForUiParameter, type UiParameter, type UiParameterYear } from '@/lib/ui-parameters/data'
import { useUiParameters } from './ui-parameters-provider'
import { UiParameterFormDialog } from './ui-parameter-form-dialog'
import { dataTableControlClass } from '@/components/data-table/toolbar-controls'

function YesNoBadge({ value }: { value: 'Y' | 'N' }) {
  const enabled = value === 'Y'
  return (
    <Badge variant={enabled ? 'secondary' : 'outline'} className="gap-1.5">
      {enabled ? <CheckCircle2 aria-hidden="true" /> : <CircleX aria-hidden="true" />}
      {enabled ? 'Yes' : 'No'}
    </Badge>
  )
}

function createColumns(items: readonly PpbItem[]): DataTableColumn<UiParameter>[] {
  const itemNames = new Map(items.map((item) => [item.id, item.itemName]))
  return [
    { id: 'order', header: 'Order', kind: 'number', width: 120, align: 'right', cell: ({ row }) => <span className="tabular-nums">{row.order}</span> },
    {
      id: 'item',
      header: 'Item',
      kind: 'text',
      width: 280,
      grow: true,
      pin: 'left',
      accessor: (row) => itemNames.get(row.itemId) ?? row.itemId,
      searchText: (row) => itemNames.get(row.itemId) ?? row.itemId,
      cell: ({ row }) => <span>{itemNames.get(row.itemId) ?? row.itemId}</span>,
    },
    { id: 'display', header: 'Display', kind: 'boolean', width: 150, align: 'center', accessor: (row) => row.display === 'Y', searchText: (row) => row.display, cell: ({ row }) => <YesNoBadge value={row.display} /> },
    { id: 'collapse', header: 'Collapse', kind: 'boolean', width: 160, align: 'center', accessor: (row) => row.collapse === 'Y', searchText: (row) => row.collapse, cell: ({ row }) => <YesNoBadge value={row.collapse} /> },
    { id: 'year', header: 'Year', kind: 'number', filterable: false, width: 140, cell: ({ row }) => <span className="tabular-nums">{row.year}</span> },
  ]
}

const DEFAULT_QUERY: DataTableQuery = { ...DEFAULT_DATA_TABLE_QUERY, sort: [{ id: 'order', direction: 'asc' }] }

function YearSelector({ year, onChange }: { year: UiParameterYear; onChange: (year: UiParameterYear) => void }) {
  const yearOptions = [...UI_PARAMETER_YEARS].map(Number).sort((a, b) => a - b)
  const numericYear = Number(year)
  const yearIndex = yearOptions.indexOf(numericYear)
  const canGoPrevious = yearIndex > 0
  const canGoNext = yearIndex >= 0 && yearIndex < yearOptions.length - 1

  return (
    <div className={`${dataTableControlClass} gap-0 overflow-hidden px-0`} aria-label="Year filter">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-full w-9 rounded-none"
        disabled={!canGoPrevious}
        aria-label="Previous year"
        onClick={() => canGoPrevious && onChange(String(yearOptions[yearIndex - 1]) as UiParameterYear)}
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
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
          if (UI_PARAMETER_YEARS.includes(next as UiParameterYear)) onChange(next as UiParameterYear)
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
        onClick={() => canGoNext && onChange(String(yearOptions[yearIndex + 1]) as UiParameterYear)}
      >
        <ChevronRight aria-hidden="true" className="size-4" />
      </Button>
    </div>
  )
}

export function UiParametersView() {
  const { parameters, addParameter, updateParameter } = useUiParameters()
  const [query, setQuery] = useState<DataTableQuery>(DEFAULT_QUERY)
  const [year, setYear] = useState<UiParameterYear>(UI_PARAMETER_YEARS[1])
  const [editing, setEditing] = useState<UiParameter | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const columns = useMemo(() => createColumns(PPB_ITEM_SEED), [])
  const visibleParameters = useMemo(() => parameters.filter((parameter) => parameter.year === year), [parameters, year])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (parameter: UiParameter) => {
    setEditing(parameter)
    setFormOpen(true)
  }

  const rowActions: RowAction<UiParameter>[] = [
    { id: 'edit', label: 'Edit', icon: <Pencil aria-hidden="true" />, inline: true, onSelect: openEdit },
  ]

  return (
    <>
      <PageHeader
        title="UI Parameters"
        description="Master data that controls item order, visibility, and collapsed rows across the app."
      >
        <Button size="lg" onClick={openCreate}>
          <Plus aria-hidden="true" data-icon="inline-start" />
          New parameter
        </Button>
      </PageHeader>

      <DataTable<UiParameter>
        caption="UI Parameters master data"
        persistenceKey="ui-parameters"
        columns={columns}
        data={visibleParameters}
        getRowId={(row) => row.id}
        query={query}
        onQueryChange={setQuery}
        toolbarStart={<YearSelector year={year} onChange={setYear} />}
        rowActions={rowActions}
        onRowClick={openEdit}
        columnPinning={false}
        densityControl={false}
        pagination={false}
      />

      <UiParameterFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        parameter={editing}
        parameters={parameters}
        items={PPB_ITEM_SEED}
        onSubmit={(values) => editing ? updateParameter(editing.id, values) : addParameter(values)}
      />
    </>
  )
}
