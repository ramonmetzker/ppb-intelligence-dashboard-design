'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowUpRight,
  BellSlash,
  Check,
  CheckCircle,
  CurrencyDollar,
  Package,
  Robot,
  RocketLaunch,
  SealCheck,
  Tray,
  X,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import {
  useNotifications,
  type AppNotification,
} from '@/components/shell/notification-provider'
import { usePreferences } from '@/components/shell/preferences-provider'
import { NOTIFICATION_TYPES, type NotificationType } from '@/lib/notifications'
import { USER } from '@/lib/preferences'
import { cn } from '@/lib/utils'

const TYPE_STYLE: Record<NotificationType, { icon: Icon; tile: string; text: string; bar: string }> = {
  sop: {
    icon: RocketLaunch,
    tile: 'bg-cat-sop/10 text-cat-sop',
    text: 'text-cat-sop',
    bar: 'bg-cat-sop',
  },
  bom: {
    icon: Package,
    tile: 'bg-cat-bom/10 text-cat-bom',
    text: 'text-cat-bom',
    bar: 'bg-cat-bom',
  },
  pricing: {
    icon: CurrencyDollar,
    tile: 'bg-cat-pricing/10 text-cat-pricing',
    text: 'text-cat-pricing',
    bar: 'bg-cat-pricing',
  },
  automation: {
    icon: Robot,
    tile: 'bg-cat-automation/10 text-cat-automation',
    text: 'text-cat-automation',
    bar: 'bg-cat-automation',
  },
}

type Filter = 'all' | 'pending' | NotificationType
type ReadFilter = 'all' | 'unread'

