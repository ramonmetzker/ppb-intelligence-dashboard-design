'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, CircleX, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/app/page-header'
import { DataTable } from '@/components/data-table/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { BulkAction, DataTableColumn, DataTableQuery, RowAction } from '@/lib/data-table/types'
import {
  CONSTRAINT_YEARS,
  MATERIAL_CONSTRAINT_SEED,
  dateConstraintLabel,
  materialConstraintLabel,
  type ConstraintYear,
  type MaterialConstraint,
  type MaterialConstraintFormValues,
} from '@/lib/constraints/data'
import { MATERIAL_PRICE_ROWS } from '@/lib/material-price-data'
import { MaterialConstraintFormDialog } from './material-constraint-form-dialog'

const DEFAULT_QUERY: DataTableQuery = {
  page: 1,
  pageSize: 10,
  sort: [{ id: 'partNumber', direction: 'asc' }],
  filters: [],
  search: '',
}

const MATERIAL_DETAILS = new Map(MATERIAL_PRICE_ROWS.map((row) => [row.partNumber, `${row.description} · ${row.spec}`]))

function YearSelector({ year, onChange }: { year: ConstraintYear; onChange: (year: ConstraintYear) => void }) {
  const index = CONSTRAINT_YEARS.indexOf(year)
  const canGoPrevious = index < CONSTRAINT_YEARS.length - 1
  const canGoNext = index > 0

  return (
    <div className="flex h-9 shrink-0 items-stretch overflow-hidden rounded-lg border border-input bg-card" aria-label="Year filter">
      <Button type="button" variant="ghost" size="icon" className="h-full w-9 rounded-none" disabled={!canGoPrevious} aria-label="Previous year" onClick={() => canGoPrevious && onChange(CONSTRAINT_YEARS[index + 1])}>
        <span aria-hidden="true">‹</span>
      </Button>
      <input
        type="number"
        inputMode="numeric"
        min={CONSTRAINT_YEARS[CONSTRAINT_YEARS.length - 1]}
        max={CONSTRAINT_YEARS[0]}
        step="1"
        value={year}
        aria-label="Year filter"
        onChange={(event) => {
          const next = event.target.value as ConstraintYear
          if (CONSTRAINT_YEARS.includes(next)) onChange(next)
        }}
        className="tnum h-full w-16 appearance-none border-x border-input bg-transparent px-1 text-center text-[13px] font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button type="button" variant="ghost" size="icon" className="h-full w-9 rounded-none" disabled={!canGoNext} aria-label="Next year" onClick={() => canGoNext && onChange(CONSTRAINT_YEARS[index - 1])}>
        <span aria-hidden="true">›</span>
      </Button>
    </div>
  )
}

function ActiveBadge({ value }: { value: 'Y' | 'N' }) {
  const active = value === 'Y'
  return <Badge variant={active ? 'secondary' : 'outline'} className="gap-1.5">{active ? <CheckCircle2 aria-hidden="true" /> : <CircleX aria-hidden="true" />}{active ? 'Active' : 'Inactive'}</Badge>
}

const COLUMNS: readonly DataTableColumn<MaterialConstraint>[] = [
  {
    id: 'partNumber',
    header: 'Part Number',
    accessor: (row) => row.partNumber,
    searchText: (row) => `${row.partNumber} ${MATERIAL_DETAILS.get(row.partNumber) ?? ''}`,
    width: 260,
    grow: true,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-mono text-xs font-medium">{row.partNumber}</span>
        <span className="text-xs text-muted-foreground">{MATERIAL_DETAILS.get(row.partNumber) ?? 'Part number not in current price list'}</span>
      </div>
    ),
  },
  {
    id: 'volume',
    header: 'Volume',
    accessor: materialConstraintLabel,
    searchText: materialConstraintLabel,
    width: 220,
    cell: ({ row }) => <Badge variant={row.volumeType === 'No limit' ? 'outline' : 'secondary'} className="font-mono text-[10px]">{materialConstraintLabel(row)}</Badge>,
  },
  {
    id: 'date',
    header: 'Date',
    accessor: dateConstraintLabel,
    searchText: dateConstraintLabel,
    width: 220,
    cell: ({ row }) => <span className="text-muted-foreground">{dateConstraintLabel(row)}</span>,
  },
  {
    id: 'active',
    header: 'Active',
    accessor: (row) => row.active === 'Y',
    kind: 'boolean',
    width: 150,
    align: 'center',
    cell: ({ row }) => <ActiveBadge value={row.active} />,
  },
]

