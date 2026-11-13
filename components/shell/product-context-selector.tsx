'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductIcon } from '@/components/products/product-icon'
import { useProducts } from '@/components/products/products-provider'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { GBMS, type Gbm, type Product } from '@/lib/products/data'

type Context = { product: string; year: string }
type Draft = Context & { gbm: Gbm }

const YEARS = ['2027', '2026', '2025'] as const

type ProductContextSelectorProps = {
  showYear?: boolean
  defaultYear?: string
}

export function ProductContextSelector({ showYear = true, defaultYear = '2026' }: ProductContextSelectorProps) {
  const { products } = useProducts()
  const [open, setOpen] = useState(false)
  const [applied, setApplied] = useState<Context>({ product: 'mobile', year: defaultYear })
  const [draft, setDraft] = useState<Draft>({ ...applied, gbm: 'MX' })

  useEffect(() => {
    setApplied((current) => (current.year === defaultYear ? current : { ...current, year: defaultYear }))
    setDraft((current) => ({ ...current, year: defaultYear }))
  }, [defaultYear])

  const byGbm = useMemo(
    () =>
      Object.fromEntries(
        GBMS.map((gbm) => [gbm, products.filter((item) => item.gbm === gbm).sort((a, b) => a.product_name.localeCompare(b.product_name))]),
      ) as Record<Gbm, Product[]>,
    [products],
  )

  const appliedProduct = products.find((item) => item.product_slug === applied.product) ?? byGbm.MX[0] ?? products[0]
  const draftProducts = byGbm[draft.gbm]
  const hasChanges = draft.product !== applied.product || (showYear && draft.year !== applied.year)

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft({ ...applied, gbm: appliedProduct?.gbm ?? 'MX' })
    setOpen(next)
  }

  const changeGbm = (gbm: Gbm | undefined) => {
    if (!gbm || gbm === draft.gbm) return
    setDraft((current) => ({ ...current, gbm, product: byGbm[gbm][0]?.product_slug ?? '' }))
  }

  const apply = () => {
    setApplied({ product: draft.product, year: draft.year })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
              aria-label={`Product context: ${appliedProduct?.product_name ?? 'None'}, ${appliedProduct?.gbm ?? ''}${showYear ? `, ${applied.year}` : ''}`}
            className="h-10 w-64 justify-between border-sidebar-border bg-sidebar-accent/55 px-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-foreground"
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand text-primary-foreground">
            <ProductIcon icon={appliedProduct?.icon} slug={appliedProduct?.product_slug} />
          </span>
          <span className="flex min-w-0 flex-col items-start gap-0.5">
            <span className="truncate text-xs font-semibold leading-none">
              {appliedProduct?.product_name ?? 'No products'}
            </span>
            <span className="text-[10px] leading-none font-medium text-sidebar-foreground/55">
              {appliedProduct?.gbm}{showYear ? ` · ${applied.year}` : ''}
            </span>
          </span>
        </span>
        <ChevronDown
          data-icon="inline-end"
          aria-hidden="true"
          className="text-sidebar-foreground/45"
        />
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-80 gap-0 p-0">
        <PopoverHeader className="px-3 pt-3 pb-3">
          <PopoverTitle>Product context</PopoverTitle>
          <PopoverDescription>Choose a scope, then apply to update the page.</PopoverDescription>
        </PopoverHeader>

        <div className="flex items-center justify-between gap-3 px-3 pb-3">
          <span className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            GBM
          </span>
          <ToggleGroup
            value={[draft.gbm]}
            onValueChange={(values) => changeGbm(values[values.length - 1] as Gbm | undefined)}
            variant="outline"
            spacing={0}
            aria-label="GBM"
            className="w-48"
          >
            {GBMS.map((gbm) => (
              <ToggleGroupItem
                key={gbm}
                value={gbm}
                aria-label={`${gbm} products`}
                className="flex-1 font-semibold data-pressed:bg-brand data-pressed:text-primary-foreground"
              >
                {gbm}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div role="radiogroup" aria-label={`${draft.gbm} products`} className="flex flex-col gap-1 px-2 pb-2">
          {draftProducts.length === 0 && (
            <p className="px-2 py-3 text-sm text-muted-foreground">No products for {draft.gbm} yet.</p>
          )}
          {draftProducts.map((item) => {
            const selected = draft.product === item.product_slug
            return (
              <button
                key={item.product_slug}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setDraft((current) => ({ ...current, product: item.product_slug }))}
                className={cn(
                  'flex items-center gap-3 rounded-md px-2 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                  selected ? 'bg-accent' : 'hover:bg-muted',
                )}
              >
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-md',
                    selected ? 'bg-brand text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <ProductIcon icon={item.icon} slug={item.product_slug} className="size-4" />
                </span>
                <span className="flex-1 font-medium">{item.product_name}</span>
                {selected ? <Check className="size-4 text-brand" aria-hidden="true" /> : null}
              </button>
            )
          })}
        </div>

        {showYear && (
          <>
            <Separator />

            <div className="flex items-center justify-between gap-3 p-3">
              <span className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                Year
              </span>
              <Select
                value={draft.year}
                onValueChange={(value) => setDraft((current) => ({ ...current, year: value ?? current.year }))}
              >
                <SelectTrigger aria-label="Year" className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {YEARS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <Separator />
          </>
        )}

        <div className="flex items-center justify-end gap-2 p-3">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={apply} disabled={!hasChanges || !draft.product}>
            Apply filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
