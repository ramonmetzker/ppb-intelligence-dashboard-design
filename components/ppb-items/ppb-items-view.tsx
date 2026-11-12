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
import { PPB_CATEGORIES, PPB_ITEM_SCHEMA, PPB_ITEM_SEED, type PpbItem } from '@/lib/ppb-items/data'
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

const RELATED_COLUMNS: DataTableColumn<RelatedMasterRecord>[] = [
  { id: 'name', header: 'Name', kind: 'text', width: 220, pin: 'left', grow: true },
  { id: 'description', header: 'Description', kind: 'text', width: 360 },
  { id: 'linkedItems', header: 'Linked Items', kind: 'number', width: 140, align: 'right' },
  { id: 'status', header: 'Status', kind: 'text', width: 130, cell: ({ row }) => <Badge variant="secondary">{row.status}</Badge> },
]

type RelatedMasterRecord = {
  id: string
  name: string
  description: string
  linkedItems: number
  status: 'Active' | 'Draft'
}

const RELATED_DATA: Record<'categories' | 'mappings' | 'attributes', RelatedMasterRecord[]> = {
  categories: PPB_CATEGORIES.map((name, index) => ({
    id: name,
    name,
    description: index === 0 ? 'Items sourced from approved local suppliers.' : index === 1 ? 'Items produced within the manufacturing network.' : 'Items outside the localization scope.',
    linkedItems: [4, 3, 2][index],
    status: 'Active',
  })),
  mappings: [
    { id: 'local-source', name: 'Local source mapping', description: 'Links PPB items to local purchasing references.', linkedItems: 6, status: 'Active' },
    { id: 'production-route', name: 'Production route mapping', description: 'Links PPB items to in-house production routes.', linkedItems: 3, status: 'Active' },
    { id: 'exception-map', name: 'Localization exception map', description: 'Items excluded from the localization mapping flow.', linkedItems: 2, status: 'Draft' },
  ],
  attributes: [
    { id: 'category', name: 'Category', description: 'Classification used by localization and sourcing workflows.', linkedItems: 10, status: 'Active' },
    { id: 'mapping', name: 'Mapping', description: 'Controls whether an item participates in mapping workflows.', linkedItems: 10, status: 'Active' },
    { id: 'active', name: 'Active', description: 'Controls whether an item is available for planning flows.', linkedItems: 10, status: 'Active' },
  ],
}

const DEFAULT_QUERY: DataTableQuery = { ...DEFAULT_DATA_TABLE_QUERY, sort: [{ id: 'itemName', direction: 'asc' }] }

export function PpbItemsView() {
  const [items, setItems] = useState<readonly PpbItem[]>(PPB_ITEM_SEED)
  const [query, setQuery] = useState<DataTableQuery>(DEFAULT_QUERY)
  const [activeTab, setActiveTab] = useState('items')
  const [editing, setEditing] = useState<PpbItem | null>(null)
  const [formOpen, setFormOpen] = useState(false)

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

  const tabCounts = useMemo(() => ({ items: items.length, categories: RELATED_DATA.categories.length, mappings: RELATED_DATA.mappings.length, attributes: RELATED_DATA.attributes.length }), [items.length])

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
          <TabsTrigger value="items" className="flex-none gap-2 px-3 pb-2">Items <Badge variant="secondary">{tabCounts.items}</Badge></TabsTrigger>
          <TabsTrigger value="categories" className="flex-none gap-2 px-3 pb-2">Categories <Badge variant="outline">{tabCounts.categories}</Badge></TabsTrigger>
          <TabsTrigger value="mappings" className="flex-none gap-2 px-3 pb-2">Mappings <Badge variant="outline">{tabCounts.mappings}</Badge></TabsTrigger>
          <TabsTrigger value="attributes" className="flex-none gap-2 px-3 pb-2">Attributes <Badge variant="outline">{tabCounts.attributes}</Badge></TabsTrigger>
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

        {(['categories', 'mappings', 'attributes'] as const).map((tab) => (
          <TabsContent key={tab} value={tab}>
            <DataTable<RelatedMasterRecord>
              caption={`${tab} connected to PPB Items`}
              persistenceKey={`ppb-items.${tab}`}
              columns={RELATED_COLUMNS}
              data={RELATED_DATA[tab]}
              getRowId={(row) => row.id}
              columnPinning={false}
              densityControl={false}
              pagination={false}
            />
          </TabsContent>
        ))}
      </Tabs>

      <PpbItemFormDialog open={formOpen} onOpenChange={setFormOpen} item={editing} items={items} onSubmit={submit} />
    </>
  )
}
