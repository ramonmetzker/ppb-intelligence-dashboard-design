'use client'

import { useEffect, useMemo, useState } from 'react'
import { GitBranch, Link2, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table/data-table'
import type { BulkAction, DataTableColumn, RowAction, SelectionContext } from '@/lib/data-table/types'
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
import { PopConfirm } from '@/components/pop-confirm'
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

type SplitDraft = {
  id: string
  newModel: string
  division: number
}

function SalesSplitDialog({ row, open, onOpenChange, onSave }: { row: SalesAssignmentRow | null; open: boolean; onOpenChange: (open: boolean) => void; onSave: (parentId: string, drafts: SplitDraft[]) => void }) {
  const [drafts, setDrafts] = useState<SplitDraft[]>([])

  useEffect(() => {
    if (!row || !open) return
    setDrafts(
      row.children?.map((child) => ({ id: child.id, newModel: child.newModel, division: child.division })) ?? [
        { id: `${row.id}-128`, newModel: `${row.originalModel} 128GB`, division: 50 },
        { id: `${row.id}-256`, newModel: `${row.originalModel} 256GB`, division: 50 },
      ],
    )
  }, [open, row])

  const canSave = drafts.length >= 2 && drafts.every((draft) => draft.newModel.trim().length > 0)

  const updateDraft = (id: string, patch: Partial<SplitDraft>) => {
    setDrafts((current) => current.map((draft) => (draft.id === id ? { ...draft, ...patch } : draft)))
  }

  const updateDivision = (id: string, value: number) => {
    setDrafts((current) => {
      const others = current.filter((draft) => draft.id !== id)
      if (others.length === 0) return current.map((draft) => (draft.id === id ? { ...draft, division: 100 } : draft))

      const remainder = 100 - value
      const base = Math.floor(remainder / (others.length * 5)) * 5
      const extraUnits = (remainder - base * others.length) / 5
      let otherIndex = 0

      return current.map((draft) => {
        if (draft.id === id) return { ...draft, division: value }
        const division = base + (otherIndex++ < extraUnits ? 5 : 0)
        return { ...draft, division }
      })
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:!max-w-2xl">
        <DialogHeader className="border-b border-border bg-muted/25 px-6 py-4 pr-14">
          <DialogTitle>Split sales model</DialogTitle>
          <DialogDescription className="mt-1">
            Create submodels for {row?.originalModel ?? 'this model'} and divide its Sales Demand volume.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="mb-2 grid grid-cols-[minmax(0,1fr)_8.5rem_7rem_2rem] items-center gap-3 px-3 text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
            <span>New Model</span>
            <span className="text-right">Division</span>
            <span className="text-right">Volume</span>
            <span />
          </div>
          <div className="divide-y divide-border rounded-xl border border-border">
            {drafts.map((draft) => (
              <div key={draft.id} className="grid grid-cols-[minmax(0,1fr)_8.5rem_7rem_2rem] items-center gap-3 px-3 py-2.5">
                <label className="min-w-0">
                  <span className="sr-only">Submodel name</span>
                  <input
                    value={draft.newModel}
                    onChange={(event) => updateDraft(draft.id, { newModel: event.target.value })}
                    className="h-8 w-full min-w-0 rounded-md border border-input bg-background px-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </label>
                <label className="flex items-center justify-end gap-2">
                  <span className="sr-only">{draft.newModel} division percentage</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={draft.division}
                    onChange={(event) => updateDivision(draft.id, Number(event.target.value))}
                    className="h-1.5 w-16 shrink-0 cursor-pointer accent-primary"
                  />
                  <span className="tnum w-9 whitespace-nowrap text-right text-[12px] font-semibold">{draft.division}%</span>
                </label>
                <span className="tnum whitespace-nowrap text-right text-[12px] text-muted-foreground">{Math.round((row?.totalVolume ?? 0) * draft.division / 100).toLocaleString('en-US')}</span>
                <PopConfirm
                  trigger={
                    <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${draft.newModel}`} className="size-8 text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </Button>
                  }
                  title={`Remove ${draft.newModel}?`}
                  description="This submodel will be removed from the split."
                  confirmLabel="Remove"
                  onConfirm={() => setDrafts((current) => current.filter((item) => item.id !== draft.id))}
                />
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setDrafts((current) => [...current, { id: `${row?.id ?? 'submodel'}-${current.length + 1}`, newModel: `${row?.originalModel ?? 'Model'} ${current.length + 1}`, division: 0 }])}>
            <Plus data-icon="inline-start" aria-hidden="true" />
            Add submodel
          </Button>
        </div>

        <DialogFooter className="!mx-0 !mb-0 items-center rounded-none border-t border-border !px-6 !py-3 sm:!justify-between">
          <p className="hidden text-xs text-muted-foreground sm:block">Adjust one slider to rebalance the others automatically.</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="button" disabled={!canSave} onClick={() => row && onSave(row.id, drafts)}>Save split</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SalesAssignmentsTable() {
  const [salesRows, setSalesRows] = useState<SalesAssignmentRow[]>(() => SALES_ASSIGNMENT_ROWS.map((row) => ({ ...row })))
  const [assignmentRows, setAssignmentRows] = useState<ReferenceBomRow[]>([])
  const [splitRow, setSplitRow] = useState<SalesAssignmentRow | null>(null)

  const rowActions = useMemo(
    () => (row: SalesAssignmentRow): readonly RowAction<SalesAssignmentRow>[] => {
      if (row.children?.length) {
        return [{ id: 'split', label: 'Manage split', icon: <GitBranch aria-hidden="true" />, inline: true, onSelect: () => setSplitRow(row) }]
      }
      if (row.parentId) {
        return [{ id: 'assign', label: 'Assign BOM', icon: <Link2 aria-hidden="true" />, inline: true, onSelect: () => setAssignmentRows([toAssignmentRow(row)]) }]
      }
      const actions: RowAction<SalesAssignmentRow>[] = [
        { id: 'split', label: 'Split model', icon: <GitBranch aria-hidden="true" />, inline: true, onSelect: () => setSplitRow(row) },
      ]
      if (row.parentId || !row.children?.length) {
        actions.push({ id: 'assign', label: 'Assign BOM', icon: <Link2 aria-hidden="true" />, inline: true, onSelect: () => setAssignmentRows([toAssignmentRow(row)]) })
      }
      return actions
    },
    [],
  )

  const bulkActions = useMemo<readonly BulkAction<SalesAssignmentRow>[]>(
    () => [
      {
        id: 'assign-selected',
        label: 'Assign BOM',
        icon: <Link2 aria-hidden="true" />,
        disabled: (selection) => selection.rows.every((row) => Boolean(row.children?.length)),
        onSelect: (selection: SelectionContext<SalesAssignmentRow>) => {
          setAssignmentRows(selection.rows.filter((row) => !row.children?.length).map(toAssignmentRow))
        },
      },
    ],
    [],
  )

  const saveSplit = (parentId: string, drafts: SplitDraft[]) => {
    setSalesRows((current) => current.map((row) => {
      if (row.id !== parentId) return row
      const children = drafts.map((draft) => ({
        id: draft.id,
        parentId: row.id,
        originalModel: row.originalModel,
        newModel: draft.newModel.trim(),
        referenceBom: 'Unassigned',
        division: draft.division,
        totalVolume: Math.round(row.totalVolume * draft.division / 100),
      }))
      return { ...row, newModel: `${children.length} submodels`, referenceBom: 'Assign per child', division: 100, children }
    }))
    setSplitRow(null)
  }

  return (
    <>
      <DataTable<SalesAssignmentRow>
        caption="Sales BOM assignments"
        persistenceKey="reference-bom.sales"
        columns={SALES_COLUMNS}
        data={salesRows}
        getRowId={(row) => row.id}
        getRowChildren={getSalesChildren}
        defaultExpanded
        selectable
        bulkActions={bulkActions}
        rowActions={rowActions}
        columnPinning={false}
        densityControl
        pagination={false}
        exporter
        labels={{ searchPlaceholder: 'Search sales models or BOMs...' }}
      />

      <SalesSplitDialog row={splitRow} open={Boolean(splitRow)} onOpenChange={(open) => !open && setSplitRow(null)} onSave={saveSplit} />
      <ReferenceBomAssignmentDialog open={assignmentRows.length > 0} onOpenChange={(open) => !open && setAssignmentRows([])} rows={assignmentRows} />
    </>
  )
}