export function ConstraintsView() {
  const [constraints, setConstraints] = useState<MaterialConstraint[]>([...MATERIAL_CONSTRAINT_SEED])
  const [year, setYear] = useState<ConstraintYear>(CONSTRAINT_YEARS[0])
  const [query, setQuery] = useState<DataTableQuery>(DEFAULT_QUERY)
  const [editing, setEditing] = useState<MaterialConstraint | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const visibleConstraints = useMemo(() => constraints.filter((constraint) => constraint.year === year), [constraints, year])

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (constraint: MaterialConstraint) => {
    setEditing(constraint)
    setFormOpen(true)
  }

  const saveConstraint = (values: MaterialConstraintFormValues) => {
    if (editing) {
      setConstraints((current) => current.map((constraint) => constraint.id === editing.id ? { ...constraint, ...values } : constraint))
      return
    }
    setConstraints((current) => [...current, { id: `material-constraint-${Date.now()}`, year, ...values }])
  }

  const removeConstraints = (ids: readonly string[]) => {
    setConstraints((current) => current.filter((constraint) => !ids.includes(constraint.id)))
  }

  const rowActions: RowAction<MaterialConstraint>[] = [
    { id: 'edit', label: 'Edit', icon: <Pencil aria-hidden="true" />, inline: true, onSelect: openEdit },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 aria-hidden="true" />,
      tone: 'destructive',
      separatorBefore: true,
      confirm: { title: 'Delete material constraint?', description: 'This rule will be removed from the selected year.' },
      onSelect: (constraint) => removeConstraints([constraint.id]),
    },
  ]

  const bulkActions: BulkAction<MaterialConstraint>[] = [{
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 aria-hidden="true" />,
    tone: 'destructive',
    confirm: (context) => ({ title: `Delete ${context.count} material constraints?`, description: 'This action cannot be undone.' }),
    onSelect: ({ ids }) => removeConstraints(ids),
  }]

  return (
    <>
      <PageHeader title="Constraints" description="Define the purchasing limits that simulations must respect.">
        <Button size="lg" onClick={openCreate}><Plus aria-hidden="true" data-icon="inline-start" />New constraint</Button>
      </PageHeader>

      <Tabs defaultValue="material" className="gap-3">
        <TabsList variant="line">
          <TabsTrigger value="material">Part Number <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1.5 text-[10px]">{visibleConstraints.length}</Badge></TabsTrigger>
          <TabsTrigger value="future" disabled>Other constraints</TabsTrigger>
        </TabsList>
        <TabsContent value="material">
          <DataTable<MaterialConstraint>
            caption="Material constraints"
            persistenceKey="material-constraints-v2"
            columns={COLUMNS}
            data={visibleConstraints}
            getRowId={(row) => row.id}
            query={query}
            onQueryChange={setQuery}
            toolbarStart={<YearSelector year={year} onChange={setYear} />}
            selectable
            bulkActions={bulkActions}
            rowActions={rowActions}
            onRowClick={openEdit}
            columnPinning={false}
            densityControl
            pagination={false}
            emptyState={<div className="flex flex-col items-center gap-1 px-6 py-12 text-center"><p className="font-medium text-foreground">No constraints for {year}</p><p className="text-sm text-muted-foreground">Create a material rule to limit this year&apos;s simulations.</p></div>}
          />
        </TabsContent>
        <TabsContent value="future" />
      </Tabs>

      <MaterialConstraintFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        constraint={editing}
        year={year}
        constraints={constraints}
        onSubmit={saveConstraint}
      />
    </>
  )
}