export function NotificationCenter({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { notifications, unreadCount, pendingAckCount, markAllRead, clearRead, isLoading } =
    useNotifications()
  const { t, knoxAlerts } = usePreferences()
  const copy = t.notifications
  const [filter, setFilter] = useState<Filter>('all')
  const [readFilter, setReadFilter] = useState<ReadFilter>('all')

  const unreadByType = (type: NotificationType) =>
    notifications.filter((n) => n.type === type && !n.read).length

  const scoped = notifications.filter((n) => {
    if (filter === 'all') return true
    if (filter === 'pending') return n.requiresAck && !n.acknowledgedAt
    return n.type === filter
  })
  const visible = readFilter === 'unread' ? scoped.filter((n) => !n.read) : scoped
  const hasRead = notifications.some((n) => n.read && !(n.requiresAck && !n.acknowledgedAt))

  const heading =
    filter === 'all'
      ? copy.title
      : filter === 'pending'
        ? copy.needsAck
        : copy.typeLabels[filter]
  const subheading =
    filter === 'all'
      ? unreadCount > 0
        ? copy.unreadCount(unreadCount)
        : copy.caughtUp
      : filter === 'pending'
        ? copy.ackPrompt
        : copy.typeNames[filter]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-busy={isLoading}
        className="flex h-[min(660px,84vh)] flex-row gap-0 overflow-hidden p-0 sm:max-w-[920px]"
      >
        <nav
          aria-label={copy.filterLabel}
          className="hidden w-60 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-muted/40 p-3 sm:flex"
        >
          <div className="flex flex-col gap-0.5">
            <SidebarHeading>{copy.inbox}</SidebarHeading>
            <SidebarItem
              active={filter === 'all'}
              onSelect={() => setFilter('all')}
              icon={<Tray size={15} aria-hidden="true" />}
              label={copy.all}
              count={unreadCount}
            />
            <SidebarItem
              active={filter === 'pending'}
              onSelect={() => setFilter('pending')}
              icon={<SealCheck size={15} aria-hidden="true" />}
              label={copy.needsAck}
              count={pendingAckCount}
              emphasize
            />
          </div>

          <div className="flex flex-col gap-0.5">
            <SidebarHeading>{copy.types}</SidebarHeading>
            {NOTIFICATION_TYPES.map((type) => {
              const { icon: TypeIcon, tile } = TYPE_STYLE[type]
              return (
                <SidebarItem
                  key={type}
                  active={filter === type}
                  onSelect={() => setFilter(type)}
                  icon={
                    <span
                      aria-hidden="true"
                      className={cn('flex size-5 items-center justify-center rounded', tile)}
                    >
                      <TypeIcon size={12} weight="fill" />
                    </span>
                  }
                  label={copy.typeLabels[type]}
                  count={unreadByType(type)}
                />
              )
            })}
          </div>
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex flex-col gap-3 border-b border-border px-5 pt-4 pb-3 pr-12">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <DialogTitle className="font-display text-[15px] font-semibold tracking-tight">
                  {heading}
                </DialogTitle>
                <DialogDescription className="mt-1 text-[12px]">{subheading}</DialogDescription>
              </div>
              <button
                type="button"
                onClick={markAllRead}
                disabled={unreadCount === pendingAckCount}
                className="flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-[12px] font-medium text-brand transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:text-muted-foreground/60"
              >
                <Check size={13} aria-hidden="true" />
                {copy.markAllRead}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
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
                    aria-selected={readFilter === value}
                    onClick={() => setReadFilter(value)}
                    className={cn(
                      'h-6 rounded-[3px] px-2.5 text-[12px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring',
                      readFilter === value
                        ? 'bg-card text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {copy[value]}
                  </button>
                ))}
              </div>

              <div
                role="group"
                aria-label={copy.types}
                className="flex items-center gap-1 sm:hidden"
              >
                {NOTIFICATION_TYPES.map((type) => {
                  const { icon: TypeIcon, tile } = TYPE_STYLE[type]
                  return (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={filter === type}
                      aria-label={copy.typeLabels[type]}
                      onClick={() => setFilter(filter === type ? 'all' : type)}
                      className={cn(
                        'flex size-7 items-center justify-center rounded-md ring-1 ring-transparent focus-visible:outline-2 focus-visible:outline-ring',
                        tile,
                        filter === type && 'ring-current',
                      )}
                    >
                      <TypeIcon size={14} weight="fill" aria-hidden="true" />
                    </button>
                  )
                })}
              </div>
            </div>
          </header>

          {isLoading ? (
            <div role="status" aria-label="Loading notifications" className="flex min-h-0 flex-1 flex-col gap-4 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-2/5" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState filter={filter} readFilter={readFilter} />
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

          <footer className="flex flex-col gap-2 border-t border-border px-5 py-2.5">
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
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SidebarHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 pb-1 text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase">
      {children}
    </p>
  )
}

function SidebarItem({
  active,
  onSelect,
  icon,
  label,
  count,
  emphasize = false,
}: {
  active: boolean
  onSelect: () => void
  icon: React.ReactNode
  label: string
  count: number
  emphasize?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'flex h-8 items-center gap-2 rounded-md px-2 text-left text-[12.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring',
        active
          ? 'bg-card text-foreground shadow-xs ring-1 ring-border'
          : 'text-muted-foreground hover:bg-card/70 hover:text-foreground',
      )}
    >
      <span className="flex w-5 shrink-0 items-center justify-center">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count > 0 && (
        <span
          className={cn(
            'tnum flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10.5px] font-semibold',
            emphasize ? 'bg-warning text-primary-foreground' : 'bg-brand-soft text-brand',
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}

function NotificationRow({
  notification,
  onNavigate,
}: {
  notification: AppNotification
  onNavigate: () => void
}) {
  const { markRead, dismiss, acknowledge } = useNotifications()
  const { t, language } = usePreferences()
  const copy = t.notifications
  const style = TYPE_STYLE[notification.type]
  const TypeIcon = style.icon
  const label = copy.typeLabels[notification.type]
  const pending = notification.requiresAck && !notification.acknowledgedAt

  return (
    <li
      className={cn(
        'group relative flex gap-3 px-5 py-3.5 transition-colors hover:bg-muted/60 focus-within:bg-muted/60',
        !notification.read && 'bg-brand-soft/40',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md',
          style.tile,
        )}
      >
        <TypeIcon size={17} weight="fill" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={cn('text-[10.5px] font-semibold tracking-wider uppercase', style.text)}>
              {label}
            </p>
            <p
              className={cn(
                'mt-0.5 text-[13px] leading-snug text-pretty',
                notification.read
                  ? 'font-medium text-foreground/80'
                  : 'font-semibold text-foreground',
              )}
            >
              {!notification.read && <span className="sr-only">{copy.unreadSr}</span>}
              {pending && <span className="sr-only">{copy.pendingSr}</span>}
              <span className="sr-only">{label}. </span>
              {notification.title}
            </p>
          </div>
          <span className="tnum mt-px shrink-0 text-[11px] text-muted-foreground">
            {notification.time}
          </span>
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-pretty text-muted-foreground">
          {notification.body}
        </p>

        {pending && (
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2">
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-warning">{copy.ackRequired}</p>
              <p className="text-[11.5px] text-muted-foreground">{copy.ackPrompt}</p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => acknowledge(notification.id)}
              aria-label={copy.ackAria(notification.title)}
            >
              <Check data-icon="inline-start" aria-hidden="true" />
              {copy.ackButton}
            </Button>
          </div>
        )}

        {notification.acknowledgedAt && (
          <p className="mt-2 flex items-center gap-1.5 text-[11.5px] font-medium text-success">
            <CheckCircle size={14} weight="fill" aria-hidden="true" />
            {copy.ackedBy(USER.fullName, formatAckTime(notification.acknowledgedAt, language))}
          </p>
        )}

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
          {!pending && (
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
          )}
        </div>
      </div>

      {!notification.read && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-0 bottom-0 left-0 w-[2px]',
            pending ? 'bg-warning' : style.bar,
          )}
        />
      )}
    </li>
  )
}

function formatAckTime(iso: string, language: string) {
  return new Date(iso).toLocaleString(language, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function EmptyState({ filter, readFilter }: { filter: Filter; readFilter: ReadFilter }) {
  const { t } = usePreferences()
  const copy = t.notifications
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <BellSlash size={18} aria-hidden="true" />
      </span>
      <p className="text-[13px] font-medium text-foreground">
        {filter === 'pending'
          ? copy.emptyPending
          : readFilter === 'unread'
            ? copy.emptyUnread
            : copy.emptyAll}
      </p>
      <p className="max-w-[28ch] text-[12px] text-pretty text-muted-foreground">
        {copy.emptyHint}
      </p>
    </div>
  )
}
