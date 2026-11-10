'use client'

import { useState } from 'react'
import { Boxes, ChevronDown, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
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

const PRODUCTS = [
  { value: 'HHP', name: 'HHP', description: 'Handheld products', count: 24 },
  { value: 'Tablet', name: 'Tablet', description: 'Large-screen portfolio', count: 8 },
  { value: 'Wearable', name: 'Wearable', description: 'Connected accessories', count: 12 },
] as const

const GBMS = ['MX', 'VD', 'DA'] as const
const YEARS = ['2026', '2025'] as const

export function ProductContextSelector() {
  const [open, setOpen] = useState(false)
  const [product, setProduct] = useState<string>('HHP')
  const [gbm, setGbm] = useState<string>('MX')
  const [year, setYear] = useState<string>('2026')

  const selectedProduct = PRODUCTS.find((item) => item.value === product) ?? PRODUCTS[0]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            aria-label={`Product context: ${selectedProduct.name}, ${gbm}, ${year}`}
            className="h-10 w-64 justify-between border-sidebar-border bg-sidebar-accent/55 px-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground aria-expanded:bg-sidebar-accent aria-expanded:text-sidebar-foreground"
          />
        }
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand text-primary-foreground">
            <Boxes aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col items-start gap-0.5">
            <span className="truncate text-xs font-semibold leading-none">
              {selectedProduct.name}
            </span>
            <span className="text-[10px] leading-none font-medium text-sidebar-foreground/55">
              {gbm} · {year}
            </span>
          </span>
        </span>
        <ChevronDown data-icon="inline-end" aria-hidden="true" className="text-sidebar-foreground/45" />
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-80 gap-0 p-0">
        <PopoverHeader className="px-3 pt-3 pb-2">
          <PopoverTitle>Product context</PopoverTitle>
          <PopoverDescription>Switch portfolio scope without leaving this page.</PopoverDescription>
        </PopoverHeader>

        <Command className="rounded-none">
          <CommandInput placeholder="Search products..." />
          <CommandList className="max-h-56">
            <CommandEmpty>No products found.</CommandEmpty>
            <CommandGroup heading="Products">
              {PRODUCTS.map((item) => (
                <CommandItem
                  key={item.value}
                  value={`${item.name} ${item.description}`}
                  data-checked={product === item.value}
                  onSelect={() => {
                    setProduct(item.value)
                    setOpen(false)
                  }}
                  className="py-2"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Package aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="font-medium">{item.name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                  <span className="mr-5 text-xs tabular-nums text-muted-foreground">
                    {item.count}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>

        <Separator />

        <div className="grid grid-cols-2 gap-3 p-3">
          <label className="flex flex-col gap-1.5 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            GBM
            <Select value={gbm} onValueChange={(value) => setGbm(value ?? gbm)}>
              <SelectTrigger aria-label="GBM" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {GBMS.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </label>

          <label className="flex flex-col gap-1.5 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            Year
            <Select value={year} onValueChange={(value) => setYear(value ?? year)}>
              <SelectTrigger aria-label="Year" className="w-full">
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
          </label>
        </div>
      </PopoverContent>
    </Popover>
  )
}
