import { DEFAULT_QUERY, type ColumnSchema, type DataTableQuery } from '@/lib/data-table/types'
import { RPA_SEED, type RpaStatus } from '@/lib/rpa/data'

export type RpaLogLevel = 'info' | 'warning' | 'error'

export type RpaLog = {
  id: string
  timestamp: string
  level: RpaLogLevel
  message: string
  durationMs: number | null
}

export type RpaLogsResource = {
  rows: RpaLog[]
  total: number
}

export const DEFAULT_RPA_LOG_QUERY: DataTableQuery = {
  ...DEFAULT_QUERY,
  pageSize: 10,
  sort: [{ id: 'timestamp', direction: 'desc' }],
}

export const RPA_LOG_LEVEL_OPTIONS = [
  { value: 'info', label: 'Info', color: 'var(--brand)' },
  { value: 'warning', label: 'Warning', color: 'var(--warning)' },
  { value: 'error', label: 'Error', color: 'var(--critical)' },
] as const

export const RPA_LOG_SCHEMA: ColumnSchema<RpaLog>[] = [
  { id: 'timestamp', header: 'Timestamp', accessor: 'timestamp', kind: 'date', searchable: false },
  { id: 'level', header: 'Level', accessor: 'level', kind: 'select', options: RPA_LOG_LEVEL_OPTIONS },
  { id: 'message', header: 'Message', accessor: 'message', kind: 'text' },
  { id: 'durationMs', header: 'Duration', accessor: 'durationMs', kind: 'number', searchable: false },
]

function finalMessage(status: RpaStatus, detail?: string) {
  if (status === 'failed') return `Run failed: ${detail ?? 'The source system did not respond.'}`
  if (status === 'warning') return `Run completed with warnings: ${detail ?? 'Some records need review.'}`
  if (status === 'running') return 'Execution is still processing the final batch.'
  return 'Run completed successfully. 1,284 records updated.'
}

export function getRpaLogs(rpaId: string): RpaLog[] {
  const rpa = RPA_SEED.find((row) => row.id === rpaId)
  if (!rpa?.lastRunAt) return []

  const startedAt = new Date(rpa.lastRunAt).getTime()
  const rows = Array.from({ length: 36 }, (_, index): RpaLog => {
    const batch = Math.floor(index / 9) + 1
    const phase = index % 9
    const isFinal = index === 35
    const message = isFinal
      ? finalMessage(rpa.status, rpa.detail)
      : phase === 0
        ? 'Execution requested by the configured schedule.'
        : phase === 1
          ? 'Service account authenticated successfully.'
          : phase === 2
            ? `Connected to ${rpa.name === 'MM Cost Audit' ? 'SAP MM' : 'SAP S/4HANA'}.`
            : phase === 3
              ? 'Plant and planning parameters loaded.'
              : phase === 4
                ? `Batch ${batch} retrieved ${420 + batch * 18} source records.`
                : phase === 5
                  ? `Batch ${batch} passed required-field validation.`
                  : phase === 6
                    ? `Batch ${batch} reconciled ${396 + batch * 16} destination records.`
                    : phase === 7
                      ? `Batch ${batch} changes committed.`
                      : 'Execution checkpoint recorded.'
    const level: RpaLogLevel = isFinal
      ? rpa.status === 'failed'
        ? 'error'
        : rpa.status === 'warning'
          ? 'warning'
          : 'info'
      : 'info'

    return {
      id: `${rpaId}-${String(index + 1).padStart(3, '0')}`,
      timestamp: new Date(startedAt + index * 45_000).toISOString(),
      level,
      message,
      durationMs: phase === 7 ? 640 + batch * 135 : isFinal && rpa.status === 'success' ? 2840 : null,
    }
  })

  return rows
}
