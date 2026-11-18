'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Bell, BellOff, CalendarClock, Plus, Power, PowerOff } from 'lucide-react'
import { PageActions } from '@/components/app/page-actions'
import { PageHeader } from '@/components/app/page-header'
import { DataTable } from '@/components/data-table/data-table'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  DEFAULT_QUERY,
  type BulkAction,
  type DataTableColumn,
  type DataTableQuery,
  type RowAction,
} from '@/lib/data-table/types'
import { describeCron, nextRun } from '@/lib/rpa/cron'
import { nextRpaId, RPA_SCHEMA, type Rpa, type RpaNotifications } from '@/lib/rpa/data'
import { cn } from '@/lib/utils'
import { formatDateTime, formatNextRun } from './format'
import { RpaFormDialog, type RpaFormValues } from './rpa-form-dialog'
import { RpaNotificationsDialog } from './rpa-notifications-dialog'
import { useRpas } from './rpa-provider'
import { RpaScheduleDialog } from './rpa-schedule-dialog'
import { RpaStatusBadge } from './rpa-status'
import { RpaStatusSummary } from './rpa-status-summary'
import { useNow } from './use-now'

const schemaById = new Map(RPA_SCHEMA.map((schema) => [schema.id, schema]))
const base = (id: string) => schemaById.get(id)!

const DEFAULT_RPA_QUERY: DataTableQuery = { ...DEFAULT_QUERY, sort: [{ id: 'id', direction: 'asc' }] }

