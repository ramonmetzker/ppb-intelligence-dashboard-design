'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageActions } from '@/components/app/page-actions'
import { YesNoBadge } from '@/components/app/yes-no-badge'
import { PageHeader } from '@/components/app/page-header'
import { DataTable } from '@/components/data-table/data-table'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DEFAULT_QUERY,
  type BulkAction,
  type DataTableColumn,
  type DataTableColumnDefinition,
  type DataTableQuery,
  type RowAction,
} from '@/lib/data-table/types'
import {
  annualScoreFor,
  PRODUCT_SCHEMA,
  PRODUCT_SCORE_YEARS,
  type Product,
  type ProductScoreYear,
} from '@/lib/products/data'
import { PlantTags } from './plant-tags'
import { ProductFormDialog, type ProductFormValues } from './product-form-dialog'
import { ProductIcon } from './product-icon'
import { useProducts } from './products-provider'

const schemaById = new Map(PRODUCT_SCHEMA.map((schema) => [schema.id, schema]))
const base = (id: keyof Product) => schemaById.get(id)!

const COLUMNS: DataTableColumn<Product>[] = [
  {
    ...base('icon'),
    width: 76,
    minWidth: 76,
    hideable: false,
    sortable: false,
    cell: ({ row }) => (
      <span className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <ProductIcon icon={row.icon} slug={row.product_slug} className="size-4" />
      </span>
    ),
  },
  {
    ...base('product_name'),
    width: 220,
    pin: 'left',
    hideable: false,
    cell: ({ row }) => <span className="font-medium">{row.product_name}</span>,
  },
  { ...base('product_slug'), width: 190, cell: ({ row }) => <span className="font-mono text-xs">{row.product_slug}</span> },
  { ...base('product_code'), width: 140, cell: ({ row }) => <span className="font-mono text-xs">{row.product_code}</span> },
  { ...base('order'), width: 84, align: 'center', cell: ({ row }) => <span className="tnum font-medium">{row.order}</span> },
  {
    ...base('plants'),
    width: 320,
    grow: true,
    sortable: false,
    description: 'Comma separated in the source data, shown here as one tag per plant.',
    cell: ({ row }) => <PlantTags value={row.plants} max={4} />,
  },
  {
    ...base('active_yn'),
    width: 100,
    align: 'center',
    cell: ({ row }) => <YesNoBadge value={row.active_yn} />,
  },
]

const DEFAULT_PRODUCT_QUERY: DataTableQuery = { ...DEFAULT_QUERY, sort: [{ id: 'order', direction: 'asc' }] }
const DEFAULT_SCORE_QUERY: DataTableQuery = { ...DEFAULT_QUERY, sort: [{ id: 'product_name', direction: 'asc' }] }

type AnnualScoreRow = Product & {
  annual_score: number
  score_type: 'quota' | 'points'
  year: ProductScoreYear
}

const ANNUAL_SCORE_COLUMNS: DataTableColumnDefinition<AnnualScoreRow>[] = [
  {
    id: 'product_name',
    header: 'Product',
    kind: 'text',
    width: 240,
    pin: 'left',
    grow: true,
    cell: ({ row }) => <span className="font-medium">{row.product_name}</span>,
  },
  {
    id: 'annual_score',
    header: 'Annual Score',
    kind: 'number',
    width: 160,
    align: 'right',
    cell: ({ row }) => <span className="tnum font-medium">{row.annual_score}</span>,
  },
  {
    id: 'score_type',
    header: 'Score Type',
    kind: 'select',
    width: 150,
    options: [
      { value: 'quota', label: 'quota' },
      { value: 'points', label: 'points' },
    ],
    cell: ({ row }) => <span className="font-mono text-xs lowercase">{row.score_type}</span>,
  },
  {
    id: 'year',
    header: 'Year',
    kind: 'number',
    width: 110,
    align: 'center',
    cell: ({ row }) => <span className="tnum">{row.year}</span>,
  },
]

function YearSelector({ year, onChange }: { year: ProductScoreYear; onChange: (year: ProductScoreYear) => void }) {
  const yearOptions = [...PRODUCT_SCORE_YEARS].map(Number).sort((a, b) => a - b)
  const numericYear = Number(year)
  const yearIndex = yearOptions.indexOf(numericYear)
  const canGoPrevious = yearIndex > 0
  const canGoNext = yearIndex >= 0 && yearIndex < yearOptions.length - 1

  return (
    <div className="flex h-9 shrink-0 items-stretch overflow-hidden rounded-lg border border-input bg-card" aria-label="Year filter">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-full w-9 rounded-none"
        disabled={!canGoPrevious}
        aria-label="Previous year"
        onClick={() => canGoPrevious && onChange(String(yearOptions[yearIndex - 1]) as ProductScoreYear)}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <input
        type="number"
        inputMode="numeric"
        min={yearOptions[0]}
        max={yearOptions[yearOptions.length - 1]}
        step="1"
        value={year}
        aria-label="Year filter"
        onChange={(event) => {
          const next = event.target.value
          if (PRODUCT_SCORE_YEARS.includes(next as ProductScoreYear)) onChange(next as ProductScoreYear)
        }}
        className="tnum h-full w-16 appearance-none border-x border-input bg-transparent px-1 text-center text-[13px] font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-full w-9 rounded-none"
        disabled={!canGoNext}
        aria-label="Next year"
        onClick={() => canGoNext && onChange(String(yearOptions[yearIndex + 1]) as ProductScoreYear)}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  )
}

