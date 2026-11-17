'use client'

import { useMemo, useState } from 'react'
import { Link2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/data-table/data-table'
import type { BulkAction, DataTableColumn, RowAction, SelectionContext } from '@/lib/data-table/types'
import { PageHeader } from '@/components/app/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { REFERENCE_BOM_ROWS, SALES_ASSIGNMENT_ROWS, type BomCoverage, type ReferenceBomRow } from '@/lib/reference-bom-data'
import { SALES_DEMAND_YEARS, type SalesDemandYear } from '@/lib/sales-demand/data'
import { YearSelector } from '@/components/sales-demand/sales-demand-view'
import { ReferenceBomAssignmentDialog } from './reference-bom-assignment-dialog'
import { SalesAssignmentsTable } from './sales-assignments-table'

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
  { id: 'month', header: 'Month', accessor: 'month', kind: 'date', dateGranularity: 'month', width: 120 },
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

// Default rule: Oct-Dec starts in the next calendar year; Jan-Sep starts in the current year.
const DEFAULT_SALES_ASSIGNMENT_YEAR: SalesDemandYear = (() => {
  const now = new Date()
  const targetYear = now.getFullYear() + (now.getMonth() >= 9 ? 1 : 0)
  const candidate = String(targetYear) as SalesDemandYear
  return SALES_DEMAND_YEARS.includes(candidate) ? candidate : SALES_DEMAND_YEARS[0]
})()

export function ReferenceBomView() {
  const [activeTab, setActiveTab] = useState('sop')
  const [sopAssignmentYear, setSopAssignmentYear] = useState<SalesDemandYear>(DEFAULT_SALES_ASSIGNMENT_YEAR)
  const [salesAssignmentYear, setSalesAssignmentYear] = useState<SalesDemandYear>(DEFAULT_SALES_ASSIGNMENT_YEAR)
  const [assignmentRows, setAssignmentRows] = useState<ReferenceBomRow[]>([])
  const visibleSopRows = useMemo(
    () => REFERENCE_BOM_ROWS.filter((row) => row.month.startsWith(`${sopAssignmentYear}-`)),
    [sopAssignmentYear],
  )

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
            <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1.5 text-[10px]">{visibleSopRows.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="sales" className="!h-9 flex-none gap-2 px-3">
            Sales Assignments
            <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1.5 text-[10px]">{SALES_ASSIGNMENT_ROWS.filter((row) => row.year === salesAssignmentYear).length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sop">
          <DataTable<ReferenceBomRow>
            caption="SOP BOM assignments"
            persistenceKey="reference-bom.sop"
            toolbarStart={<YearSelector year={sopAssignmentYear} onChange={setSopAssignmentYear} />}
            columns={COLUMNS}
            data={visibleSopRows}
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
          <SalesAssignmentsTable year={salesAssignmentYear} onYearChange={setSalesAssignmentYear} />
        </TabsContent>
      </Tabs>

      <ReferenceBomAssignmentDialog open={assignmentRows.length > 0} onOpenChange={(open) => !open && setAssignmentRows([])} rows={assignmentRows} />
    </>
  )
}
