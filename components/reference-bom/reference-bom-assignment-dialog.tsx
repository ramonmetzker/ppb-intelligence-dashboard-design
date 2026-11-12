'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, Info, LockKeyhole, Search, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  PPB_BOM_ITEMS,
  REFERENCE_BOM_OPTIONS,
  type ReferenceBomOption,
  type ReferenceBomRow,
} from '@/lib/reference-bom-data'

type AssignmentType = 'previous' | 'reference' | 'fake'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  rows: ReferenceBomRow[]
}

const ASSIGNMENT_OPTIONS: { id: AssignmentType; label: string; description: string }[] = [
  { id: 'previous', label: 'Previous BOM', description: 'Use the latest ingested BOM for this model.' },
  { id: 'reference', label: 'Reference BOM', description: 'Reuse a BOM from another model.' },
  { id: 'fake', label: 'Fake BOM', description: 'Create a temporary mix of imported and local items.' },
]

export function ReferenceBomAssignmentDialog({ open, onOpenChange, rows }: Props) {
  const [assignmentType, setAssignmentType] = useState<AssignmentType>('reference')
  const [referenceOpen, setReferenceOpen] = useState(false)
  const [referenceBom, setReferenceBom] = useState<ReferenceBomOption>(REFERENCE_BOM_OPTIONS[0])
  const [localPercentages, setLocalPercentages] = useState<Record<string, number>>(() =>
    Object.fromEntries(PPB_BOM_ITEMS.map((item) => [item.id, item.localDefault])),
  )

  const previousAvailable = rows.length > 0 && rows.every((row) => Boolean(row.previousBom))
  const selectedModelLabel = rows.length === 1 ? rows[0].model : `${rows.length} models`
  const selectedPreviousBom = rows.length === 1 ? rows[0].previousBom : undefined
  const totalVolume = rows.reduce((sum, row) => sum + row.volume, 0)
  const localItemCount = useMemo(
    () => Object.values(localPercentages).filter((percentage) => percentage > 0).length,
    [localPercentages],
  )

  useEffect(() => {
    if (!open) return
    setAssignmentType(previousAvailable ? 'previous' : 'reference')
    setReferenceOpen(false)
    setLocalPercentages(Object.fromEntries(PPB_BOM_ITEMS.map((item) => [item.id, item.localDefault])))
  }, [open, previousAvailable])

  const chooseAssignment = (type: AssignmentType) => {
    if (type === 'previous' && !previousAvailable) return
    setAssignmentType(type)
  }

  const updateLocalPercentage = (id: string, value: string) => {
    setLocalPercentages((current) => ({ ...current, [id]: Number(value) }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border bg-muted/25 px-6 py-5 pr-14">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-[10px] tracking-[0.12em] uppercase">BOM assignment</Badge>
                <span className="text-xs text-muted-foreground">{totalVolume.toLocaleString('en-US')} units in scope</span>
              </div>
              <DialogTitle className="text-lg">Assign BOM to {selectedModelLabel}</DialogTitle>
              <DialogDescription className="mt-1">
                Choose the coverage source that will be used when the planning model is generated.
              </DialogDescription>
            </div>
            <div className="hidden rounded-lg border border-border bg-card px-3 py-2 text-right sm:block">
              <p className="text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">Models</p>
              <p className="tnum mt-0.5 text-lg font-semibold text-foreground">{rows.length}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[min(72dvh,620px)] overflow-y-auto px-6 py-5">
          <div className="grid gap-2 md:grid-cols-3" role="radiogroup" aria-label="BOM assignment type">
            {ASSIGNMENT_OPTIONS.map((option) => {
              const disabled = option.id === 'previous' && !previousAvailable
              const active = assignmentType === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-disabled={disabled}
                  disabled={disabled}
                  onClick={() => chooseAssignment(option.id)}
                  className={cn(
                    'group relative flex min-h-28 flex-col items-start rounded-xl border p-3.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    active ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:bg-muted/40',
                    disabled && 'cursor-not-allowed opacity-50 hover:bg-card',
                  )}
                >
                  <span className="mb-3 flex w-full items-center justify-between">
                    <span className={cn('flex size-7 items-center justify-center rounded-md', active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                      {option.id === 'previous' && <LockKeyhole className="size-3.5" aria-hidden="true" />}
                      {option.id === 'reference' && <Search className="size-3.5" aria-hidden="true" />}
                      {option.id === 'fake' && <Sparkles className="size-3.5" aria-hidden="true" />}
                    </span>
                    {active && <Check className="size-4 text-primary" aria-hidden="true" />}
                  </span>
                  <span className="text-[13px] font-semibold">{option.label}</span>
                  <span className="mt-1 text-[11px] leading-4 text-muted-foreground">{option.description}</span>
                  {disabled && <span className="mt-auto pt-2 text-[10px] font-medium text-muted-foreground">No previous BOM for all selected models</span>}
                </button>
              )
            })}
          </div>

          <div className="mt-5 rounded-xl border border-border bg-card">
            {assignmentType === 'previous' && (
              <div className="p-4">
                <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
                  <LockKeyhole className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="text-[13px] font-medium">Latest ingested BOM</p>
                    <p className="mt-1 text-xs text-muted-foreground">{selectedPreviousBom ?? 'Previous BOM available for every selected model.'}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto">Previous</Badge>
                </div>
              </div>
            )}

            {assignmentType === 'reference' && (
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium">Select a reference model</p>
                    <p className="mt-1 text-xs text-muted-foreground">The selected BOM will be copied as the coverage source.</p>
                  </div>
                  <Badge variant="secondary">Reference</Badge>
                </div>
                <Popover open={referenceOpen} onOpenChange={setReferenceOpen}>
                  <PopoverTrigger
                    render={
                      <Button variant="outline" className="h-11 w-full justify-between px-3 text-left font-normal" aria-label="Select reference BOM" />
                    }
                  >
                    <span className="flex min-w-0 flex-col items-start gap-0.5">
                      <span className="truncate text-[13px] font-medium">{referenceBom.sku}</span>
                      <span className="truncate text-[11px] text-muted-foreground">{referenceBom.description}</span>
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[min(31rem,calc(100vw-3rem))] p-0">
                    <Command>
                      <CommandInput placeholder="Search reference models..." />
                      <CommandList>
                        <CommandEmpty>No reference BOMs found.</CommandEmpty>
                        {REFERENCE_BOM_OPTIONS.map((option) => (
                          <CommandItem
                            key={option.id}
                            value={`${option.sku} ${option.model} ${option.description}`}
                            onSelect={() => {
                              setReferenceBom(option)
                              setReferenceOpen(false)
                            }}
                            className="gap-3 px-3 py-2.5"
                          >
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                              <Search className="size-3.5" aria-hidden="true" />
                            </span>
                            <span className="flex min-w-0 flex-col">
                              <span className="text-[13px] font-medium">{option.sku}</span>
                              <span className="truncate text-[11px] text-muted-foreground">{option.description}</span>
                            </span>
                            {referenceBom.id === option.id && <Check className="ml-auto size-4 text-primary" aria-hidden="true" />}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {assignmentType === 'fake' && (
              <div className="p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-medium">Configure local content</p>
                    <p className="mt-1 text-xs text-muted-foreground">Set the local share of each item. The remainder stays imported.</p>
                  </div>
                  <Badge variant="secondary">Fake BOM</Badge>
                </div>
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-muted/25 px-3 py-2 text-xs text-muted-foreground">
                  <Info className="size-3.5 shrink-0" aria-hidden="true" />
                  Default coverage imports every item except PBA Assy, which starts at 100% local.
                </div>
                <div className="divide-y divide-border rounded-lg border border-border">
                  {PPB_BOM_ITEMS.map((item) => {
                    const local = localPercentages[item.id] ?? item.localDefault
                    return (
                      <div key={item.id} className="grid gap-2 px-3 py-3 sm:grid-cols-[9.5rem_1fr_4rem] sm:items-center sm:gap-4">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium">{item.name}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{item.description}</p>
                        </div>
                        <label className="flex min-w-0 items-center gap-3">
                          <span className="sr-only">{item.name} local percentage</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={local}
                            onChange={(event) => updateLocalPercentage(item.id, event.target.value)}
                            className="h-1.5 min-w-0 flex-1 cursor-pointer accent-primary"
                          />
                          <span className="w-11 text-right text-[11px] text-muted-foreground">{100 - local}% imported</span>
                        </label>
                        <span className="tnum text-right text-[13px] font-semibold text-primary">{local}% local</span>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
                  {localItemCount} of {PPB_BOM_ITEMS.length} items include local content.
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <p className="hidden text-xs text-muted-foreground sm:block">Mock assignment · no data will be changed</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="button" onClick={() => onOpenChange(false)}>Assign BOM</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
