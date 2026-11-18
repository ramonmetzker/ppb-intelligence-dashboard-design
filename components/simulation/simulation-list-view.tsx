'use client'

import { useState } from 'react'
import { Info, Trash } from '@phosphor-icons/react'
import { PageHeader } from '@/components/app/page-header'
import { DataTable } from '@/components/data-table/data-table'
import { Badge } from '@/components/ui/badge'
import type { DataTableColumnDefinition } from '@/lib/data-table/types'
import { SUGGESTION_RESULTS } from '@/lib/ppb-model'

type SimulationListRow = {
  id: string
  profile: string
  year: number
  finalScore: number
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

const MOCK_SIMULATION_ROWS: SimulationListRow[] = SUGGESTION_RESULTS.map(({ suggestion, sim }) => ({
  id: suggestion.id,
  profile: PROFILE_BY_ID[suggestion.id] ?? suggestion.tag.toUpperCase(),
  year: Number(suggestion.createdAt.slice(0, 4)),
  finalScore: sim.yearEnd,
  runDate: suggestion.createdAt,
}))

const scoreFormat = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
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
    kind: 'number',
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
  const [lastDeletedId, setLastDeletedId] = useState<string | null>(null)

  const deleteSimulation = (row: SimulationListRow) => {
    setRows((currentRows) => currentRows.filter((item) => item.id !== row.id))
    setLastDeletedId(row.id)
  }

  return (
    <div className="flex min-w-0 flex-col">
      <PageHeader
        title="Simulation List"
        description="Review simulation profiles, final scores, and run dates. Remove runs you no longer need."
      />

      <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-muted/35 px-3 py-2 text-xs text-muted-foreground">
        <Info size={15} aria-hidden="true" className="shrink-0" />
        <span>Mock data for preview. Deleted runs return when you reload this page.</span>
      </div>

      {lastDeletedId && (
        <p role="status" className="sr-only">
          Simulation {lastDeletedId} was removed from the mock list. It will return after reloading the page.
        </p>
      )}

      <DataTable<SimulationListRow>
        caption="Simulation runs"
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        defaultQuery={{ sort: [{ id: 'runDate', direction: 'desc' }] }}
        rowActions={(row) => [
          {
            id: 'delete',
            label: 'Delete simulation',
            icon: <Trash size={15} aria-hidden="true" />,
            onSelect: deleteSimulation,
            confirm: {
              title: `Delete ${row.id}?`,
              description: `The ${row.profile} mock run will be removed from this list until you reload the page.`,
              confirmLabel: 'Delete',
            },
            tone: 'destructive',
            inline: true,
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
