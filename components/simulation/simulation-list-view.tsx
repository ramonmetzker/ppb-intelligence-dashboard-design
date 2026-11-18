'use client'

import { useState } from 'react'
import { Info, Trash } from '@phosphor-icons/react'
import { PageHeader } from '@/components/app/page-header'
import { DataTable } from '@/components/data-table/data-table'
import { Badge } from '@/components/ui/badge'
import type { BulkAction, DataTableColumnDefinition } from '@/lib/data-table/types'
import { SUGGESTION_RESULTS } from '@/lib/ppb-model'

type SimulationListRow = {
  id: string
  profile: string
  year: string
  finalScore: number
  costSaving: number
  runDate: string
}

const PROFILE_BY_ID: Record<string, string> = {
  forecast: 'BASELINE',
  balanced: 'BALANCED',
  'lowest-cost': 'OPTIMIZED',
  'memory-sprint': 'SINGLE ITEM',
  'battery-hedge': 'PARTIAL',
  'max-headroom': 'AGGRESSIVE',
  'supplier-shock': 'STRESS TEST',
}

const DEMO_COST_SAVINGS: Record<string, number> = {
  forecast: 0,
  balanced: 53164.74,
  'lowest-cost': 68320.5,
  'memory-sprint': 21450,
  'battery-hedge': 34780.8,
  'max-headroom': 92750.25,
  'supplier-shock': 8250,
}

const MOCK_SIMULATION_ROWS: SimulationListRow[] = SUGGESTION_RESULTS.map(({ suggestion, sim }) => ({
  id: suggestion.id,
  profile: PROFILE_BY_ID[suggestion.id] ?? suggestion.tag.toUpperCase(),
  year: suggestion.createdAt.slice(0, 4),
  finalScore: sim.yearEnd,
  costSaving: DEMO_COST_SAVINGS[suggestion.id] ?? 0,
  runDate: suggestion.createdAt,
}))

const scoreFormat = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const currencyFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})
const dateFormat = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const columns: DataTableColumnDefinition<SimulationListRow>[] = [
  {
    id: 'id',
    header: 'ID',
    accessor: 'id',
    kind: 'text',
    width: 170,
    minWidth: 140,
    pin: 'left',
  },
  {
    id: 'profile',
    header: 'Profile',
    accessor: 'profile',
    kind: 'select',
    options: [...new Set(MOCK_SIMULATION_ROWS.map((row) => row.profile))].map((profile) => ({
      value: profile,
      label: profile,
    })),
    width: 170,
    minWidth: 145,
    cell: ({ value }) => (
      <Badge variant="outline" className="font-mono text-[10px] tracking-wide">
        {String(value)}
      </Badge>
    ),
  },
  {
    id: 'year',
    header: 'Year',
    accessor: 'year',
    kind: 'text',
    width: 110,
    minWidth: 96,
    align: 'right',
  },
  {
    id: 'finalScore',
    header: 'Final score',
    accessor: 'finalScore',
    kind: 'number',
    width: 150,
    minWidth: 130,
    align: 'right',
    cell: ({ value }) => <span className="num font-semibold">{scoreFormat.format(Number(value))}</span>,
  },
  {
    id: 'costSaving',
    header: 'Cost Saving',
    accessor: 'costSaving',
    kind: 'number',
    width: 170,
    minWidth: 150,
    align: 'right',
    cell: ({ value }) => <span className="num font-semibold">{currencyFormat.format(Number(value))}</span>,
    exportValue: (row) => currencyFormat.format(row.costSaving),
  },
  {
    id: 'runDate',
    header: 'Run date',
    accessor: 'runDate',
    kind: 'date',
    width: 220,
    minWidth: 190,
    cell: ({ value }) => (
      <time dateTime={String(value)} className="text-muted-foreground">
        {dateFormat.format(new Date(String(value)))}
      </time>
    ),
  },
]

export function SimulationListView() {
  const [rows, setRows] = useState(MOCK_SIMULATION_ROWS)
  const [lastDeletedIds, setLastDeletedIds] = useState<string[]>([])

  const deleteSimulations = (ids: string[]) => {
    const deletedIds = new Set(ids)
    setRows((currentRows) => currentRows.filter((row) => !deletedIds.has(row.id)))
    setLastDeletedIds(ids)
  }

  const bulkActions: BulkAction<SimulationListRow>[] = [
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash aria-hidden="true" />,
      tone: 'destructive',
      confirm: (context) => ({
        title: `Delete ${context.count} simulations?`,
        description: 'The selected mock runs will be removed from this list until you reload the page.',
        confirmLabel: 'Delete',
      }),
      onSelect: ({ ids }) => deleteSimulations(ids),
    },
  ]

  return (
    <div className="flex min-w-0 flex-col">
      <PageHeader
        title="Simulation List"
        description="Review simulation profiles, final scores, and run dates. Remove runs you no longer need."
      />

      <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-muted/35 px-3 py-2 text-xs text-muted-foreground">
        <Info size={15} aria-hidden="true" className="shrink-0" />
        <span>Mock data for preview. Cost Saving values are illustrative; deleted runs return after reload.</span>
      </div>

      {lastDeletedIds.length > 0 && (
        <p role="status" className="sr-only">
          {lastDeletedIds.length === 1
            ? `Simulation ${lastDeletedIds[0]} was removed from the mock list.`
            : `${lastDeletedIds.length} simulations were removed from the mock list.`}{' '}
          Deleted runs will return after reloading the page.
        </p>
      )}

      <DataTable<SimulationListRow>
        caption="Simulation runs"
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        defaultQuery={{ sort: [{ id: 'runDate', direction: 'desc' }] }}
        selectable
        bulkActions={bulkActions}
        rowActions={(row) => [
          {
            id: 'delete',
            label: 'Delete simulation',
            icon: <Trash size={15} aria-hidden="true" />,
            onSelect: () => deleteSimulations([row.id]),
            confirm: {
              title: `Delete ${row.id}?`,
              description: `The ${row.profile} mock run will be removed from this list until you reload the page.`,
              confirmLabel: 'Delete',
            },
            tone: 'destructive',
          },
        ]}
        actionsWidth={112}
        bordered
        stickyHeader
        maxHeight="min(72dvh, 760px)"
        defaultDensity="comfortable"
        exporter={{ fileName: 'simulation-list' }}
      />
    </div>
  )
}