export function ProductsView() {
  const { products, setProducts, gbm } = useProducts()
  const [tab, setTab] = useState<'products' | 'annual-score'>('products')
  const [year, setYear] = useState<ProductScoreYear>(PRODUCT_SCORE_YEARS[0])
  const [productQuery, setProductQuery] = useState<DataTableQuery>(DEFAULT_PRODUCT_QUERY)
  const [scoreQuery, setScoreQuery] = useState<DataTableQuery>(DEFAULT_SCORE_QUERY)
  const [editing, setEditing] = useState<Product | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const rows = useMemo(() => products.filter((product) => product.gbm === gbm), [products, gbm])
  const annualScoreRows = useMemo<AnnualScoreRow[]>(
    () => rows.map((product) => ({ ...product, ...annualScoreFor(product.product_slug, year) })),
    [rows, year],
  )

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }
  const openEdit = (product: Product) => {
    setEditing(product)
    setFormOpen(true)
  }
  const remove = (slugs: string[]) => setProducts((current) => current.filter((product) => !slugs.includes(product.product_slug)))

  const submit = (values: ProductFormValues) => {
    const now = new Date().toISOString()
    setProducts((current) =>
      editing
        ? current.map((product) =>
            product.product_slug === editing.product_slug ? { ...product, ...values, updated_at: now } : product,
          )
        : [
            ...current,
            {
              ...values,
              order: current.filter((product) => product.gbm === gbm).length + 1,
              gbm,
              created_at: now,
              updated_at: now,
            },
          ],
    )
  }

  const rowActions: RowAction<Product>[] = [
    { id: 'edit', label: 'Edit', icon: <Pencil aria-hidden="true" />, inline: true, onSelect: openEdit },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 aria-hidden="true" />,
      tone: 'destructive',
      separatorBefore: true,
      confirm: {
        title: 'Delete product?',
        description: 'This product will be removed from the current list.',
      },
      onSelect: (product) => remove([product.product_slug]),
    },
  ]

  const bulkActions: BulkAction<Product>[] = [
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 aria-hidden="true" />,
      tone: 'destructive',
      confirm: (context) => ({
        title: `Delete ${context.count} products?`,
        description: 'This action cannot be undone.',
      }),
      onSelect: ({ ids }) => remove(ids),
    },
  ]

  return (
    <>
      <PageHeader
        title="Products"
        description={`Product master data from the ${gbm} GBM database contract: slug, name, code, plants, icon and status.`}
      >
        <PageActions
          primary={
            <Button size="lg" onClick={openCreate}>
              <Plus aria-hidden="true" data-icon="inline-start" />
              New product
            </Button>
          }
        />
      </PageHeader>

      <Tabs
        value={tab}
        onValueChange={(value) => value && setTab(value as 'products' | 'annual-score')}
        className="min-h-0"
      >
        <TabsList variant="line" aria-label="Product views">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="annual-score">Annual Score</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4 min-h-0">
          <DataTable<Product>
            key={gbm}
            caption={`${gbm} products`}
            persistenceKey={`products.v2.${gbm}`}
            columns={COLUMNS}
            data={rows}
            getRowId={(row) => row.product_slug}
            query={productQuery}
            onQueryChange={setProductQuery}
            selectable
            bulkActions={bulkActions}
            rowActions={rowActions}
            onRowClick={openEdit}
            columnPinning={false}
            densityControl
            pagination={false}
          />
        </TabsContent>

        <TabsContent value="annual-score" className="mt-4 min-h-0">
          <DataTable<AnnualScoreRow>
            key={`${gbm}-${year}`}
            caption={`${gbm} annual scores for ${year}`}
            persistenceKey={`products.annual-score.${gbm}`}
            columns={ANNUAL_SCORE_COLUMNS}
            data={annualScoreRows}
            getRowId={(row) => row.product_slug}
            query={scoreQuery}
            onQueryChange={setScoreQuery}
            toolbarStart={<YearSelector year={year} onChange={setYear} />}
            columnPinning={false}
            densityControl
            pagination={false}
          />
        </TabsContent>
      </Tabs>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        gbm={gbm}
        products={products}
        onSubmit={submit}
      />
    </>
  )
}
