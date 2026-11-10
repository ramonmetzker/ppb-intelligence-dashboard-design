'use client'

import { useMemo, useState } from 'react'
import useSWR from 'swr'
import { CheckCheck, Copy, Download, Eye, Lock, LockOpen, Plus, Trash2, Upload } from 'lucide-react'
import { PageActions } from '@/components/app/page-actions'
import { PageHeader } from '@/components/app/page-header'
import { DataTable } from '@/components/data-table/data-table'
import { Button } from '@/components/ui/button'
import { queryToParams } from '@/lib/data-table/query'
import {
  DEFAULT_QUERY,
  type BulkAction,
  type DataTableColumn,
  type DataTableQuery,
  type RowAction,
} from '@/lib/data-table/types'
import { SOP_DEMAND_ROWS, SOP_SCHEMA, STATUS_OPTIONS, type SopDemand, type SopStatus } from '@/lib/sop-demand/data'
import { cn } from '@/lib/utils'
import { SopDemandDetails } from './sop-demand-details'
import { SopDemandSummary } from './sop-demand-summary'

const number = new Intl.NumberFormat('en-US')
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const formatDate = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric', year: 'numeric' })

const schemaById = new Map(SOP_SCHEMA.map((schema) => [schema.id, schema]))
const base = (id: keyof SopDemand) => schemaById.get(id)!

export function StatusBadge({ status }: { status: SopStatus }) {
  const option = STATUS_OPTIONS.find((o) => o.value === status)!
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium">
      <span aria-hidden="true" className="size-1.5 rounded-full" style={{ backgroundColor: option.color }} />
      {option.label}
    </span>
  )
}

const COLUMNS: DataTableColumn<SopDemand>[] = [
  {
    ...base('itemCode'),
    width: 150,
    pin: 'left',
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-2 font-mono text-xs font-medium">
        {row.critical && <span aria-hidden="true" className="size-1.5 rounded-full bg-critical" />}
        {row.itemCode}
        {row.critical && <span className="sr-only">Critical</span>}
      </span>
    ),
  },
  { ...base('description'), width: 220, grow: true },
  { ...base('family'), width: 130 },
  { ...base('product'), width: 140 },
  { ...base('region'), width: 150 },
  { ...base('plant'), width: 120 },
  { ...base('owner'), width: 150 },
  { ...base('status'), width: 130, cell: ({ row }) => <StatusBadge status={row.status} /> },
  { ...base('demand'), width: 135, cell: ({ row }) => number.format(row.demand) },
  { ...base('supply'), width: 135, cell: ({ row }) => number.format(row.supply) },
  {
    ...base('gap'),
    width: 130,
    pin: 'right',
    description: 'Supply minus demand. Negative means a shortage.',
    cell: ({ row }) => (
      <span className={cn('font-medium', row.gap < 0 ? 'text-critical' : 'text-success')}>
        {row.gap > 0 ? '+' : ''}
        {number.format(row.gap)}
      </span>
    ),
  },
  { ...base('accuracy'), width: 120, cell: ({ row }) => `${row.accuracy.toFixed(1)}%`, defaultHidden: true },
  { ...base('unitPrice'), width: 120, cell: ({ row }) => `$${row.unitPrice.toFixed(2)}`, defaultHidden: true },
  { ...base('revenue'), width: 145, cell: ({ row }) => currency.format(row.revenue) },
  { ...base('needDate'), width: 130, cell: ({ row }) => formatDate(row.needDate) },
  { ...base('updatedAt'), width: 130, cell: ({ row }) => formatDate(row.updatedAt), defaultHidden: true },
  {
    ...base('critical'),
    width: 100,
    defaultHidden: true,
    cell: ({ row }) => (row.critical ? <span className="font-medium text-critical">Critical</span> : <span className="text-muted-foreground/60">-</span>),
  },
]

type Mode = 'client' | 'server'

