'use client'

import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { formatPlants, parsePlants, slugify, type Gbm, type Product } from '@/lib/products/data'
import { PlantTags } from './plant-tags'

export type ProductFormValues = Pick<Product, 'name' | 'slug' | 'plants' | 'order'>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The product being edited, or null to create one. */
  product: Product | null
  gbm: Gbm
  products: readonly Product[]
  onSubmit: (values: ProductFormValues) => void
}

export function ProductFormDialog({ open, onOpenChange, product, gbm, products, onSubmit }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <ProductForm
          product={product}
          gbm={gbm}
          products={products}
          onCancel={() => onOpenChange(false)}
          onSubmit={(values) => {
            onSubmit(values)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

type Errors = Partial<Record<keyof ProductFormValues, string>>

function ProductForm({
  product,
  gbm,
  products,
  onCancel,
  onSubmit,
}: Pick<Props, 'product' | 'gbm' | 'products' | 'onSubmit'> & { onCancel: () => void }) {
  const uid = useId()
  const nextOrder = Math.max(0, ...products.filter((item) => item.gbm === gbm).map((item) => item.order)) + 1

  const [name, setName] = useState(product?.name ?? '')
  const [slug, setSlug] = useState(product?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(product))
  const [plants, setPlants] = useState(product?.plants ?? '')
  const [order, setOrder] = useState(String(product?.order ?? nextOrder))
  const [errors, setErrors] = useState<Errors>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Errors = {}
    const cleanSlug = slugify(slug)
    const parsedOrder = Number(order)

    if (!name.trim()) next.name = 'Enter a product name.'
    if (!cleanSlug) next.slug = 'Enter a slug using letters, numbers and dashes.'
    else if (products.some((item) => item.slug === cleanSlug && item.id !== product?.id))
      next.slug = 'This slug is already used by another product.'
    if (parsePlants(plants).length === 0) next.plants = 'Add at least one plant, separated by commas.'
    if (!Number.isInteger(parsedOrder) || parsedOrder < 1) next.order = 'Use a whole number from 1.'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSubmit({ name: name.trim(), slug: cleanSlug, plants: formatPlants(parsePlants(plants)), order: parsedOrder })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{product ? 'Edit product' : 'New product'}</DialogTitle>
        <DialogDescription>
          {product ? 'Changes update the top bar selector right away.' : `The product is added to the ${gbm} GBM.`}
        </DialogDescription>
      </DialogHeader>

      <Field id={`${uid}-name`} label="Product name" error={errors.name}>
        <Input
          id={`${uid}-name`}
          value={name}
          autoFocus
          aria-invalid={Boolean(errors.name)}
          onChange={(event) => {
            setName(event.target.value)
            if (!slugTouched) setSlug(slugify(event.target.value))
          }}
        />
      </Field>

      <Field id={`${uid}-slug`} label="Product slug" error={errors.slug} hint="Used in URLs and integrations.">
        <Input
          id={`${uid}-slug`}
          value={slug}
          className="font-mono"
          aria-invalid={Boolean(errors.slug)}
          onChange={(event) => {
            setSlug(event.target.value)
            setSlugTouched(true)
          }}
        />
      </Field>

      <Field id={`${uid}-plants`} label="Plants" error={errors.plants} hint="Separate plants with commas.">
        <Input
          id={`${uid}-plants`}
          value={plants}
          placeholder="Manaus, Suwon, Hanoi"
          aria-invalid={Boolean(errors.plants)}
          onChange={(event) => setPlants(event.target.value)}
        />
        <div className="min-h-6" aria-live="polite">
          <PlantTags value={plants} className="flex-wrap" />
        </div>
      </Field>

      <Field id={`${uid}-order`} label="Order" error={errors.order} hint="Position in the product selector.">
        <Input
          id={`${uid}-order`}
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={order}
          className="w-28"
          aria-invalid={Boolean(errors.order)}
          onChange={(event) => setOrder(event.target.value)}
        />
      </Field>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{product ? 'Save changes' : 'Create product'}</Button>
      </DialogFooter>
    </form>
  )
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-critical">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}
