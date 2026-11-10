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
import { usePreferences } from '@/components/shell/preferences-provider'
import { cn } from '@/lib/utils'

const FILTERS = [
  { label: 'gbm', value: 'MX', options: ['MX', 'VD', 'DA'] },
  { label: 'product', value: 'HHP', options: ['HHP', 'Tablet', 'Wearable'] },
  { label: 'year', value: '2026', options: ['2026', '2025'] },
] as const

export function TopBar() {
  const [centerOpen, setCenterOpen] = useState(false)
  const { unreadCount, syncing, syncLabel, sync } = useNotifications()
  const { t, user, setUserDialogOpen } = usePreferences()

  const copy = t.topBar
  const updated = syncLabel === 'just now' ? copy.justNow : syncLabel

  return (
    <div className="bg-sidebar text-sidebar-foreground">
      <header className="flex h-16 items-center justify-between gap-3 px-4 lg:px-5">
        <div className="scroll-dark flex min-w-0 items-center gap-2 overflow-x-auto">
          {FILTERS.map((filter) => (
            <div
              key={filter.label}
              className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent px-2.5"
            >
              <span className="text-[9px] font-semibold tracking-[0.14em] text-sidebar-foreground/45 uppercase">
                {copy[filter.label]}
              </span>
              <Select defaultValue={filter.value}>
                <SelectTrigger
                  aria-label={copy[filter.label]}
                  className="h-7 w-[76px] border-0 bg-transparent px-1 text-[12px] font-semibold text-sidebar-foreground shadow-none hover:bg-transparent focus-visible:ring-sidebar-ring"
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
            className="tnum hidden items-center gap-2 text-[11px] text-sidebar-foreground/55 xl:flex"
          >
            <span
              aria-hidden="true"
              className={cn(
                'size-1.5 rounded-full',
                syncing ? 'animate-pulse bg-warning' : 'bg-success',
              )}
            />
            {syncing ? copy.syncingData : copy.closedUpdated(updated)}
          </p>

          <span
            aria-hidden="true"
            className="mx-1 hidden h-5 w-px bg-sidebar-border xl:block"
          />

          <button
            type="button"
            onClick={sync}
            disabled={syncing}
            aria-label={syncing ? copy.syncing : copy.syncNow}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-sidebar-border bg-sidebar-accent px-3 text-[11px] font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-white focus-visible:outline-2 focus-visible:outline-sidebar-ring disabled:pointer-events-none disabled:opacity-50"
          >
            <ArrowsClockwise
              size={14}
              aria-hidden="true"
              className={cn(syncing && 'animate-spin')}
            />
            <span className="hidden sm:inline">{syncing ? copy.syncing : copy.sync}</span>
          </button>

          <button
            type="button"
            onClick={() => setCenterOpen(true)}
            aria-label={
              unreadCount > 0 ? copy.notificationsUnread(unreadCount) : copy.notifications
            }
            aria-haspopup="dialog"
            className="relative flex size-9 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent text-sidebar-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-white focus-visible:outline-2 focus-visible:outline-sidebar-ring"
          >
            <Bell size={15} aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="tnum absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] leading-none font-semibold text-primary-foreground ring-2 ring-sidebar"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setUserDialogOpen(true)}
            aria-label={`${user.fullName}. ${copy.account}`}
            aria-haspopup="dialog"
            className="font-display flex size-9 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent text-[11px] font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-white focus-visible:outline-2 focus-visible:outline-sidebar-ring"
          >
            {user.initials}
          </button>
        </div>
      </header>

      <NotificationCenter open={centerOpen} onOpenChange={setCenterOpen} />
    </div>
  )
}