export function RpaMonitorView() {
  const now = useNow()
  const { rows, setRows } = useRpas()
  const [query, setQuery] = useState<DataTableQuery>(DEFAULT_RPA_QUERY)
  const [showLocalTime, setShowLocalTime] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [scheduling, setScheduling] = useState<Rpa | null>(null)
  const [notifying, setNotifying] = useState<Rpa | null>(null)

  const patch = (ids: string[], change: Partial<Rpa>) =>
    setRows((current) => current.map((row) => (ids.includes(row.id) ? { ...row, ...change } : row)))

  const register = (values: RpaFormValues) =>
    setRows((current) => [
      {
        id: nextRpaId(current),
        ...values,
        enabled: true,
        lastRunAt: null,
        status: 'never',
      },
      ...current,
    ])

  const columns = useMemo<DataTableColumn<Rpa>[]>(
    () => [
      {
        ...base('id'),
        width: 110,
        pin: 'left',
        hideable: false,
        cell: ({ row }) => <span className="font-mono text-xs font-medium">{row.id}</span>,
      },
      {
        ...base('name'),
        width: 190,
        hideable: false,
        cell: ({ row }) => (
          <span className="inline-flex min-w-0 items-center gap-2 font-medium">
            <Link
              href={`/rpa-monitor/${encodeURIComponent(row.id)}`}
              className="truncate hover:underline hover:underline-offset-4 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-ring"
            >
              {row.name}
            </Link>
            {!row.enabled && (
              <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[11px] leading-none font-medium text-muted-foreground">
                Disabled
              </span>
            )}
          </span>
        ),
      },
      { ...base('status'), width: 140, cell: ({ row }) => <RpaStatusBadge status={row.status} /> },
      {
        ...base('description'),
        width: 300,
        grow: true,
        cell: ({ row }) => (
          <span className="block truncate text-muted-foreground" title={row.description}>
            {row.description || '—'}
          </span>
        ),
      },
      {
        ...base('schedule'),
        width: 180,
        sortable: false,
        description: 'Human-readable schedule. Hover a value to see its cron expression in UTC.',
        cell: ({ row }) => (
          <span
            className="cursor-help border-b border-dashed border-muted-foreground/50 font-medium"
            title={`Cron (UTC): ${row.schedule}`}
          >
            {describeCron(row.schedule)}
          </span>
        ),
      },
      {
        ...base('nextRun'),
        width: 190,
        sortable: false,
        cell: ({ row }) => {
          const next = row.enabled && now !== null ? nextRun(row.schedule, new Date(now)) : null
          return row.enabled ? (
            next ? (
              <time dateTime={next.toISOString()}>{formatNextRun(next, showLocalTime)}</time>
            ) : (
              <span className="text-muted-foreground">Calculating…</span>
            )
          ) : (
            <span className="text-muted-foreground">Paused</span>
          )
        },
      },
      {
        ...base('lastRunAt'),
        width: 205,
        description: 'When the last run started. Use the table switch to display UTC or GMT-4.',
        cell: ({ row }) =>
          row.lastRunAt ? (
            <time dateTime={row.lastRunAt}>{formatDateTime(row.lastRunAt, showLocalTime)}</time>
          ) : (
            <span className="text-muted-foreground">Never</span>
          ),
      },
      {
        ...base('statusMessage'),
        width: 280,
        cell: ({ row }) => (
          <span className={cn('block truncate', row.detail ? 'text-foreground' : 'text-muted-foreground')} title={row.detail}>
            {row.detail || '—'}
          </span>
        ),
      },
    ],
    [now, showLocalTime],
  )

  const rowActions = (row: Rpa): RowAction<Rpa>[] => {
    const notifying = row.notifications.success || row.notifications.error
    return [
      {
        id: 'schedule',
        label: 'Change schedule',
        icon: <CalendarClock aria-hidden="true" />,
        inline: true,
        onSelect: setScheduling,
      },
      {
        id: 'notifications',
        label: notifying ? 'Notifications on' : 'Notifications off',
        icon: notifying ? <Bell aria-hidden="true" /> : <BellOff aria-hidden="true" />,
        inline: true,
        onSelect: setNotifying,
      },
      {
        id: 'toggle',
        label: row.enabled ? 'Disable' : 'Enable',
        icon: row.enabled ? <PowerOff aria-hidden="true" /> : <Power aria-hidden="true" />,
        tone: row.enabled ? 'destructive' : 'default',
        separatorBefore: true,
        onSelect: (target) => patch([target.id], { enabled: !target.enabled }),
      },
    ]
  }

  const bulkActions: BulkAction<Rpa>[] = [
    {
      id: 'enable',
      label: 'Enable',
      icon: <Power aria-hidden="true" />,
      onSelect: ({ ids }) => patch(ids, { enabled: true }),
    },
    {
      id: 'disable',
      label: 'Disable',
      icon: <PowerOff aria-hidden="true" />,
      tone: 'destructive',
      onSelect: ({ ids }) => patch(ids, { enabled: false }),
    },
  ]

  const saveNotifications = (id: string, notifications: RpaNotifications) => patch([id], { notifications })

  return (
    <>
      <PageHeader
        title="RPA Monitor"
        description="Every robot, its schedule and the result of its last run. Switch table times between UTC and GMT-4."
      >
        <PageActions
          primary={
            <Button size="lg" onClick={() => setFormOpen(true)}>
              <Plus aria-hidden="true" data-icon="inline-start" />
              New RPA
            </Button>
          }
        />
      </PageHeader>

      <div className="flex flex-col gap-4">
        <RpaStatusSummary rows={rows} query={query} onQueryChange={setQuery} />

        <DataTable<Rpa>
          caption="RPAs"
          persistenceKey="rpa-monitor"
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
          query={query}
          onQueryChange={setQuery}
          toolbarStart={
            <div className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground">
              <Switch
                checked={showLocalTime}
                onCheckedChange={setShowLocalTime}
                aria-label="Horário local, GMT-4"
              />
              <span aria-hidden="true">Horário local</span>
              <span aria-hidden="true" className="text-muted-foreground">GMT-4</span>
            </div>
          }
          selectable
          bulkActions={bulkActions}
          rowActions={rowActions}
          actionsWidth={112}
          getRowClassName={(row) =>
            cn(
              !row.enabled && 'text-muted-foreground',
              row.status === 'failed' &&
                '[&>td]:!border-critical/20 [&>td]:!bg-[color-mix(in_oklab,var(--card)_94%,var(--critical))] hover:[&>td]:!bg-[color-mix(in_oklab,var(--card)_89%,var(--critical))]',
            )
          }
          />
      </div>

      <RpaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        existingNames={rows.map((row) => row.name)}
        onSubmit={register}
      />
      <RpaScheduleDialog
        rpa={scheduling}
        onOpenChange={(open) => !open && setScheduling(null)}
        onSave={(id, schedule) => patch([id], { schedule })}
      />
      <RpaNotificationsDialog
        rpa={notifying}
        onOpenChange={(open) => !open && setNotifying(null)}
        onSave={saveNotifications}
      />
    </>
  )
}
