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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { PPB_CATEGORIES, slugifyPpbItem, type PpbCategory, type PpbItem, type YesNo } from '@/lib/ppb-items/data'

export type PpbItemFormValues = Pick<PpbItem, 'itemName' | 'itemSlug' | 'category' | 'mapping' | 'active'>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: PpbItem | null
  items: readonly PpbItem[]
  onSubmit: (values: PpbItemFormValues) => void
}

export function PpbItemFormDialog({ open, onOpenChange, item, items, onSubmit }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <PpbItemForm
          key={`${item?.id ?? 'new'}-${open}`}
          item={item}
          items={items}
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

type Errors = Partial<Record<keyof PpbItemFormValues, string>>

function PpbItemForm({
  item,
  items,
  onCancel,
  onSubmit,
}: Pick<Props, 'item' | 'items' | 'onSubmit'> & { onCancel: () => void }) {
  const uid = useId()
  const [itemName, setItemName] = useState(item?.itemName ?? '')
  const [category, setCategory] = useState<PpbCategory>(item?.category ?? PPB_CATEGORIES[0])
  const [mapping, setMapping] = useState<YesNo>(item?.mapping ?? 'N')
  const [active, setActive] = useState<YesNo>(item?.active ?? 'Y')
  const [errors, setErrors] = useState<Errors>({})
  const itemSlug = slugifyPpbItem(itemName)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Errors = {}
    const cleanName = itemName.trim()
    const cleanSlug = slugifyPpbItem(cleanName)

    if (!cleanName) next.itemName = 'Enter an item name.'
    if (!cleanSlug) next.itemSlug = 'The slug could not be generated.'
    if (items.some((current) => current.itemSlug === cleanSlug && current.id !== item?.id)) {
      next.itemSlug = 'This slug is already used by another item.'
    }

    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSubmit({ itemName: cleanName, itemSlug: cleanSlug, category, mapping, active })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>{item ? 'Edit PPB item' : 'New PPB item'}</DialogTitle>
        <DialogDescription>
          Item slugs are generated automatically from the item name. Mapping and Active are stored as Y or N.
        </DialogDescription>
      </DialogHeader>

      <Field id={`${uid}-name`} label="Item Name" error={errors.itemName}>
        <Input
          id={`${uid}-name`}
          value={itemName}
          autoFocus
          aria-invalid={Boolean(errors.itemName)}
          onChange={(event) => setItemName(event.target.value)}
        />
      </Field>

      <Field id={`${uid}-slug`} label="Item Slug" error={errors.itemSlug} hint="Generated from Item Name.">
        <Input id={`${uid}-slug`} value={itemSlug} readOnly disabled className="font-mono" aria-invalid={Boolean(errors.itemSlug)} />
      </Field>

      <Field id={`${uid}-category`} label="Category" error={errors.category}>
        <Select value={category} onValueChange={(value) => value && setCategory(value as PpbCategory)}>
          <SelectTrigger id={`${uid}-category`} aria-label="Category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {PPB_CATEGORIES.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      <BooleanField id={`${uid}-mapping`} label="Mapping" value={mapping} onChange={setMapping} hint="Stored as Y or N in the source data." />
      <BooleanField id={`${uid}-active`} label="Active" value={active} onChange={setActive} hint="Inactive items remain visible for traceability." />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{item ? 'Save changes' : 'Create item'}</Button>
      </DialogFooter>
    </form>
  )
}

function BooleanField({
  id,
  label,
  value,
  onChange,
  hint,
}: {
  id: string
  label: string
  value: YesNo
  onChange: (value: YesNo) => void
  hint: string
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
        className="w-fit"
      >
        <ToggleGroupItem value="Y" className="min-w-16 data-pressed:bg-brand data-pressed:text-primary-foreground">Yes</ToggleGroupItem>
        <ToggleGroupItem value="N" className="min-w-16 data-pressed:bg-brand data-pressed:text-primary-foreground">No</ToggleGroupItem>
      </ToggleGroup>
      <p className="text-xs text-muted-foreground">{hint}</p>
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
