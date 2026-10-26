'use client'

import { useState } from 'react'
import { ArrowsClockwise, Bell } from '@phosphor-icons/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { NotificationCenter } from '@/components/shell/notification-center'
import { useNotifications } from '@/components/shell/notification-provider'
import { cn } from '@/lib/utils'

const FILTERS = [
  { label: 'GBM', value: 'MX', options: ['MX', 'VD', 'DA'] },
  { label: 'Product', value: 'HHP', options: ['HHP', 'Tablet', 'Wearable'] },
  { label: 'Year', value: '2026', options: ['2026', '2025'] },
]

export function TopBar() {
  const [centerOpen, setCenterOpen] = useState(false)
  const { unreadCount, syncing, syncLabel, sync } = useNotifications()

  return (
    <div className="pb-3">
      <header className="flex h-12 items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 shadow-xs">
        <div className="flex min-w-0 items-center gap-4 overflow-x-auto">
          {FILTERS.map((filter) => (
            <div key={filter.label} className="flex shrink-0 items-center gap-2">
              <span className="eyebrow">{filter.label}</span>
              <Select defaultValue={filter.value}>
                <SelectTrigger
                  aria-label={filter.label}
                  className="h-8 w-[96px] rounded-md border-input bg-background text-[12px] font-medium shadow-none"
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

        <div className="flex shrink-0 items-center gap-2">
          <p
            role="status"
            className="tnum hidden items-center gap-2 text-[12px] text-muted-foreground xl:flex"
          >
            <span
              aria-hidden="true"
              className={cn(
                'size-1.5 rounded-full',
                syncing ? 'animate-pulse bg-warning' : 'bg-success',
              )}
            />
            {syncing ? 'Syncing data...' : `October closed. Updated ${syncLabel}`}
          </p>

          <span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-border xl:block" />

          <button
            type="button"
            onClick={sync}
            disabled={syncing}
            aria-label={syncing ? 'Syncing data' : 'Sync data now'}
            className="flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-2.5 text-[12px] font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:text-muted-foreground"
          >
            <ArrowsClockwise
              size={14}
              aria-hidden="true"
              className={cn(syncing && 'animate-spin')}
            />
            <span className="hidden sm:inline">{syncing ? 'Syncing' : 'Sync'}</span>
          </button>

          <button
            type="button"
            onClick={() => setCenterOpen(true)}
            aria-label={
              unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
            }
            aria-haspopup="dialog"
            className="relative flex size-8 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          >
            <Bell size={15} aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="tnum absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] leading-none font-semibold text-primary-foreground ring-2 ring-card"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <NotificationCenter open={centerOpen} onOpenChange={setCenterOpen} />
    </div>
  )
}
