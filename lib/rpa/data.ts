import type { ColumnSchema, SelectOption } from '@/lib/data-table/types'

export type RpaStatus = 'success' | 'warning' | 'failed' | 'running' | 'never'

export type RpaNotifications = {
  success: boolean
  error: boolean
}

export type Rpa = {
  /** Display id, e.g. RPA-001. */
  id: string
  name: string
  description: string
  /** Five field cron expression, evaluated in UTC. */
  schedule: string
  enabled: boolean
  /** ISO timestamp of the last run, or null when it never ran. */
  lastRunAt: string | null
  status: RpaStatus
  /** Short reason shown under the status for warnings and failures. */
  detail?: string
  notifications: RpaNotifications
}

export const STATUS_OPTIONS: readonly SelectOption[] = [
  { value: 'success', label: 'Success', color: 'var(--success)' },
  { value: 'warning', label: 'Warning', color: 'var(--warning)' },
  { value: 'failed', label: 'Failed', color: 'var(--critical)' },
  { value: 'running', label: 'Running', color: 'var(--brand)' },
  { value: 'never', label: 'Not run yet', color: 'var(--muted-foreground)' },
]

export const RPA_SCHEMA: ColumnSchema<Rpa>[] = [
  { id: 'id', header: 'ID', kind: 'text' },
  { id: 'name', header: 'RPA', kind: 'text', searchText: (row) => `${row.name} ${row.description}` },
  { id: 'schedule', header: 'Schedule', kind: 'text' },
  { id: 'lastRunAt', header: 'Last update', kind: 'date', searchable: false },
  {
    id: 'status',
    header: 'Last status',
    kind: 'select',
    options: STATUS_OPTIONS,
    searchText: (row) => `${STATUS_OPTIONS.find((option) => option.value === row.status)?.label ?? ''} ${row.detail ?? ''}`,
  },
]

export const RPA_SEED: readonly Rpa[] = [
  {
    id: 'RPA-001',
    name: 'BOM',
    description: 'Pulls the bill of materials for every PPB item from the ERP.',
    schedule: '0 5 * * *',
    enabled: true,
    lastRunAt: '2026-11-11T05:03:00Z',
    status: 'success',
    notifications: { success: false, error: true },
  },
  {
    id: 'RPA-002',
    name: 'SOP',
    description: 'Loads the approved SOP demand lines for the active cycle.',
    schedule: '30 6 * * 1-5',
    enabled: true,
    lastRunAt: '2026-11-11T06:34:00Z',
    status: 'running',
    notifications: { success: true, error: true },
  },
  {
    id: 'RPA-003',
    name: 'MM Cost Audit',
    description: 'Compares material master costs against the latest price table.',
    schedule: '0 7 * * 1',
    enabled: true,
    lastRunAt: '2026-11-09T07:12:00Z',
    status: 'failed',
    detail: 'Login timeout on the MM module',
    notifications: { success: false, error: true },
  },
  {
    id: 'RPA-004',
    name: 'NCM',
    description: 'Checks NCM classification and tax rules for imported components.',
    schedule: '0 */6 * * *',
    enabled: true,
    lastRunAt: '2026-11-11T06:01:00Z',
    status: 'warning',
    detail: '12 items without a valid NCM',
    notifications: { success: false, error: true },
  },
  {
    id: 'RPA-005',
    name: 'Material price refresh',
    description: 'Refreshes supplier quotes and publishes them to Material prices.',
    schedule: '15 4 * * *',
    enabled: true,
    lastRunAt: '2026-11-11T04:19:00Z',
    status: 'success',
    notifications: { success: false, error: false },
  },
  {
    id: 'RPA-006',
    name: 'Plant capacity snapshot',
    description: 'Takes a daily snapshot of line capacity for every plant.',
    schedule: '0 23 * * *',
    enabled: true,
    lastRunAt: '2026-11-10T23:06:00Z',
    status: 'success',
    notifications: { success: false, error: true },
  },
  {
    id: 'RPA-007',
    name: 'Supplier lead time',
    description: 'Collects confirmed lead times from the supplier portal.',
    schedule: '0 8 * * 1-5',
    enabled: false,
    lastRunAt: '2026-10-30T08:04:00Z',
    status: 'failed',
    detail: 'Supplier portal credentials expired',
    notifications: { success: false, error: true },
  },
  {
    id: 'RPA-008',
    name: 'Customs clearance status',
    description: 'Tracks shipments waiting on customs and updates the risk list.',
    schedule: '0 5 1 * *',
    enabled: true,
    lastRunAt: null,
    status: 'never',
    notifications: { success: true, error: true },
  },
]

export function nextRpaId(rows: readonly Rpa[]) {
  const highest = rows.reduce((max, row) => Math.max(max, Number(row.id.replace(/\D/g, '')) || 0), 0)
  return `RPA-${String(highest + 1).padStart(3, '0')}`
}
