'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, CircleX, Pencil, Plus } from 'lucide-react'
import { PageHeader } from '@/components/app/page-header'
import { DataTable } from '@/components/data-table/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DEFAULT_QUERY as DEFAULT_DATA_TABLE_QUERY,
  type DataTableColumn,
  type DataTableQuery,
  type RowAction,
} from '@/lib/data-table/types'
import { PPB_ITEM_SCHEMA, PPB_ITEM_SEED, PPB_NCM_MAPPING_SEED, type PpbItem, type PpbNcmMapping } from '@/lib/ppb-items/data'
import { PpbItemFormDialog, type PpbItemFormValues } from './ppb-item-form-dialog'

const schemaById = new Map(PPB_ITEM_SCHEMA.map((schema) => [schema.id, schema]))
const base = (id: string) => schemaById.get(id)!

function YesNoBadge({ value }: { value: 'Y' | 'N' }) {
  const enabled = value === 'Y'
  return (
    <Badge variant={enabled ? 'secondary' : 'outline'} className="gap-1.5">
      {enabled ? <CheckCircle2 aria-hidden="true" /> : <CircleX aria-hidden="true" />}
      {enabled ? 'Yes' : 'No'}
    </Badge>
  )
}

const COLUMNS: DataTableColumn<PpbItem>[] = [
  { ...base('itemName'), width: 240, pin: 'left', hideable: false, grow: true },
  { ...base('itemSlug'), width: 220, cell: ({ row }) => <span className="font-mono text-xs">{row.itemSlug}</span> },
  { ...base('category'), width: 240 },
  {
    ...base('mapping'),
    width: 150,
    align: 'center',
    cell: ({ row }) => <YesNoBadge value={row.mapping} />,
  },
  {
    ...base('active'),
    width: 140,
    align: 'center',
    cell: ({ row }) => <YesNoBadge value={row.active} />,
  },
]

function createMappingColumns(items: readonly PpbItem[]): DataTableColumn<PpbNcmMapping>[] {
  const itemNames = new Map(items.map((item) => [item.id, item.itemName]))

  return [
    {
      id: 'plant',
      header: 'Plant',
      kind: 'text',
      width: 150,
      cell: ({ row }) => <Badge variant="outline">{row.plant}</Badge>,
    },
    {
      id: 'ncm',
      header: 'NCM',
      kind: 'text',
      width: 180,
      cell: ({ row }) => <span className="font-mono text-xs tracking-wide">{row.ncm}</span>,
    },
    {
      id: 'suframa',
      header: 'Suframa (Destaque)',
      kind: 'text',
      width: 230,
      cell: ({ row }) => <span className="font-mono text-xs tracking-wide">{row.suframa}</span>,
    },
    {
      id: 'item',
      header: 'Item',
      kind: 'text',
      width: 260,
      grow: true,
      accessor: (row) => itemNames.get(row.itemId) ?? row.itemId,
      searchText: (row) => itemNames.get(row.itemId) ?? row.itemId,
      cell: ({ row }) => <span>{itemNames.get(row.itemId) ?? row.itemId}</span>,
    },
    {
      id: 'lastUpdated',
      header: 'Last Updated',
      kind: 'date',
      width: 180,
      cell: ({ row }) => <span className="tabular-nums">{row.lastUpdated}</span>,
    },
  ]
}

const DEFAULT_QUERY: DataTableQuery = { ...DEFAULT_DATA_TABLE_QUERY, sort: [{ id: 'itemName', direction: 'asc' }] }
const DEFAULT_MAPPING_QUERY: DataTableQuery = { ...DEFAULT_DATA_TABLE_QUERY, sort: [{ id: 'plant', direction: 'asc' }] }

export function PpbItemsView() {
  const [items, setItems] = useState<readonly PpbItem[]>(PPB_ITEM_SEED)
  const [query, setQuery] = useState<DataTableQuery>(DEFAULT_QUERY)
  const [mappingQuery, setMappingQuery] = useState<DataTableQuery>(DEFAULT_MAPPING_QUERY)
  const [activeTab, setActiveTab] = useState('items')
  const [editing, setEditing] = useState<PpbItem | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const mappingColumns = useMemo(() => createMappingColumns(items), [items])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (item: PpbItem) => {
    setEditing(item)
    setFormOpen(true)
  }

  const submit = (values: PpbItemFormValues) => {
    setItems((current) =>
      editing
        ? current.map((item) => (item.id === editing.id ? { ...item, ...values } : item))
        : [...current, { ...values, id: values.itemSlug }],
    )
  }

  const rowActions: RowAction<PpbItem>[] = [
    { id: 'edit', label: 'Edit', icon: <Pencil aria-hidden="true" />, inline: true, onSelect: openEdit },
  ]

  return (
    <>
      <PageHeader
        title="PPB Items"
        description="Master data for items used across PPB sourcing, production, and localization workflows."
      >
        {activeTab === 'items' && (
          <Button size="lg" onClick={openCreate}>
            <Plus aria-hidden="true" data-icon="inline-start" />
            New item
          </Button>
        )}
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
        <TabsList variant="line" className="w-full justify-start gap-2 rounded-none border-b border-border p-0">
          <TabsTrigger value="items" className="flex-none gap-2 px-3 pb-2">Items <Badge variant="secondary">{items.length}</Badge></TabsTrigger>
          <TabsTrigger value="mapping-ncm" className="flex-none px-3 pb-2">Mapping (NCM)</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <DataTable<PpbItem>
            caption="PPB Items master data"
            persistenceKey="ppb-items"
            columns={COLUMNS}
            data={items}
            getRowId={(row) => row.id}
            query={query}
            onQueryChange={setQuery}
            rowActions={rowActions}
            onRowClick={openEdit}
            columnPinning={false}
            densityControl={false}
            pagination={false}
          />
        </TabsContent>

        <TabsContent value="mapping-ncm">
          <DataTable<PpbNcmMapping>
            caption="PPB Items Mapping (NCM)"
            persistenceKey="ppb-items.mapping-ncm"
            columns={mappingColumns}
            data={PPB_NCM_MAPPING_SEED}
            getRowId={(row) => row.id}
            query={mappingQuery}
            onQueryChange={setMappingQuery}
            columnPinning={false}
            densityControl={false}
            pagination={false}
          />
        </TabsContent>
      </Tabs>

      <PpbItemFormDialog open={formOpen} onOpenChange={setFormOpen} item={editing} items={items} onSubmit={submit} />
    </>
  )
}
