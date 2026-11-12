'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, CircleX, Pencil, Plus } from 'lucide-react'
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
import { itemNameForUiParameter, type UiParameter } from '@/lib/ui-parameters/data'
import { useUiParameters } from './ui-parameters-provider'
import { UiParameterFormDialog } from './ui-parameter-form-dialog'

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
    { id: 'year', header: 'Year', kind: 'number', width: 140, cell: ({ row }) => <span className="tabular-nums">{row.year}</span> },
  ]
}

const DEFAULT_QUERY: DataTableQuery = { ...DEFAULT_DATA_TABLE_QUERY, sort: [{ id: 'order', direction: 'asc' }] }

export function UiParametersView() {
  const { parameters, addParameter, updateParameter } = useUiParameters()
  const [query, setQuery] = useState<DataTableQuery>(DEFAULT_QUERY)
  const [editing, setEditing] = useState<UiParameter | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const columns = useMemo(() => createColumns(PPB_ITEM_SEED), [])

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
        data={parameters}
        getRowId={(row) => row.id}
        query={query}
        onQueryChange={setQuery}
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
