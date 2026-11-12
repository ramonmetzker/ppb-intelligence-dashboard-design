'use client'

import { useEffect, useMemo, useState } from 'react'
import { GitBranch, Link2, PencilLine } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table/data-table'
import type { DataTableColumn, RowAction } from '@/lib/data-table/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  SALES_ASSIGNMENT_ROWS,
  type ReferenceBomRow,
  type SalesAssignmentRow,
} from '@/lib/reference-bom-data'
import { ReferenceBomAssignmentDialog } from './reference-bom-assignment-dialog'

const getSalesChildren = (row: SalesAssignmentRow) => row.children ?? []

const SALES_COLUMNS: readonly DataTableColumn<SalesAssignmentRow>[] = [
  {
    id: 'originalModel',
    header: 'Original Model',
    accessor: 'originalModel',
    width: 165,
  },
  {
    id: 'newModel',
    header: 'New Model',
    accessor: 'newModel',
    width: 210,
    grow: true,
    cell: ({ row }) => (
      <span className={cn(row.children?.length ? 'font-medium text-muted-foreground' : 'font-medium')}>
        {row.newModel}
      </span>
    ),
  },
  {
    id: 'referenceBom',
    header: 'Reference BOM',
    accessor: 'referenceBom',
    width: 205,
    cell: ({ row }) => {
      const isParent = Boolean(row.children?.length)
      const isFake = row.referenceBom === 'Fake BOM'
      return (
        <Badge
          variant="outline"
          className={cn(
            'font-mono text-[10px]',
            isParent && 'border-border bg-muted text-muted-foreground',
            isFake && 'border-warning/25 bg-warning-soft text-warning-foreground',
          )}
        >
          {row.referenceBom}
        </Badge>
      )
    },
  },
  {
    id: 'division',
    header: 'Division',
    accessor: 'division',
    width: 150,
    align: 'right',
    cell: ({ row }) => (
      <Badge variant={row.children?.length ? 'secondary' : 'outline'} className="tnum min-w-14 justify-center font-semibold">
        {row.division}%
      </Badge>
    ),
  },
  {
    id: 'totalVolume',
    header: 'Total Volume',
    accessor: 'totalVolume',
    kind: 'number',
    width: 160,
    align: 'right',
  },
]

function toAssignmentRow(row: SalesAssignmentRow): ReferenceBomRow {
  return {
    id: row.id,
    plant: 'P81M',
    model: row.newModel,
    month: 'Sales Demand',
    volume: row.totalVolume,
    coverage: row.referenceBom === 'Fake BOM' ? 'Fake' : 'Reference',
    source: row.referenceBom,
  }
}

function SalesSplitDialog({ row, open, onOpenChange }: { row: SalesAssignmentRow | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const children = row?.children ?? []
  const [divisions, setDivisions] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!row || !open) return
    setDivisions(Object.fromEntries(children.map((child) => [child.id, child.division])))
  }, [children, open, row])

  const totalDivision = children.reduce((sum, child) => sum + (divisions[child.id] ?? child.division), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:!max-w-2xl">
        <DialogHeader className="border-b border-border bg-muted/25 px-6 py-4 pr-14">
          <DialogTitle>Manage submodels</DialogTitle>
          <DialogDescription className="mt-1">
            Divide the Sales Demand volume for {row?.originalModel ?? 'this model'} across its submodels.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="mb-2 grid grid-cols-[minmax(0,1fr)_7rem_7rem] items-center gap-3 px-3 text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
            <span>New Model</span>
            <span className="text-right">Division</span>
            <span className="text-right">Volume</span>
          </div>
          <div className="divide-y divide-border rounded-xl border border-border">
            {children.map((child) => {
              const division = divisions[child.id] ?? child.division
              return (
                <div key={child.id} className="grid grid-cols-[minmax(0,1fr)_7rem_7rem] items-center gap-3 px-3 py-3">
                  <span className="truncate text-[13px] font-medium">{child.newModel}</span>
                  <label className="flex items-center justify-end gap-2">
                    <span className="sr-only">{child.newModel} division percentage</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={division}
                      onChange={(event) => setDivisions((current) => ({ ...current, [child.id]: Number(event.target.value) }))}
                      className="h-1.5 w-16 shrink-0 cursor-pointer accent-primary"
                    />
                    <span className="tnum w-9 whitespace-nowrap text-right text-[12px] font-semibold">{division}%</span>
                  </label>
                  <span className="tnum whitespace-nowrap text-right text-[12px] text-muted-foreground">{Math.round(child.totalVolume * division / child.division).toLocaleString('en-US')}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Total division</span>
            <span className={cn('tnum font-semibold', totalDivision === 100 ? 'text-brand-deep' : 'text-warning-foreground')}>{totalDivision}%</span>
          </div>
        </div>

        <DialogFooter className="!mx-0 !mb-0 items-center rounded-none border-t border-border !px-6 !py-3 sm:!justify-between">
          <p className="hidden text-xs text-muted-foreground sm:block">Mock split editor · no data will be changed</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="button" onClick={() => onOpenChange(false)}>Save split</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SalesAssignmentsTable() {
  const [assignmentRow, setAssignmentRow] = useState<ReferenceBomRow | null>(null)
  const [splitRow, setSplitRow] = useState<SalesAssignmentRow | null>(null)

  const rowActions = useMemo(
    () => (row: SalesAssignmentRow): readonly RowAction<SalesAssignmentRow>[] => {
      if (row.children?.length) {
        return [{ id: 'split', label: 'Manage split', icon: <GitBranch aria-hidden="true" />, inline: true, onSelect: () => setSplitRow(row) }]
      }
      return [{ id: 'assign', label: 'Assign BOM', icon: <Link2 aria-hidden="true" />, inline: true, onSelect: () => setAssignmentRow(toAssignmentRow(row)) }]
    },
    [],
  )

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/25 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <GitBranch className="size-4 shrink-0 text-brand" aria-hidden="true" />
          <p className="truncate text-xs text-muted-foreground">Expand a sales model to review and assign BOMs to its submodels.</p>
        </div>
        <Badge variant="secondary" className="shrink-0">{SALES_ASSIGNMENT_ROWS.length} models</Badge>
      </div>

      <DataTable<SalesAssignmentRow>
        caption="Sales BOM assignments"
        persistenceKey="reference-bom.sales"
        columns={SALES_COLUMNS}
        data={SALES_ASSIGNMENT_ROWS}
        getRowId={(row) => row.id}
        getRowChildren={getSalesChildren}
        defaultExpanded
        rowActions={rowActions}
        columnPinning={false}
        densityControl
        pagination={false}
        exporter
        labels={{ searchPlaceholder: 'Search sales models or BOMs...' }}
      />

      <SalesSplitDialog row={splitRow} open={Boolean(splitRow)} onOpenChange={(open) => !open && setSplitRow(null)} />
      <ReferenceBomAssignmentDialog open={Boolean(assignmentRow)} onOpenChange={(open) => !open && setAssignmentRow(null)} rows={assignmentRow ? [assignmentRow] : []} />
    </>
  )
}
