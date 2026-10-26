'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  BellSlash,
  Check,
  CheckCircle,
  Info,
  WarningDiamond,
  WarningOctagon,
  X,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import {
  useNotifications,
  type AppNotification,
  type Severity,
} from '@/components/shell/notification-provider'
import { usePreferences } from '@/components/shell/preferences-provider'
import { cn } from '@/lib/utils'

const SEVERITY: Record<Severity, { icon: Icon; tone: string }> = {
  critical: { icon: WarningOctagon, tone: 'bg-critical/10 text-critical' },
  warning: { icon: WarningDiamond, tone: 'bg-warning/10 text-warning' },
  success: { icon: CheckCircle, tone: 'bg-success/10 text-success' },
  info: { icon: Info, tone: 'bg-brand-soft text-brand' },
}

type Filter = 'all' | 'unread'

export function NotificationCenter({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { notifications, unreadCount, markAllRead, clearRead } = useNotifications()
  const { t, knoxAlerts } = usePreferences()
  const copy = t.notifications
  const [filter, setFilter] = useState<Filter>('all')

  const visible = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications
  const hasRead = notifications.some((n) => n.read)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[12vh] flex max-h-[76vh] translate-y-0 flex-col gap-0 p-0 sm:max-w-[480px]">
        <header className="flex flex-col gap-3 border-b border-border px-4 pt-4 pb-3 pr-12">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <DialogTitle className="font-display text-[15px] font-semibold tracking-tight">
                {copy.title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-[12px]">
                {unreadCount > 0 ? copy.unreadCount(unreadCount) : copy.caughtUp}
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-brand transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:text-muted-foreground/60"
            >
              <Check size={13} aria-hidden="true" />
              {copy.markAllRead}
            </button>
          </div>

          <div
            role="tablist"
            aria-label={copy.filterLabel}
            className="flex w-fit items-center gap-0.5 rounded-md bg-muted p-0.5"
          >
            {(['all', 'unread'] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={filter === value}
                onClick={() => setFilter(value)}
                className={cn(
                  'h-6 rounded-[3px] px-2.5 text-[12px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring',
                  filter === value
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {copy[value]}
                {value === 'unread' && unreadCount > 0 && (
                  <span className="tnum ml-1.5 text-brand">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        </header>

        {visible.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
            {visible.map((notification) => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                onNavigate={() => onOpenChange(false)}
              />
            ))}
          </ul>
        )}

        <footer className="flex flex-col gap-2 border-t border-border px-4 py-2.5">
          <p className="flex items-start gap-2 text-[11.5px] leading-snug text-pretty text-muted-foreground">
            <span
              aria-hidden="true"
              className={cn(
                'mt-1 size-1.5 shrink-0 rounded-full',
                knoxAlerts ? 'bg-brand' : 'bg-input',
              )}
            />
            {knoxAlerts ? copy.knoxOn : copy.knoxOff}
          </p>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11.5px] text-muted-foreground">
              {copy.count(notifications.length)}
            </p>
            <button
              type="button"
              onClick={clearRead}
              disabled={!hasRead}
              className="h-7 rounded-md px-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
            >
              {copy.clearRead}
            </button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  )
}

function NotificationRow({
  notification,
  onNavigate,
}: {
  notification: AppNotification
  onNavigate: () => void
}) {
  const { markRead, dismiss } = useNotifications()
  const { t } = usePreferences()
  const copy = t.notifications
  const { icon: SeverityIcon, tone } = SEVERITY[notification.severity]
  const label = copy[notification.severity]

  return (
    <li
      className={cn(
        'group relative flex gap-3 px-4 py-3 transition-colors hover:bg-muted/60 focus-within:bg-muted/60',
        !notification.read && 'bg-brand-soft/40',
      )}
    >
      <span
        aria-hidden="true"
        className={cn('mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md', tone)}
      >
        <SeverityIcon size={15} weight="fill" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p
            className={cn(
              'text-[13px] leading-snug text-pretty',
              notification.read ? 'font-medium text-foreground/80' : 'font-semibold text-foreground',
            )}
          >
            {!notification.read && <span className="sr-only">{copy.unreadSr}</span>}
            <span className="sr-only">{label}. </span>
            {notification.title}
          </p>
          <span className="tnum mt-px shrink-0 text-[11px] text-muted-foreground">
            {notification.time}
          </span>
        </div>
        <p className="mt-0.5 text-[12px] leading-relaxed text-pretty text-muted-foreground">
          {notification.body}
        </p>

        <div className="mt-2 flex items-center gap-1">
          {notification.href && (
            <Link
              href={notification.href}
              onClick={() => {
                markRead(notification.id)
                onNavigate()
              }}
              className="flex h-6 items-center gap-1 rounded-md px-1.5 text-[12px] font-medium text-brand transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-ring"
            >
              {notification.hrefLabel ?? 'Open'}
              <ArrowUpRight size={12} aria-hidden="true" />
            </Link>
          )}
          <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
            {!notification.read && (
              <button
                type="button"
                onClick={() => markRead(notification.id)}
                aria-label={copy.markRead(notification.title)}
                className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <Check size={13} aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={() => dismiss(notification.id)}
              aria-label={copy.dismiss(notification.title)}
              className="flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {!notification.read && (
        <span
          aria-hidden="true"
          className="absolute top-0 bottom-0 left-0 w-[2px] bg-brand"
        />
      )}
    </li>
  )
}

function EmptyState({ filter }: { filter: Filter }) {
  const { t } = usePreferences()
  const copy = t.notifications
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <BellSlash size={18} aria-hidden="true" />
      </span>
      <p className="text-[13px] font-medium text-foreground">
        {filter === 'unread' ? copy.emptyUnread : copy.emptyAll}
      </p>
      <p className="max-w-[28ch] text-[12px] text-pretty text-muted-foreground">
        {copy.emptyHint}
      </p>
    </div>
  )
}
