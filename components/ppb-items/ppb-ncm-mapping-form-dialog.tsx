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
import { type PpbItem, type PpbNcmMapping, type PpbPlant } from '@/lib/ppb-items/data'

const PLANTS: PpbPlant[] = ['P81J', 'P81M']

export type PpbNcmMappingFormValues = Omit<PpbNcmMapping, 'id'>

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mapping: PpbNcmMapping | null
  mappings: readonly PpbNcmMapping[]
  items: readonly PpbItem[]
  onSubmit: (values: PpbNcmMappingFormValues) => void
}

type Errors = Partial<Record<keyof PpbNcmMappingFormValues, string>>

export function PpbNcmMappingFormDialog({ open, onOpenChange, mapping, mappings, items, onSubmit }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <PpbNcmMappingForm
          key={`${mapping?.id ?? 'new'}-${open}`}
          mapping={mapping}
          mappings={mappings}
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

function PpbNcmMappingForm({
  mapping,
  mappings,
  items,
  onCancel,
  onSubmit,
}: Pick<Props, 'mapping' | 'mappings' | 'items' | 'onSubmit'> & { onCancel: () => void }) {
  const uid = useId()
  const [plant, setPlant] = useState<PpbPlant>(mapping?.plant ?? PLANTS[0])
  const [ncm, setNcm] = useState(mapping?.ncm ?? '')
  const [suframa, setSuframa] = useState(mapping?.suframa ?? '')
  const [itemId, setItemId] = useState(mapping?.itemId ?? items[0]?.id ?? '')
  const [lastUpdated, setLastUpdated] = useState(mapping?.lastUpdated ?? new Date().toISOString().slice(0, 10))
  const [errors, setErrors] = useState<Errors>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Errors = {}
    const cleanNcm = ncm.replace(/\D/g, '')
    const cleanSuframa = suframa.replace(/\D/g, '')

    if (!/^\d{8}$/.test(cleanNcm)) next.ncm = 'NCM must contain exactly 8 digits.'
    if (!/^\d{4}$/.test(cleanSuframa)) next.suframa = 'Suframa must contain exactly 4 digits.'
    if (!itemId) next.itemId = 'Select an item.'
    if (!lastUpdated) next.lastUpdated = 'Select the last updated date.'
    if (mappings.some((current) => current.id !== mapping?.id && current.plant === plant && current.ncm === cleanNcm && current.itemId === itemId)) {
      next.ncm = 'This plant, NCM, and item mapping already exists.'
    }

    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSubmit({ plant, ncm: cleanNcm, suframa: cleanSuframa, itemId, lastUpdated })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>{mapping ? 'Edit Mapping (NCM)' : 'New Mapping (NCM)'}</DialogTitle>
        <DialogDescription>
          Configure the NCM and Suframa codes for an item and plant. Values are mock data stored in memory.
        </DialogDescription>
      </DialogHeader>

      <Field id={`${uid}-plant`} label="Plant" error={errors.plant}>
        <Select value={plant} onValueChange={(value) => value && setPlant(value as PpbPlant)}>
          <SelectTrigger id={`${uid}-plant`} aria-label="Plant">
            <SelectValue placeholder="Select a plant" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {PLANTS.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      <Field id={`${uid}-ncm`} label="NCM" error={errors.ncm} hint="Exactly 8 digits.">
        <Input
          id={`${uid}-ncm`}
          value={ncm}
          inputMode="numeric"
          maxLength={8}
          aria-invalid={Boolean(errors.ncm)}
          onChange={(event) => setNcm(event.target.value.replace(/\D/g, '').slice(0, 8))}
        />
      </Field>

      <Field id={`${uid}-suframa`} label="Suframa (Destaque)" error={errors.suframa} hint="Exactly 4 digits.">
        <Input
          id={`${uid}-suframa`}
          value={suframa}
          inputMode="numeric"
          maxLength={4}
          aria-invalid={Boolean(errors.suframa)}
          onChange={(event) => setSuframa(event.target.value.replace(/\D/g, '').slice(0, 4))}
        />
      </Field>

      <Field id={`${uid}-item`} label="Item" error={errors.itemId}>
        <Select value={itemId} onValueChange={(value) => value && setItemId(value)}>
          <SelectTrigger id={`${uid}-item`} aria-label="Item">
            <SelectValue>{items.find((item) => item.id === itemId)?.itemName ?? 'Select an item'}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {items.map((item) => <SelectItem key={item.id} value={item.id}>{item.itemName}</SelectItem>)}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      <Field id={`${uid}-last-updated`} label="Last Updated" error={errors.lastUpdated}>
        <Input id={`${uid}-last-updated`} type="date" value={lastUpdated} aria-invalid={Boolean(errors.lastUpdated)} onChange={(event) => setLastUpdated(event.target.value)} />
      </Field>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{mapping ? 'Save changes' : 'Create mapping'}</Button>
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
      <label htmlFor={id} className="text-xs font-medium text-foreground">{label}</label>
      {children}
      {error ? <p role="alert" className="text-xs text-critical">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
