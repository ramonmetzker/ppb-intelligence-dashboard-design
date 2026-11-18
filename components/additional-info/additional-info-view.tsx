'use client'

import { Clock } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { PageHeader } from '@/components/app/page-header'
import { formatDateTime } from '@/components/rpa/format'
import { ADDITIONAL_INFO_ROWS, type AdditionalInfoRow } from '@/lib/additional-info-data'
import type { DataTableColumnDefinition } from '@/lib/data-table/types'
import { useRpas } from '@/components/rpa/rpa-provider'
import { RpaStatusBadge } from '@/components/rpa/rpa-status'

const dateFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const columns: DataTableColumnDefinition<AdditionalInfoRow>[] = [
  {
    id: 'plant',
    header: 'Plant',
    accessor: 'plant',
    kind: 'select',
    options: [...new Set(ADDITIONAL_INFO_ROWS.map((row) => row.plant))].map((plant) => ({ value: plant, label: plant })),
    width: 252,
    minWidth: 190,
    pin: 'left',
  },
  {
    id: 'partNumber',
    header: 'Part Number',
    accessor: 'partNumber',
    kind: 'text',
    width: 180,
    minWidth: 152,
    grow: true,
  },
  {
    id: 'ncm',
    header: 'NCM (8 digits)',
    accessor: 'ncm',
    kind: 'text',
    width: 188,
    minWidth: 164,
    cell: ({ value }) => <span className="font-mono tabular-nums">{String(value)}</span>,
  },
  {
    id: 'suframa',
    header: 'Suframa (4 digits)',
    accessor: 'suframa',
    kind: 'text',
    width: 212,
    minWidth: 182,
    cell: ({ value }) => <span className="font-mono tabular-nums">{String(value)}</span>,
  },
  {
    id: 'updateDate',
    header: 'Update Date',
    accessor: 'updateDate',
    kind: 'date',
    width: 196,
    minWidth: 174,
    cell: ({ row }) => (
      <time dateTime={row.updateDate} className="text-muted-foreground">
        {dateFormat.format(new Date(`${row.updateDate}T00:00:00Z`))}
      </time>
    ),
  },
]

// The reference rows stay realistic in the interface without a visible preview disclaimer.
export function AdditionalInfoView() {
  const { rows } = useRpas()
  const pageRpa = rows.find((rpa) => rpa.id === 'RPA-004')
  const lastRpaRunAt = pageRpa?.lastRunAt ?? null

  return (
    <>
      <PageHeader
        title="Additional Info"
        description="Plant, customs classification, and regional incentive details by part number."
      >
        <div className="inline-flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Clock aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[11px] leading-4 text-muted-foreground">Last RPA run · NCM</span>
            {lastRpaRunAt ? (
              <time dateTime={lastRpaRunAt} className="text-xs leading-4 font-medium text-foreground">
                {formatDateTime(lastRpaRunAt, true)}
              </time>
            ) : (
              <span className="text-xs leading-4 font-medium text-muted-foreground">Never</span>
            )}
          </span>
          {pageRpa && <RpaStatusBadge status={pageRpa.status} />}
        </div>
      </PageHeader>

      <DataTable<AdditionalInfoRow>
        caption="Additional information by plant and part number"
        persistenceKey="raw-data-additional-info"
        columns={columns}
        data={ADDITIONAL_INFO_ROWS}
        getRowId={(row) => row.id}
        defaultQuery={{ sort: [{ id: 'updateDate', direction: 'desc' }] }}
        bordered
        stickyHeader
        maxHeight="min(72dvh, 760px)"
        defaultDensity="compact"
        exporter={{ fileName: 'additional-info' }}
      />
    </>
  )
}
