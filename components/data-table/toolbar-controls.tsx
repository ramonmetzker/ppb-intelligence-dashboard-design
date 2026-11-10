'use client'

import { ChevronLeft, ChevronRight, Columns3, Rows3, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Density } from '@/lib/data-table/types'
import type { DataTableLabels } from './filter-utils'

const triggerClass =
  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-input bg-card px-2.5 text-[13px] font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-[popup-open]:bg-muted'

export type ColumnToggle = { id: string; header: string; visible: boolean; hideable: boolean }

export function ColumnsMenu({
  columns,
  labels,
  onToggle,
  onReset,
}: {
  columns: ColumnToggle[]
  labels: DataTableLabels
  onToggle: (id: string, visible: boolean) => void
  onReset: () => void
}) {
  const hiddenCount = columns.filter((c) => !c.visible).length
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={triggerClass} aria-label={labels.columns}>
        <Columns3 aria-hidden="true" className="size-4" />
        <span className="hidden lg:inline">{labels.columns}</span>
        {hiddenCount > 0 && (
          <span className="tnum rounded-full bg-brand-soft px-1.5 text-[11px] text-brand-deep">-{hiddenCount}</span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 min-w-52 overflow-y-auto">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{labels.columns}</DropdownMenuLabel>
          {columns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.visible}
              disabled={!column.hideable}
              closeOnClick={false}
              onCheckedChange={(checked) => onToggle(column.id, checked)}
            >
              {column.header}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onReset}>{labels.resetColumns}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function DensityMenu({
  value,
  labels,
  onChange,
}: {
  value: Density
  labels: DataTableLabels
  onChange: (density: Density) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={triggerClass} aria-label={labels.density}>
        <Rows3 aria-hidden="true" className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{labels.density}</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as Density)}>
            <DropdownMenuRadioItem value="compact">{labels.compact}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="default">{labels.default}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="comfortable">{labels.comfortable}</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ScrollControls({
  canScrollLeft,
  canScrollRight,
  jumpTargets,
  labels,
  onScroll,
  onJump,
}: {
  canScrollLeft: boolean
  canScrollRight: boolean
  jumpTargets: { id: string; header: string }[]
  labels: DataTableLabels
  onScroll: (direction: -1 | 1) => void
  onJump: (id: string) => void
}) {
  return (
    <div className="flex shrink-0 items-center rounded-lg border border-input bg-card">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-r-none"
        disabled={!canScrollLeft}
        aria-label={labels.scrollLeft}
        onClick={() => onScroll(-1)}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      {jumpTargets.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex size-7 items-center justify-center border-x border-input text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[popup-open]:bg-muted"
            aria-label={labels.jumpToColumn}
          >
            <SlidersHorizontal aria-hidden="true" className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-72 min-w-44 overflow-y-auto">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{labels.jumpToColumn}</DropdownMenuLabel>
              {jumpTargets.map((target) => (
                <DropdownMenuItem key={target.id} onClick={() => onJump(target.id)}>
                  {target.header}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-l-none"
        disabled={!canScrollRight}
        aria-label={labels.scrollRight}
        onClick={() => onScroll(1)}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  )
}

export type FilterChip = { key: string; label: string; onRemove: () => void }

export function ActiveFilters({
  chips,
  labels,
  onClearAll,
}: {
  chips: FilterChip[]
  labels: DataTableLabels
  onClearAll: () => void
}) {
  if (chips.length === 0) return null
  return (
    <ul className="flex flex-wrap items-center gap-1.5" aria-label={labels.filter}>
      {chips.map((chip) => (
        <li
          key={chip.key}
          className="flex h-7 max-w-full items-center gap-1 rounded-full border border-brand/30 bg-brand-soft pr-1 pl-2.5 text-xs text-brand-deep"
        >
          <span className="min-w-0 truncate">{chip.label}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            aria-label={`${labels.removeFilter}: ${chip.label}`}
            className="inline-flex size-5 shrink-0 items-center justify-center rounded-full outline-none hover:bg-brand/15 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X aria-hidden="true" className="size-3" />
          </button>
        </li>
      ))}
      <li>
        <Button type="button" variant="ghost" size="xs" onClick={onClearAll}>
          {labels.clearAll}
        </Button>
      </li>
    </ul>
  )
}
