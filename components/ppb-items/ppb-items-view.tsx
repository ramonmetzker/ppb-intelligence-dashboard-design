'use client'

import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/app/page-header'
import { YesNoBadge } from '@/components/app/yes-no-badge'
import { DataTable } from '@/components/data-table/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DEFAULT_QUERY as DEFAULT_DATA_TABLE_QUERY,
  type BulkAction,
  type DataTableColumn,
  type DataTableQuery,
  type RowAction,
} from '@/lib/data-table/types'
import { PPB_ITEM_SCHEMA, PPB_ITEM_SEED, PPB_NCM_MAPPING_SEED, PPB_SCORE_SEED, type PpbItem, type PpbNcmMapping, type PpbScore } from '@/lib/ppb-items/data'
import { PpbItemFormDialog, type PpbItemFormValues } from './ppb-item-form-dialog'
import { PpbNcmMappingFormDialog, type PpbNcmMappingFormValues } from './ppb-ncm-mapping-form-dialog'
import { PpbScoreFormDialog, type PpbScoreFormValues } from './ppb-score-form-dialog'

const schemaById = new Map(PPB_ITEM_SCHEMA.map((schema) => [schema.id, schema]))
const base = (id: string) => schemaById.get(id)!

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

function createScoreColumns(items: readonly PpbItem[]): DataTableColumn<PpbScore>[] {
  const itemNames = new Map(items.map((item) => [item.id, item.itemName]))

  return [
    {
      id: 'item',
      header: 'Item',
      kind: 'text',
      width: 250,
      pin: 'left',
      grow: true,
      accessor: (row) => itemNames.get(row.itemId) ?? row.itemId,
      searchText: (row) => itemNames.get(row.itemId) ?? row.itemId,
      cell: ({ row }) => <span>{itemNames.get(row.itemId) ?? row.itemId}</span>,
    },
    {
      id: 'score',
      header: 'Score',
      kind: 'number',
      width: 120,
      align: 'right',
      cell: ({ row }) => <span className="tabular-nums">{row.score}</span>,
    },
    {
      id: 'type',
      header: 'Type (Points or Quota %)',
      kind: 'text',
      width: 250,
      cell: ({ row }) => <Badge variant="outline">{row.type}</Badge>,
    },
    {
      id: 'sedaUsage',
      header: 'SEDA Usage',
      kind: 'boolean',
      width: 170,
      align: 'center',
      accessor: (row) => row.sedaUsage === 'Y',
      searchText: (row) => row.sedaUsage,
      cell: ({ row }) => <YesNoBadge value={row.sedaUsage} />,
    },
    {
      id: 'autoCount',
      header: 'Auto Count',
      kind: 'boolean',
      width: 160,
      align: 'center',
      accessor: (row) => row.autoCount === 'Y',
      searchText: (row) => row.autoCount,
      cell: ({ row }) => <YesNoBadge value={row.autoCount} />,
    },
    {
      id: 'validFrom',
      header: 'Valid From',
      kind: 'date',
      width: 160,
      cell: ({ row }) => <span className="tabular-nums">{row.validFrom}</span>,
    },
    {
      id: 'validTo',
      header: 'Valid To',
      kind: 'date',
      width: 160,
      cell: ({ row }) => <span className="tabular-nums">{row.validTo}</span>,
    },
  ]
}

const DEFAULT_QUERY: DataTableQuery = { ...DEFAULT_DATA_TABLE_QUERY, sort: [{ id: 'itemName', direction: 'asc' }] }
const DEFAULT_MAPPING_QUERY: DataTableQuery = { ...DEFAULT_DATA_TABLE_QUERY, sort: [{ id: 'plant', direction: 'asc' }] }
const DEFAULT_SCORE_QUERY: DataTableQuery = { ...DEFAULT_DATA_TABLE_QUERY, sort: [{ id: 'item', direction: 'asc' }] }

