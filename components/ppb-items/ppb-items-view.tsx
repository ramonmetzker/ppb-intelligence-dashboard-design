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
import { PPB_ITEM_SCHEMA, PPB_ITEM_SEED, PPB_NCM_MAPPING_SEED, PPB_SCORE_SEED, type PpbItem, type PpbNcmMapping, type PpbScore } from '@/lib/ppb-items/data'
import { PpbItemFormDialog, type PpbItemFormValues } from './ppb-item-form-dialog'
import { PpbNcmMappingFormDialog, type PpbNcmMappingFormValues } from './ppb-ncm-mapping-form-dialog'
import { PpbScoreFormDialog, type PpbScoreFormValues } from './ppb-score-form-dialog'

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
    setMappings((current) =>
      editingMapping
        ? current.map((mapping) => (mapping.id === editingMapping.id ? { ...mapping, ...values } : mapping))
        : [...current, { ...values, id: `${values.plant}-${values.ncm}-${values.itemId}-${Date.now()}` }],
    )
  }

  const submitScore = (values: PpbScoreFormValues) => {
    setScores((current) =>
      editingScore
        ? current.map((score) => (score.id === editingScore.id ? { ...score, ...values } : score))
        : [...current, { ...values, id: `${values.itemId}-${values.validFrom}-${Date.now()}` }],
    )
  }

  const itemRowActions: RowAction<PpbItem>[] = [
    { id: 'edit', label: 'Edit', icon: <Pencil aria-hidden="true" />, inline: true, onSelect: openEdit },
  ]
  const mappingRowActions: RowAction<PpbNcmMapping>[] = [
    { id: 'edit', label: 'Edit', icon: <Pencil aria-hidden="true" />, inline: true, onSelect: openEditMapping },
  ]
  const scoreRowActions: RowAction<PpbScore>[] = [
    { id: 'edit', label: 'Edit', icon: <Pencil aria-hidden="true" />, inline: true, onSelect: openEditScore },
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
            rowActions={itemRowActions}
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
            data={mappings}
            getRowId={(row) => row.id}
            query={mappingQuery}
            onQueryChange={setMappingQuery}
            rowActions={mappingRowActions}
            onRowClick={openEditMapping}
            columnPinning={false}
            densityControl={false}
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
            rowActions={scoreRowActions}
            onRowClick={openEditScore}
            columnPinning={false}
            densityControl={false}
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
