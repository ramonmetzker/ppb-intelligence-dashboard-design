'use client'

import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { PageActions } from '@/components/app/page-actions'
import { YesNoBadge } from '@/components/app/yes-no-badge'
import { PageHeader } from '@/components/app/page-header'
import { DataTable } from '@/components/data-table/data-table'
import { Button } from '@/components/ui/button'
import {
  DEFAULT_QUERY,
  type BulkAction,
  type DataTableColumn,
  type DataTableQuery,
  type RowAction,
} from '@/lib/data-table/types'
import { PRODUCT_SCHEMA, type Product } from '@/lib/products/data'
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
  { ...base('gbm'), width: 90, align: 'center', cell: ({ row }) => <span className="font-semibold">{row.gbm}</span> },
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

const DEFAULT_PRODUCT_QUERY: DataTableQuery = { ...DEFAULT_QUERY, sort: [{ id: 'product_name', direction: 'asc' }] }

export function ProductsView() {
  const { products, setProducts, gbm } = useProducts()
  const [query, setQuery] = useState<DataTableQuery>(DEFAULT_PRODUCT_QUERY)
  const [editing, setEditing] = useState<Product | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const rows = useMemo(() => products.filter((product) => product.gbm === gbm), [products, gbm])

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
        : [...current, { ...values, gbm, created_at: now, updated_at: now }],
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
      onSelect: (product) => remove([product.product_slug]),
    },
  ]

  const bulkActions: BulkAction<Product>[] = [
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 aria-hidden="true" />,
      tone: 'destructive',
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

      <DataTable<Product>
        key={gbm}
        caption={`${gbm} products`}
        persistenceKey={`products.${gbm}`}
        columns={COLUMNS}
        data={rows}
        getRowId={(row) => row.product_slug}
        query={query}
        onQueryChange={setQuery}
        selectable
        bulkActions={bulkActions}
        rowActions={rowActions}
        onRowClick={openEdit}
        columnPinning={false}
        densityControl
        pagination={false}
      />

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