export function PpbItemsView() {
  const [items, setItems] = useState<readonly PpbItem[]>(PPB_ITEM_SEED)
  const [mappings, setMappings] = useState<readonly PpbNcmMapping[]>(PPB_NCM_MAPPING_SEED)
  const [scores, setScores] = useState<readonly PpbScore[]>(PPB_SCORE_SEED)
  const [query, setQuery] = useState<DataTableQuery>(DEFAULT_QUERY)
  const [mappingQuery, setMappingQuery] = useState<DataTableQuery>(DEFAULT_MAPPING_QUERY)
  const [scoreQuery, setScoreQuery] = useState<DataTableQuery>(DEFAULT_SCORE_QUERY)
  const [activeTab, setActiveTab] = useState('items')
  const [editing, setEditing] = useState<PpbItem | null>(null)
  const [editingMapping, setEditingMapping] = useState<PpbNcmMapping | null>(null)
  const [editingScore, setEditingScore] = useState<PpbScore | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [mappingFormOpen, setMappingFormOpen] = useState(false)
  const [scoreFormOpen, setScoreFormOpen] = useState(false)
  const mappingColumns = useMemo(() => createMappingColumns(items), [items])
  const scoreColumns = useMemo(() => createScoreColumns(items), [items])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (item: PpbItem) => {
    setEditing(item)
    setFormOpen(true)
  }

  const openCreateMapping = () => {
    setEditingMapping(null)
    setMappingFormOpen(true)
  }

  const openEditMapping = (mapping: PpbNcmMapping) => {
    setEditingMapping(mapping)
    setMappingFormOpen(true)
  }

  const openCreateScore = () => {
    setEditingScore(null)
    setScoreFormOpen(true)
  }

  const openEditScore = (score: PpbScore) => {
    setEditingScore(score)
    setScoreFormOpen(true)
  }

  const submit = (values: PpbItemFormValues) => {
    setItems((current) =>
      editing
        ? current.map((item) => (item.id === editing.id ? { ...item, ...values } : item))
        : [...current, { ...values, id: values.itemSlug }],
    )
  }

  const submitMapping = (values: PpbNcmMappingFormValues) => {
    const lastUpdated = new Date().toISOString().slice(0, 10)
    setMappings((current) =>
      editingMapping
        ? current.map((mapping) => (mapping.id === editingMapping.id ? { ...mapping, ...values, lastUpdated } : mapping))
        : [...current, { ...values, id: `${values.plant}-${values.ncm}-${values.itemId}-${Date.now()}`, lastUpdated }],
    )
  }

  const submitScore = (values: PpbScoreFormValues) => {
    setScores((current) =>
      editingScore
        ? current.map((score) => (score.id === editingScore.id ? { ...score, ...values } : score))
        : [...current, { ...values, id: `${values.itemId}-${values.validFrom}-${Date.now()}` }],
    )
  }

  const removeItems = (ids: string[]) => {
    const removedIds = new Set(ids)
    setItems((current) => current.filter((item) => !removedIds.has(item.id)))
    setMappings((current) => current.filter((mapping) => !removedIds.has(mapping.itemId)))
    setScores((current) => current.filter((score) => !removedIds.has(score.itemId)))
  }

  const removeMappings = (ids: string[]) => {
    const removedIds = new Set(ids)
    setMappings((current) => current.filter((mapping) => !removedIds.has(mapping.id)))
  }

  const removeScores = (ids: string[]) => {
    const removedIds = new Set(ids)
    setScores((current) => current.filter((score) => !removedIds.has(score.id)))
  }

  const itemRowActions: RowAction<PpbItem>[] = [
    { id: 'edit', label: 'Edit', icon: <Pencil aria-hidden="true" />, inline: true, onSelect: openEdit },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 aria-hidden="true" />,
      tone: 'destructive',
      separatorBefore: true,
      confirm: {
        title: 'Delete PPB item?',
        description: 'This item and its related mappings and scores will be removed.',
      },
      onSelect: (item) => removeItems([item.id]),
    },
  ]
  const mappingRowActions: RowAction<PpbNcmMapping>[] = [
    { id: 'edit', label: 'Edit', icon: <Pencil aria-hidden="true" />, inline: true, onSelect: openEditMapping },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 aria-hidden="true" />,
      tone: 'destructive',
      separatorBefore: true,
      confirm: {
        title: 'Delete NCM mapping?',
        description: 'This mapping will be removed from the current list.',
      },
      onSelect: (mapping) => removeMappings([mapping.id]),
    },
  ]
  const scoreRowActions: RowAction<PpbScore>[] = [
    { id: 'edit', label: 'Edit', icon: <Pencil aria-hidden="true" />, inline: true, onSelect: openEditScore },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 aria-hidden="true" />,
      tone: 'destructive',
      separatorBefore: true,
      confirm: {
        title: 'Delete PPB score?',
        description: 'This score will be removed from the current list.',
      },
      onSelect: (score) => removeScores([score.id]),
    },
  ]
  const itemBulkActions: BulkAction<PpbItem>[] = [
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 aria-hidden="true" />,
      tone: 'destructive',
      confirm: (context) => ({
        title: `Delete ${context.count} PPB items?`,
        description: 'Their related mappings and scores will also be removed.',
      }),
      onSelect: ({ ids }) => removeItems(ids),
    },
  ]
  const mappingBulkActions: BulkAction<PpbNcmMapping>[] = [
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 aria-hidden="true" />,
      tone: 'destructive',
      confirm: (context) => ({
        title: `Delete ${context.count} NCM mappings?`,
        description: 'This action cannot be undone.',
      }),
      onSelect: ({ ids }) => removeMappings(ids),
    },
  ]
  const scoreBulkActions: BulkAction<PpbScore>[] = [
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 aria-hidden="true" />,
      tone: 'destructive',
      confirm: (context) => ({
        title: `Delete ${context.count} scores?`,
        description: 'This action cannot be undone.',
      }),
      onSelect: ({ ids }) => removeScores(ids),
    },
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
        {activeTab === 'mapping-ncm' && (
          <Button size="lg" onClick={openCreateMapping}>
            <Plus aria-hidden="true" data-icon="inline-start" />
            New mapping
          </Button>
        )}
        {activeTab === 'scoring' && (
          <Button size="lg" onClick={openCreateScore}>
            <Plus aria-hidden="true" data-icon="inline-start" />
            New score
          </Button>
        )}
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
        <TabsList variant="line" className="h-10 min-h-10 w-full justify-start gap-2 rounded-none border-b border-border p-0">
          <TabsTrigger value="items" className="!h-9 flex-none gap-2 px-3">Items <Badge variant="secondary">{items.length}</Badge></TabsTrigger>
          <TabsTrigger value="mapping-ncm" className="!h-9 flex-none px-3">Mapping (NCM)</TabsTrigger>
          <TabsTrigger value="scoring" className="!h-9 flex-none px-3">Score</TabsTrigger>
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
            selectable
            bulkActions={itemBulkActions}
            rowActions={itemRowActions}
            onRowClick={openEdit}
            columnPinning={false}
            densityControl
            pagination={false}
          />
        </TabsContent>

        <TabsContent value="mapping-ncm">
          <DataTable<PpbNcmMapping>
            caption="PPB Items Mapping (NCM)"
            persistenceKey="ppb-items.mapping-ncm"
            columns={mappingColumns}
            data={mappings}
            getRowId={(row) => row.id}
            query={mappingQuery}
            onQueryChange={setMappingQuery}
            selectable
            bulkActions={mappingBulkActions}
            rowActions={mappingRowActions}
            onRowClick={openEditMapping}
            columnPinning={false}
            densityControl
            pagination={false}
          />
        </TabsContent>

        <TabsContent value="scoring">
          <DataTable<PpbScore>
            caption="PPB Items scoring master data"
            persistenceKey="ppb-items.scoring"
            columns={scoreColumns}
            data={scores}
            getRowId={(row) => row.id}
            query={scoreQuery}
            onQueryChange={setScoreQuery}
            selectable
            bulkActions={scoreBulkActions}
            rowActions={scoreRowActions}
            onRowClick={openEditScore}
            columnPinning={false}
            densityControl
            pagination={false}
          />
        </TabsContent>
      </Tabs>

      <PpbItemFormDialog open={formOpen} onOpenChange={setFormOpen} item={editing} items={items} onSubmit={submit} />
      <PpbNcmMappingFormDialog open={mappingFormOpen} onOpenChange={setMappingFormOpen} mapping={editingMapping} mappings={mappings} items={items} onSubmit={submitMapping} />
      <PpbScoreFormDialog open={scoreFormOpen} onOpenChange={setScoreFormOpen} score={editingScore} scores={scores} items={items} onSubmit={submitScore} />
    </>
  )
}
