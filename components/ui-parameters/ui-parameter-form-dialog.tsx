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
import { UI_PARAMETER_YEARS, type UiParameter, type UiParameterFormValues } from '@/lib/ui-parameters/data'
import { type PpbItem, type YesNo } from '@/lib/ppb-items/data'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  parameter: UiParameter | null
  parameters: readonly UiParameter[]
  items: readonly PpbItem[]
  onSubmit: (values: UiParameterFormValues) => void
}

type Errors = Partial<Record<keyof UiParameterFormValues, string>>

export function UiParameterFormDialog({ open, onOpenChange, parameter, parameters, items, onSubmit }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <UiParameterForm
          key={`${parameter?.id ?? 'new'}-${open}`}
          parameter={parameter}
          parameters={parameters}
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

function UiParameterForm({
  parameter,
  parameters,
  items,
  onCancel,
  onSubmit,
}: Pick<Props, 'parameter' | 'parameters' | 'items' | 'onSubmit'> & { onCancel: () => void }) {
  const uid = useId()
  const [order, setOrder] = useState(parameter ? String(parameter.order) : '')
  const [itemId, setItemId] = useState(parameter?.itemId ?? items[0]?.id ?? '')
  const [display, setDisplay] = useState<YesNo>(parameter?.display ?? 'Y')
  const [collapse, setCollapse] = useState<YesNo>(parameter?.collapse ?? 'N')
  const [year, setYear] = useState(parameter?.year ?? UI_PARAMETER_YEARS[1])
  const [errors, setErrors] = useState<Errors>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Errors = {}
    const parsedOrder = Number(order)

    if (!order || !Number.isInteger(parsedOrder) || parsedOrder < 1) next.order = 'Enter a whole number greater than zero.'
    if (!itemId) next.itemId = 'Select an item.'
    if (parameters.some((current) => current.id !== parameter?.id && current.itemId === itemId && current.year === year)) {
      next.itemId = 'This item already has parameters for this year.'
    }

    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSubmit({ order: parsedOrder, itemId, display, collapse, year })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>{parameter ? 'Edit UI parameter' : 'New UI parameter'}</DialogTitle>
        <DialogDescription>
          Control the order and visibility of PPB items in overview tables and charts.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${uid}-order`} label="Order" error={errors.order}>
          <Input id={`${uid}-order`} type="number" min="1" step="1" value={order} aria-invalid={Boolean(errors.order)} onChange={(event) => setOrder(event.target.value)} />
        </Field>
        <Field id={`${uid}-year`} label="Year">
          <Select value={year} onValueChange={(value) => value && setYear(value)}>
            <SelectTrigger id={`${uid}-year`} aria-label="Year"><SelectValue /></SelectTrigger>
            <SelectContent><SelectGroup>{UI_PARAMETER_YEARS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
        </Field>
      </div>

      <Field id={`${uid}-item`} label="Item" error={errors.itemId}>
        <Select value={itemId} onValueChange={(value) => value && setItemId(value)}>
          <SelectTrigger id={`${uid}-item`} aria-label="Item">
            <SelectValue>{items.find((item) => item.id === itemId)?.itemName ?? 'Select an item'}</SelectValue>
          </SelectTrigger>
          <SelectContent><SelectGroup>{items.map((item) => <SelectItem key={item.id} value={item.id}>{item.itemName}</SelectItem>)}</SelectGroup></SelectContent>
        </Select>
      </Field>

      <BooleanField id={`${uid}-display`} label="Display" value={display} onChange={setDisplay} hint="Show the item in overview tables and charts." />
      <BooleanField id={`${uid}-collapse`} label="Collapse" value={collapse} onChange={setCollapse} hint="Place the item under the Additional Items expandable row." />

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{parameter ? 'Save changes' : 'Create parameter'}</Button>
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
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-foreground">{label}</label>
      {children}
      {error ? <p role="alert" className="text-xs text-critical">{error}</p> : null}
    </div>
  )
}
