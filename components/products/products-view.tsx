'use client'

import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { PageActions } from '@/components/app/page-actions'
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
    ...base('name'),
    width: 220,
    pin: 'left',
    hideable: false,
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-2.5 font-medium">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <ProductIcon slug={row.slug} className="size-3.5" />
        </span>
        {row.name}
      </span>
    ),
  },
  { ...base('slug'), width: 200, cell: ({ row }) => <span className="font-mono text-xs">{row.slug}</span> },
  {
    ...base('plants'),
    width: 360,
    grow: true,
    sortable: false,
    description: 'Comma separated in the source data, shown here as one tag per plant.',
    cell: ({ row }) => <PlantTags value={row.plants} max={4} />,
  },
  { ...base('order'), width: 140, align: 'right' },
]

const DEFAULT_PRODUCT_QUERY: DataTableQuery = { ...DEFAULT_QUERY, sort: [{ id: 'order', direction: 'asc' }] }

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
  const remove = (ids: string[]) => setProducts((current) => current.filter((product) => !ids.includes(product.id)))

  const submit = (values: ProductFormValues) =>
    setProducts((current) =>
      editing
        ? current.map((product) => (product.id === editing.id ? { ...product, ...values } : product))
        : [...current, { ...values, id: values.slug, gbm }],
    )

  const rowActions: RowAction<Product>[] = [
    { id: 'edit', label: 'Edit', icon: <Pencil aria-hidden="true" />, inline: true, onSelect: openEdit },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 aria-hidden="true" />,
      tone: 'destructive',
      separatorBefore: true,
      onSelect: (product) => remove([product.id]),
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
        description={`Master data for the ${gbm} products offered in the top bar selector. Plants are stored as a comma separated list.`}
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
        getRowId={(row) => row.id}
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
