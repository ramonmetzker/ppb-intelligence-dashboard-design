'use client'

import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { formatPlants, parsePlants, slugify, type Gbm, type Product, type YesNo } from '@/lib/products/data'
import { productIconSvg, sanitizeIconSvg } from '@/lib/products/icons'
import { PlantsTagsInput } from './plants-tags-input'
import { ProductIconPicker } from './product-icon-picker'

export type ProductFormValues = Pick<
  Product,
  'product_name' | 'product_slug' | 'product_code' | 'plants' | 'icon' | 'active_yn'
>

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        <ProductForm
          key={`${product?.product_slug ?? 'new'}-${open}`}
          product={product}
          gbm={gbm}
          products={products}
          onCancel={() => onOpenChange(false)}
          onSubmit={(values) => {
            onSubmit(values)
            onOpenChange(false)
          }}
        />
      </SheetContent>
    </Sheet>
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
  const [productName, setProductName] = useState(product?.product_name ?? '')
  const [plants, setPlants] = useState(product?.plants ?? '')
  const [icon, setIcon] = useState(product?.icon ?? productIconSvg('package'))
  const [activeYn, setActiveYn] = useState<YesNo>(product?.active_yn ?? 'Y')
  const [errors, setErrors] = useState<Errors>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Errors = {}
    const cleanName = productName.trim()
    const cleanSlug = slugify(cleanName)
    const cleanCode = cleanSlug.replaceAll('-', '_').toUpperCase()
    const cleanIcon = sanitizeIconSvg(icon)

    if (!cleanName) next.product_name = 'Enter a product name.'
    if (!cleanSlug) next.product_slug = 'Enter a slug using letters, numbers and dashes.'
    else if (products.some((item) => item.product_slug === cleanSlug && item.product_slug !== product?.product_slug)) {
      next.product_slug = 'This slug is already used by another product.'
    }
    if (!cleanCode) next.product_code = 'Enter a product code.'
    else if (products.some((item) => item.product_code.toLowerCase() === cleanCode.toLowerCase() && item.product_slug !== product?.product_slug)) {
      next.product_code = 'This code is already used by another product.'
    }
    if (parsePlants(plants).length === 0) next.plants = 'Add at least one plant, separated by commas.'
    if (!cleanIcon) next.icon = 'Choose an icon.'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSubmit({
      product_name: cleanName,
      product_slug: cleanSlug,
      product_code: cleanCode,
      plants: formatPlants(parsePlants(plants)),
      icon: cleanIcon,
      active_yn: activeYn,
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      <SheetHeader className="shrink-0 border-b border-border px-5 py-4 pr-14">
        <SheetTitle>{product ? 'Edit product' : 'New product'}</SheetTitle>
        <SheetDescription>
          {product ? 'Update the product details.' : `Add a product to the ${gbm} GBM.`}
        </SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field id={`${uid}-name`} label="Product Name" error={errors.product_name}>
              <Input
                id={`${uid}-name`}
                value={productName}
                autoFocus
                aria-invalid={Boolean(errors.product_name)}
                onChange={(event) => setProductName(event.target.value)}
              />
            </Field>
          </div>

          <Field id={`${uid}-slug`} label="Product Slug" error={errors.product_slug}>
            <Input
              id={`${uid}-slug`}
              value={slugify(productName)}
              className="bg-muted font-mono"
              aria-invalid={Boolean(errors.product_slug)}
              readOnly
            />
          </Field>

          <Field id={`${uid}-code`} label="Product Code" error={errors.product_code}>
            <Input
              id={`${uid}-code`}
              value={slugify(productName).replaceAll('-', '_').toUpperCase()}
              className="bg-muted font-mono uppercase"
              aria-invalid={Boolean(errors.product_code)}
              readOnly
            />
          </Field>
        </div>

        <Field id={`${uid}-plants`} label="Plants" error={errors.plants}>
          <PlantsTagsInput
            id={`${uid}-plants`}
            value={plants}
            placeholder="Add a plant"
            invalid={Boolean(errors.plants)}
            onChange={setPlants}
          />
        </Field>

        <div className="flex flex-col gap-1.5">
          <span id={`${uid}-icon-label`} className="text-xs font-medium text-foreground">Icon</span>
          <ProductIconPicker value={icon} onChange={setIcon} />
          {errors.icon ? <p role="alert" className="text-xs text-critical">{errors.icon}</p> : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={`${uid}-gbm`} label="GBM">
            <Input id={`${uid}-gbm`} value={gbm} readOnly disabled />
          </Field>

          <BooleanField id={`${uid}-active`} label="Active" value={activeYn} onChange={setActiveYn} />
        </div>
      </div>

      <SheetFooter className="shrink-0 border-t border-border bg-muted/30 px-5 py-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{product ? 'Save changes' : 'Create product'}</Button>
      </SheetFooter>
    </form>
  )
}

function BooleanField({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: YesNo
  onChange: (value: YesNo) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span id={id} className="text-xs font-medium text-foreground">{label}</span>
      <ToggleGroup
        value={[value]}
        onValueChange={(values) => values[values.length - 1] && onChange(values[values.length - 1] as YesNo)}
        variant="outline"
        spacing={0}
        aria-labelledby={id}
        className="grid w-full grid-cols-2"
      >
        <ToggleGroupItem value="Y" className="min-w-0 data-pressed:bg-brand data-pressed:text-primary-foreground">Yes</ToggleGroupItem>
        <ToggleGroupItem value="N" className="min-w-0 data-pressed:bg-brand data-pressed:text-primary-foreground">No</ToggleGroupItem>
      </ToggleGroup>
    </div>
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
      <label htmlFor={id} className="text-xs font-medium text-foreground">{label}</label>
      {children}
      {error ? <p role="alert" className="text-xs text-critical">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
