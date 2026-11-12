'use client'

import { useMemo, useState } from 'react'
import { ArrowRight, GitBranch, Link2, PackageCheck } from 'lucide-react'
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
  { id: 'plant', header: 'Plant', accessor: 'plant', width: 130 },
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

  const referenceCount = REFERENCE_BOM_ROWS.filter((row) => row.coverage === 'Reference').length
  const fakeCount = REFERENCE_BOM_ROWS.filter((row) => row.coverage === 'Fake').length
  const totalVolume = REFERENCE_BOM_ROWS.reduce((sum, row) => sum + row.volume, 0)

  return (
    <>
      <PageHeader
        title="Reference BOM"
        description="Assign BOM coverage to future models found in demand that do not have an ingested BOM yet."
      />

      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-deep">
            <PackageCheck className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold">Coverage queue ready for review</p>
            <p className="truncate text-xs text-muted-foreground">{REFERENCE_BOM_ROWS.length} models · {totalVolume.toLocaleString('en-US')} planned units · mock data</p>
          </div>
        </div>
        <div className="flex items-center gap-4 pl-12 text-xs sm:pl-0">
          <span className="flex items-center gap-1.5 text-muted-foreground"><span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />{referenceCount} reference</span>
          <span className="flex items-center gap-1.5 text-muted-foreground"><span className="size-1.5 rounded-full bg-warning" aria-hidden="true" />{fakeCount} fake</span>
        </div>
      </div>

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
            densityControl={false}
            pagination={false}
            exporter={false}
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
