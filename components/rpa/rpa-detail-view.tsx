'use client'

import Link from 'next/link'
import { useCallback, useState, type ReactNode } from 'react'
import useSWR from 'swr'
import { ArrowLeft } from 'lucide-react'
import { DataTable } from '@/components/data-table/data-table'
import { PageHeader } from '@/components/app/page-header'
import { Panel } from '@/components/app/panel'
import { RpaStatusBadge } from '@/components/rpa/rpa-status'
import { apiFetcher } from '@/lib/api/client'
import type { ApiResponse } from '@/lib/api/contracts'
import { queryToParams } from '@/lib/data-table/query'
import type { DataTableColumn, DataTableQuery } from '@/lib/data-table/types'
import {
  DEFAULT_RPA_LOG_QUERY,
  RPA_LOG_SCHEMA,
  type RpaLog,
  type RpaLogsResource,
} from '@/lib/rpa/log-data'
import { describeCron } from '@/lib/rpa/cron'
import { formatDateTime } from '@/components/rpa/format'
import { useRpas } from '@/components/rpa/rpa-provider'
import { Badge } from '@/components/ui/badge'

const logSchemaById = new Map(RPA_LOG_SCHEMA.map((schema) => [schema.id, schema]))
const logBase = (id: string) => logSchemaById.get(id)!

const logColumns: DataTableColumn<RpaLog>[] = [
  {
    ...logBase('timestamp'),
    width: 210,
    minWidth: 190,
    cell: ({ row }) => (
      <time dateTime={row.timestamp} className="text-muted-foreground">
        {formatDateTime(row.timestamp)}
      </time>
    ),
  },
  {
    ...logBase('level'),
    width: 115,
    minWidth: 100,
    cell: ({ row }) => (
      <Badge
        variant={row.level === 'error' ? 'destructive' : row.level === 'warning' ? 'secondary' : 'outline'}
        className="capitalize"
      >
        {row.level}
      </Badge>
    ),
  },
  {
    ...logBase('message'),
    width: 420,
    minWidth: 300,
    grow: true,
    cell: ({ row }) => <span className="block min-w-0 truncate" title={row.message}>{row.message}</span>,
  },
  {
    ...logBase('durationMs'),
    width: 130,
    minWidth: 115,
    align: 'right',
    cell: ({ row }) => (
      <span className="font-mono tabular-nums text-muted-foreground">
        {row.durationMs == null ? '—' : `${row.durationMs.toLocaleString('en-US')} ms`}
      </span>
    ),
  },
]

function DetailValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-[10px] font-medium tracking-[0.1em] text-muted-foreground uppercase">{label}</span>
      <div className="min-w-0 truncate text-sm font-medium">{children}</div>
    </div>
  )
}

export function RpaDetailView({ rpaId }: { rpaId: string }) {
  const { rows } = useRpas()
  const rpa = rows.find((row) => row.id === rpaId)
  const [query, setQuery] = useState({ ...DEFAULT_RPA_LOG_QUERY, sort: [...DEFAULT_RPA_LOG_QUERY.sort] })
  const queryString = queryToParams(query, DEFAULT_RPA_LOG_QUERY).toString()
  const logsUrl = rpa
    ? `/api/v1/rpas/${encodeURIComponent(rpa.id)}/logs${queryString ? `?${queryString}` : ''}`
    : null
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<RpaLogsResource>>(
    logsUrl,
    apiFetcher<RpaLogsResource>,
  )

  const getAllRows = useCallback(async (exportQuery: DataTableQuery) => {
    const params = queryToParams(
      { ...exportQuery, page: 1, pageSize: 500 },
      DEFAULT_RPA_LOG_QUERY,
    )
    const result = await apiFetcher<RpaLogsResource>(
      `/api/v1/rpas/${encodeURIComponent(rpaId)}/logs?${params.toString()}`,
    )
    return result.data.rows
  }, [rpaId])

  if (!rpa) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/rpa-monitor" className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft aria-hidden="true" />
          Back to RPA Monitor
        </Link>
        <PageHeader title="RPA not found" description="This RPA is not available in the current monitor." />
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col">
      <Link href="/rpa-monitor" className="mb-2 inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:rounded focus-visible:outline-2 focus-visible:outline-ring">
        <ArrowLeft aria-hidden="true" />
        Back to RPA Monitor
      </Link>

      <PageHeader title={rpa.name} description={rpa.description}>
        <RpaStatusBadge status={rpa.status} />
      </PageHeader>

      <div className="flex min-w-0 flex-col gap-4">
        <Panel title="Automation details" description="Schedule, recent activity, and notification settings.">
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-5">
            <DetailValue label="RPA ID"><span className="font-mono">{rpa.id}</span></DetailValue>
            <DetailValue label="Schedule">
              <span title={`Cron (UTC): ${rpa.schedule}`}>{describeCron(rpa.schedule)}</span>
            </DetailValue>
            <DetailValue label="Last run">
              {rpa.lastRunAt ? (
                <time dateTime={rpa.lastRunAt}>{formatDateTime(rpa.lastRunAt)}</time>
              ) : (
                <span className="text-muted-foreground">Never</span>
              )}
            </DetailValue>
            <DetailValue label="Notifications">
              {rpa.notifications.success || rpa.notifications.error
                ? [rpa.notifications.success && 'Success', rpa.notifications.error && 'Errors'].filter(Boolean).join(' · ')
                : 'Off'}
            </DetailValue>
            <DetailValue label="Status message">{rpa.detail || '—'}</DetailValue>
          </div>
        </Panel>

        <section aria-labelledby="rpa-logs-heading" className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 id="rpa-logs-heading" className="font-display text-base font-semibold tracking-tight">Execution logs</h2>
            <p className="text-xs text-muted-foreground">Timestamped events from the latest execution, shown in UTC.</p>
          </div>
          <DataTable<RpaLog>
            caption={`${rpa.name} execution logs`}
            persistenceKey={`rpa-logs-${rpa.id}`}
            mode="server"
            columns={logColumns}
            data={data?.data.rows ?? []}
            totalRows={data?.data.total ?? 0}
            loading={isLoading}
            error={error?.message ?? null}
            onRetry={() => void mutate()}
            getRowId={(row) => row.id}
            query={query}
            defaultQuery={DEFAULT_RPA_LOG_QUERY}
            onQueryChange={setQuery}
            pageSizeOptions={[10, 25, 50]}
            bordered
            stickyHeader
            maxHeight="min(60dvh, 620px)"
            defaultDensity="comfortable"
            emptyState={<p className="px-4 py-10 text-center text-sm text-muted-foreground">No execution logs are available for this RPA.</p>}
            exporter={{ fileName: `${rpa.id.toLowerCase()}-logs`, getAllRows }}
          />
        </section>
      </div>
    </div>
  )
}
