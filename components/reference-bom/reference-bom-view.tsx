'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, GitBranch, Link2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table/data-table'
import type { BulkAction, DataTableColumn, RowAction, SelectionContext } from '@/lib/data-table/types'
import { PageHeader } from '@/components/app/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { REFERENCE_BOM_ROWS, type BomCoverage, type ReferenceBomRow } from '@/lib/reference-bom-data'
import { ReferenceBomAssignmentDialog } from './reference-bom-assignment-dialog'

const COVERAGE_STYLES: Record<BomCoverage, string> = {
  Reference: 'border-brand/25 bg-brand-soft text-brand-deep',
  Previous: 'border-border bg-muted text-muted-foreground',
  Fake: 'border-warning/25 bg-warning-soft text-warning-foreground',
}

const COLUMNS: readonly DataTableColumn<ReferenceBomRow>[] = [
  {
    id: 'plant',
    header: 'Plant',
    accessor: 'plant',
    width: 130,
    cell: ({ row }) => <Badge variant="outline" className="h-5 border-border px-1.5 font-mono text-[10px] font-semibold tracking-wide">{row.plant}</Badge>,
  },
  { id: 'model', header: 'Model', accessor: 'model', width: 150, grow: true },
  { id: 'month', header: 'Month', accessor: 'month', width: 120 },
  { id: 'volume', header: 'Volume', accessor: 'volume', kind: 'number', width: 115, align: 'right' },
  {
    id: 'coverage',
    header: 'Coverage',
    accessor: 'coverage',
    width: 132,
    cell: ({ row }) => <Badge variant="outline" className={cn('border font-medium', COVERAGE_STYLES[row.coverage])}>{row.coverage}</Badge>,
  },
  {
    id: 'source',
    header: 'Source',
    accessor: 'source',
    width: 190,
    cell: ({ row }) => (
      <span className={cn('font-mono text-[11px]', row.coverage === 'Fake' ? 'text-warning-foreground' : 'text-muted-foreground')}>
        {row.source}
      </span>
    ),
  },
]

export function ReferenceBomView() {
  const [activeTab, setActiveTab] = useState('sop')
  const [assignmentRows, setAssignmentRows] = useState<ReferenceBomRow[]>([])

  const openAssignment = (rows: ReferenceBomRow[]) => {
    if (rows.length === 0) return
    setAssignmentRows(rows)
  }

  const rowActions: (row: ReferenceBomRow) => readonly RowAction<ReferenceBomRow>[] = useMemo(
    () => (row) => [
      {
        id: 'assign',
        label: 'Assign BOM',
        icon: <Link2 aria-hidden="true" />,
        inline: true,
        onSelect: () => openAssignment([row]),
      },
    ],
    [],
  )

  const bulkActions: readonly BulkAction<ReferenceBomRow>[] = useMemo(
    () => [
      {
        id: 'assign-selected',
        label: 'Assign BOM',
        icon: <Link2 aria-hidden="true" />,
        onSelect: (selection: SelectionContext<ReferenceBomRow>) => openAssignment(selection.rows),
      },
    ],
    [],
  )

  return (
    <>
      <PageHeader
        title="Reference BOM"
        description="Assign BOM coverage to future models found in demand that do not have an ingested BOM yet."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
        <TabsList variant="line" className="h-10 min-h-10 w-full justify-start gap-2 rounded-none border-b border-border p-0">
          <TabsTrigger value="sop" className="!h-9 flex-none gap-2 px-3">
            SOP Assignments
            <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1.5 text-[10px]">{REFERENCE_BOM_ROWS.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="sales" className="!h-9 flex-none gap-2 px-3">
            Sales Assignments
            <Badge variant="outline" className="h-5 px-1.5 text-[10px]">Next</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sop">
          <DataTable<ReferenceBomRow>
            caption="SOP BOM assignments"
            persistenceKey="reference-bom.sop"
            columns={COLUMNS}
            data={REFERENCE_BOM_ROWS}
            getRowId={(row) => row.id}
            selectable
            bulkActions={bulkActions}
            rowActions={rowActions}
            onRowClick={(row) => openAssignment([row])}
            columnPinning={false}
            densityControl
            pagination={false}
            exporter
            labels={{ searchPlaceholder: 'Search models, plants, or sources...' }}
          />
        </TabsContent>

        <TabsContent value="sales">
          <div className="flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <span className="mb-4 flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <GitBranch className="size-5" aria-hidden="true" />
            </span>
            <h2 className="text-sm font-semibold">Sales assignments are next</h2>
            <p className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">The Sales Demand assignment flow will use the same BOM coverage patterns once the SOP workflow is defined.</p>
            <Button type="button" variant="outline" size="sm" className="mt-5" onClick={() => setActiveTab('sop')}>
              Back to SOP Assignments
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <ReferenceBomAssignmentDialog open={assignmentRows.length > 0} onOpenChange={(open) => !open && setAssignmentRows([])} rows={assignmentRows} />
    </>
  )
}
