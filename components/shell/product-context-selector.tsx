'use client'

import { useState } from 'react'
import {
  AirVent,
  Check,
  ChevronDown,
  Fan,
  Monitor,
  Smartphone,
  Tablet,
  Tv,
  Watch,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
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

type Gbm = 'MX' | 'VD' | 'DA'
type Product = { value: string; name: string; icon: LucideIcon }
type Family = { gbm: Gbm; products: readonly Product[] }
type Context = { product: string; year: string }

const FAMILIES: readonly Family[] = [
  {
    gbm: 'MX',
    products: [
      { value: 'Mobile', name: 'Mobile', icon: Smartphone },
      { value: 'Tablet', name: 'Tablet', icon: Tablet },
      { value: 'Wearables', name: 'Wearables', icon: Watch },
    ],
  },
  {
    gbm: 'VD',
    products: [
      { value: 'TV', name: 'TV', icon: Tv },
      { value: 'Monitor', name: 'Monitor', icon: Monitor },
    ],
  },
  {
    gbm: 'DA',
    products: [
      { value: 'Indoor Unit', name: 'Indoor Unit', icon: AirVent },
      { value: 'Outdoor Unit', name: 'Outdoor Unit', icon: Fan },
    ],
  },
]

const YEARS = ['2026', '2025'] as const

function findFamily(product: string) {
  return FAMILIES.find((family) => family.products.some((item) => item.value === product)) ?? FAMILIES[0]
}

export function ProductContextSelector() {
  const [open, setOpen] = useState(false)
  const [applied, setApplied] = useState<Context>({ product: 'Mobile', year: '2026' })
  const [draft, setDraft] = useState<Context>(applied)

  const appliedFamily = findFamily(applied.product)
  const appliedProduct =
    appliedFamily.products.find((item) => item.value === applied.product) ?? appliedFamily.products[0]
  const AppliedIcon = appliedProduct.icon

  const draftFamily = findFamily(draft.product)
  const hasChanges = draft.product !== applied.product || draft.year !== applied.year

  const handleOpenChange = (next: boolean) => {
    if (next) setDraft(applied)
    setOpen(next)
  }

  const changeGbm = (gbm: Gbm | undefined) => {
    if (!gbm || gbm === draftFamily.gbm) return
    const family = FAMILIES.find((item) => item.gbm === gbm)
    if (family) setDraft((current) => ({ ...current, product: family.products[0].value }))
  }

  const apply = () => {
    setApplied(draft)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            aria-label={`Product context: ${appliedProduct.name}, ${appliedFamily.gbm}, ${applied.year}`}
            className="h-10 w-64 justify-between border-sidebar-border bg-sidebar-accent/55 px-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-foreground"
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand text-primary-foreground">
            <AppliedIcon aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col items-start gap-0.5">
            <span className="truncate text-xs font-semibold leading-none">
              {appliedProduct.name}
            </span>
            <span className="text-[10px] leading-none font-medium text-sidebar-foreground/55">
              {appliedFamily.gbm} · {applied.year}
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
            value={[draftFamily.gbm]}
            onValueChange={(values) => changeGbm(values[values.length - 1] as Gbm | undefined)}
            variant="outline"
            spacing={0}
            aria-label="GBM"
            className="w-48"
          >
            {FAMILIES.map((family) => (
              <ToggleGroupItem
                key={family.gbm}
                value={family.gbm}
                aria-label={`${family.gbm} products`}
                className="flex-1 font-semibold data-pressed:bg-brand data-pressed:text-primary-foreground"
              >
                {family.gbm}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div
          role="radiogroup"
          aria-label={`${draftFamily.gbm} products`}
          className="flex flex-col gap-1 px-2 pb-2"
        >
          {draftFamily.products.map((item) => {
            const Icon = item.icon
            const selected = draft.product === item.value
            return (
              <button
                key={item.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setDraft((current) => ({ ...current, product: item.value }))}
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
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="flex-1 font-medium">{item.name}</span>
                {selected ? <Check className="size-4 text-brand" aria-hidden="true" /> : null}
              </button>
            )
          })}
        </div>

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

        <div className="flex items-center justify-end gap-2 p-3">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={apply} disabled={!hasChanges}>
            Apply filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
