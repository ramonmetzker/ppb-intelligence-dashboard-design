'use client'

import { useEffect, useState } from 'react'
import { Check, ChevronDown, LockKeyhole, Search, Sparkles } from 'lucide-react'
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

const ASSIGNMENT_OPTIONS: { id: AssignmentType; label: string }[] = [
  { id: 'previous', label: 'Previous BOM' },
  { id: 'reference', label: 'Reference BOM' },
  { id: 'fake', label: 'Fake BOM' },
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
      <DialogContent className="gap-0 overflow-hidden p-0 sm:!max-w-4xl">
        <DialogHeader className="border-b border-border bg-muted/25 px-6 py-4 pr-14">
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

        <div className="max-h-[min(78dvh,660px)] overflow-y-auto px-6 py-4">
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
                    'group relative flex min-h-16 flex-col items-start rounded-xl border p-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                    active ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-card hover:bg-muted/40',
                    disabled && 'cursor-not-allowed opacity-50 hover:bg-card',
                  )}
                >
                  <span className="mb-1.5 flex w-full items-center justify-between">
                    <span className={cn('flex size-6 items-center justify-center rounded-md', active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                      {option.id === 'previous' && <LockKeyhole className="size-3.5" aria-hidden="true" />}
                      {option.id === 'reference' && <Search className="size-3.5" aria-hidden="true" />}
                      {option.id === 'fake' && <Sparkles className="size-3.5" aria-hidden="true" />}
                    </span>
                    {active && <Check className="size-4 text-primary" aria-hidden="true" />}
                  </span>
                  <span className="text-[13px] font-semibold">{option.label}</span>
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
              <div className="p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[13px] font-medium">Reference BOM</p>
                  <Badge variant="secondary">Reference</Badge>
                </div>
                <Popover open={referenceOpen} onOpenChange={setReferenceOpen}>
                  <PopoverTrigger
                    render={
                      <Button variant="outline" className="h-9 w-full justify-between px-3 text-left font-normal" aria-label="Select reference model" />
                    }
                  >
                    <span className="truncate text-[13px] font-medium">{referenceBom.model}</span>
                    <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-(--anchor-width) min-w-0 max-w-[calc(100vw-3rem)] p-0">
                    <Command>
                      <CommandInput placeholder="Search models..." />
                      <CommandList className="mt-1 border-t border-border/60 pt-1">
                        <CommandEmpty>No reference BOMs found.</CommandEmpty>
                        {REFERENCE_BOM_OPTIONS.map((option) => (
                          <CommandItem
                            key={option.id}
                            value={option.model}
                            onSelect={() => {
                              setReferenceBom(option)
                              setReferenceOpen(false)
                            }}
                            className="gap-2 px-3 py-1.5"
                          >
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                              <Search className="size-3.5" aria-hidden="true" />
                            </span>
                            <span className="truncate text-[13px] font-medium">{option.model}</span>
                            {referenceBom.id === option.id && <Check className="ml-auto size-4 shrink-0 justify-self-end text-primary" aria-hidden="true" />}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {assignmentType === 'fake' && (
              <div className="p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[13px] font-medium">Fake BOM</p>
                  <Badge variant="secondary">Fake</Badge>
                </div>
                <div className="grid grid-cols-[minmax(7rem,1fr)_4.5rem_9.5rem] items-center gap-2 px-3 pb-1.5 text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  <span>Item</span>
                  <span className="text-right">Imported</span>
                  <span className="text-right">Local</span>
                </div>
                <div className="divide-y divide-border rounded-lg border border-border">
                  {PPB_BOM_ITEMS.map((item) => {
                    const local = localPercentages[item.id] ?? item.localDefault
                    return (
                      <div key={item.id} className="grid grid-cols-[minmax(7rem,1fr)_4.5rem_9.5rem] items-center gap-2 px-3 py-2">
                        <p className="truncate text-[13px] font-medium">{item.name}</p>
                        <span className="tnum whitespace-nowrap text-right text-[11px] text-muted-foreground">{100 - local}%</span>
                        <label className="flex min-w-0 items-center gap-2">
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
                          <span className="tnum shrink-0 whitespace-nowrap text-right text-[11px] font-semibold text-primary">{local}%</span>
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="!mx-0 !mb-0 items-center rounded-none border-t border-border !px-6 !py-3 sm:!justify-between">
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