export function SopDemandView({ initialMode = 'client' }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [rows, setRows] = useState<SopDemand[]>(() => [...SOP_DEMAND_ROWS])
  const [query, setQuery] = useState<DataTableQuery>(DEFAULT_QUERY)
  const [opened, setOpened] = useState<SopDemand | null>(null)

  const { data: remote, isLoading } = useSWR<{ rows: SopDemand[]; total: number }>(
    mode === 'server' ? `/api/sop-demand?${queryToParams(query)}` : null,
    (url: string) => fetch(url).then((response) => response.json()),
    { keepPreviousData: true },
  )

  const patch = (ids: string[], change: Partial<SopDemand>) =>
    setRows((current) => current.map((row) => (ids.includes(row.id) ? { ...row, ...change } : row)))
  const remove = (ids: string[]) => setRows((current) => current.filter((row) => !ids.includes(row.id)))
  const duplicate = (row: SopDemand) =>
    setRows((current) => [{ ...row, id: `${row.id}-copy-${current.length}`, status: 'draft', itemCode: `${row.itemCode}-C` }, ...current])

  const create = () =>
    setRows((current) => [
      {
        ...current[0],
        id: `sop-new-${current.length}`,
        itemCode: `NEW-${String(current.length + 1).padStart(4, '0')}`,
        description: 'New demand line',
        status: 'draft',
        demand: 0,
        supply: 0,
        gap: 0,
        revenue: 0,
        critical: false,
      },
      ...current,
    ])

  const isClient = mode === 'client'

  const rowActions = useMemo<(row: SopDemand) => RowAction<SopDemand>[]>(
    () => (row) => [
      { id: 'view', label: 'View details', icon: <Eye aria-hidden="true" />, inline: true, onSelect: setOpened },
      { id: 'duplicate', label: 'Duplicate', icon: <Copy aria-hidden="true" />, disabled: !isClient, onSelect: duplicate },
      {
        id: 'lock',
        label: row.status === 'locked' ? 'Unlock' : 'Lock',
        icon: row.status === 'locked' ? <LockOpen aria-hidden="true" /> : <Lock aria-hidden="true" />,
        disabled: !isClient,
        onSelect: (target) => patch([target.id], { status: target.status === 'locked' ? 'draft' : 'locked' }),
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: <Trash2 aria-hidden="true" />,
        tone: 'destructive',
        separatorBefore: true,
        disabled: !isClient || row.status === 'locked',
        onSelect: (target) => remove([target.id]),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isClient],
  )

  const bulkActions = useMemo<BulkAction<SopDemand>[]>(
    () => [
      {
        id: 'approve',
        label: 'Approve',
        icon: <CheckCheck aria-hidden="true" />,
        disabled: () => !isClient,
        onSelect: ({ ids }) => patch(ids, { status: 'approved' }),
      },
      { id: 'lock', label: 'Lock', icon: <Lock aria-hidden="true" />, disabled: () => !isClient, onSelect: ({ ids }) => patch(ids, { status: 'locked' }) },
      {
        id: 'delete',
        label: 'Delete',
        icon: <Trash2 aria-hidden="true" />,
        tone: 'destructive',
        disabled: () => !isClient,
        onSelect: ({ ids }) => remove(ids),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isClient],
  )

  return (
    <>
      <PageHeader
        title="SOP Demand"
        description="Demand lines by item for the sales and operations planning cycle. Review supply gaps, then approve and lock."
      >
        <PageActions
          secondary={
            <>
              <Button variant="outline" size="lg">
                <Upload aria-hidden="true" data-icon="inline-start" />
                Import
              </Button>
              <Button variant="outline" size="lg">
                <Download aria-hidden="true" data-icon="inline-start" />
                Export
              </Button>
            </>
          }
          primary={
            <Button size="lg" onClick={create} disabled={!isClient}>
              <Plus aria-hidden="true" data-icon="inline-start" />
              New demand
            </Button>
          }
        />
      </PageHeader>

      <div className="flex flex-col gap-4">
        <SopDemandSummary rows={rows} />

        <DataTable<SopDemand>
          caption="SOP demand lines"
          columns={COLUMNS}
          data={isClient ? rows : (remote?.rows ?? [])}
          totalRows={remote?.total}
          mode={mode}
          loading={!isClient && isLoading}
          getRowId={(row) => row.id}
          query={query}
          onQueryChange={setQuery}
          selectable
          isRowSelectable={(row) => row.status !== 'locked'}
          bulkActions={bulkActions}
          rowActions={rowActions}
          onRowClick={setOpened}
          getRowClassName={(row) => (row.critical ? 'font-medium' : undefined)}
          toolbarStart={
            <div role="group" aria-label="Data mode" className="flex h-9 items-center rounded-lg border border-input bg-card p-0.5 text-[13px]">
              {(['client', 'server'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={mode === value}
                  onClick={() => {
                    setMode(value)
                    setQuery(DEFAULT_QUERY)
                  }}
                  className={cn(
                    'h-full rounded-md px-2.5 font-medium capitalize outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    mode === value ? 'bg-brand-soft text-brand-deep' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
          }
        />
      </div>

      <SopDemandDetails row={opened} onClose={() => setOpened(null)} />
    </>
  )
}
