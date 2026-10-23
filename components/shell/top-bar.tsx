'use client'

import { ArrowsClockwise, Bell } from '@phosphor-icons/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const FILTERS = [
  { label: 'Business', value: 'GBM', options: ['GBM'] },
  { label: 'Product', value: 'HHP', options: ['HHP', 'Tablet', 'Wearable'] },
  { label: 'Year', value: '2026', options: ['2026', '2025'] },
]

export function TopBar() {
  return (
    <header className="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-2 py-1.5">
      <div className="flex flex-wrap items-center gap-3">
        {FILTERS.map((filter) => (
          <div key={filter.label} className="flex items-center gap-1.5">
            <span className="eyebrow">{filter.label}</span>
            <Select defaultValue={filter.value}>
              <SelectTrigger
                aria-label={filter.label}
                className="h-7 w-[92px] rounded-md border-input bg-card text-[12px] font-medium shadow-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {filter.options.map((option) => (
                  <SelectItem
                    key={option}
                    value={option}
                    disabled={option !== filter.value}
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <p className="tnum mr-2 text-[11.5px] text-muted-foreground">
          October closed. Updated Nov 06, 08:42
        </p>
        <button
          type="button"
          aria-label="Sync status: up to date"
          className="relative flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
        >
          <ArrowsClockwise size={15} aria-hidden="true" />
          <span aria-hidden="true" className="absolute top-1 right-1 size-1.5 rounded-[1px] bg-success" />
        </button>
        <button
          type="button"
          aria-label="Notifications, 3 unread"
          className="relative flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
        >
          <Bell size={15} aria-hidden="true" />
          <span aria-hidden="true" className="absolute top-1 right-1 size-1.5 rounded-[1px] bg-brand" />
        </button>
      </div>
    </header>
  )
}
