'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { DataTable } from '@/components/data-table/data-table'
import { PageHeader } from '@/components/app/page-header'
import { Button } from '@/components/ui/button'
import type { DataTableColumnDefinition } from '@/lib/data-table/types'

type DemoRow = {
  id: string
  model: string
  status: string
  w01: number
  w02: number
  w03: number
  w04: number
  w05: number
  w06: number
  w07: number
  w08: number
  total: number
}

const DEMO_ROWS: DemoRow[] = [
  { id: 'alpha', model: 'Alpha line', status: 'Ready', w01: 420, w02: 480, w03: 510, w04: 540, w05: 575, w06: 590, w07: 620, w08: 640, total: 4375 },
  { id: 'bravo', model: 'Bravo line', status: 'In progress', w01: 280, w02: 310, w03: 360, w04: 390, w05: 420, w06: 440, w07: 465, w08: 490, total: 3155 },
  { id: 'charlie', model: 'Charlie line', status: 'Ready', w01: 180, w02: 220, w03: 235, w04: 250, w05: 270, w06: 290, w07: 305, w08: 320, total: 2070 },
  { id: 'delta', model: 'Delta line', status: 'Review', w01: 120, w02: 160, w03: 175, w04: 190, w05: 210, w06: 225, w07: 240, w08: 260, total: 1580 },
]

const number = new Intl.NumberFormat('en-US')
const weekColumns = ['w01', 'w02', 'w03', 'w04', 'w05', 'w06', 'w07', 'w08'] as const

const COLUMNS: DataTableColumnDefinition<DemoRow>[] = [
  { id: 'model', header: 'Model', width: 180, minWidth: 160, pin: 'left', grow: true },
  { id: 'status', header: 'Status', width: 130, minWidth: 120, pin: 'left' },
  ...weekColumns.map((id, index) => ({
    id,
    header: `W${String(index + 1).padStart(2, '0')}`,
    width: 120,
    minWidth: 108,
    align: 'right' as const,
    cell: ({ value }: { value: unknown }) => number.format(Number(value)),
  })),
  {
    id: 'total',
    header: 'Total',
    width: 132,
    minWidth: 120,
    pin: 'right' as const,
    align: 'right' as const,
    cell: ({ value }: { value: unknown }) => number.format(Number(value)),
  },
]

type TableMode = 'ready' | 'loading' | 'empty' | 'error'

export function DataTableLoadingTestView() {
  const [mode, setMode] = useState<TableMode>('ready')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rows = useMemo(() => (mode === 'empty' || mode === 'error' ? [] : DEMO_ROWS), [mode])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const startLoading = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMode('loading')
    timerRef.current = setTimeout(() => setMode('ready'), 2400)
  }

  return (
    <>
      <PageHeader
        title="DataTable states"
        description="A small playground for checking loading, error, empty, and horizontal table states."
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant={mode === 'ready' ? 'default' : 'outline'} onClick={() => setMode('ready')}>
            Loaded rows
          </Button>
          <Button type="button" variant={mode === 'loading' ? 'default' : 'outline'} onClick={startLoading}>
            Test loading
          </Button>
          <Button type="button" variant={mode === 'empty' ? 'default' : 'outline'} onClick={() => setMode('empty')}>
            Empty state
          </Button>
          <Button type="button" variant={mode === 'error' ? 'default' : 'outline'} onClick={() => setMode('error')}>
            Error state
          </Button>
        </div>
      </PageHeader>

      <section className="flex flex-col gap-3" aria-label="DataTable state test">
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-card px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[13px] font-semibold">Current state</p>
            <p className="text-[12px] text-muted-foreground">Loading automatically returns to loaded rows after 2.4 seconds.</p>
          </div>
          <span className="rounded-md bg-brand-soft px-2.5 py-1 text-[11px] font-semibold tracking-wide text-brand uppercase">
            {mode}
          </span>
        </div>
        <DataTable<DemoRow>
          caption="DataTable loading and empty state test"
          persistenceKey="data-table-loading-test"
          bordered
          columns={COLUMNS}
          data={rows}
          loading={mode === 'loading'}
          error={mode === 'error' ? 'The data request failed. Check your connection and try again.' : null}
          onRetry={() => setMode('ready')}
          getRowId={(row) => row.id}
          maxHeight="min(68dvh, 640px)"
        />
      </section>
    </>
  )
}
