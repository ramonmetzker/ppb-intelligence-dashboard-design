'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bell, SidebarSimple } from '@phosphor-icons/react'
import { SidebarPlanSwitcher } from '@/components/app/plan-switcher'
import { GbmSelector } from '@/components/shell/gbm-selector'
import { ProductContextSelector } from '@/components/shell/product-context-selector'
import { NotificationCenter } from '@/components/shell/notification-center'
import { useShell } from '@/components/shell/shell-provider'
import { useNotifications } from '@/components/shell/notification-provider'
import { usePreferences } from '@/components/shell/preferences-provider'
import { cn } from '@/lib/utils'

export function TopBar() {
  const [centerOpen, setCenterOpen] = useState(false)
  const pathname = usePathname()
  const isOverview = pathname === '/'
  const isProducts = pathname.startsWith('/products')
  const isRpaMonitor = pathname.startsWith('/rpa-monitor')
  const showProductSelector = !isProducts && !isRpaMonitor
  const hasContextSelectors = isOverview || isProducts || showProductSelector
  const { unreadCount, syncing, syncLabel } = useNotifications()
  const { collapsed, toggleSidebar } = useShell()
  const { t } = usePreferences()

  const copy = t.topBar
  const updated = syncLabel === 'just now' ? copy.justNow : syncLabel

  return (
    <div className="bg-sidebar text-sidebar-foreground">
      <header className="flex h-16 items-center justify-between gap-3 px-3 lg:px-4">
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex size-8 items-center justify-center rounded-md text-sidebar-foreground/45 transition-colors hover:bg-sidebar-accent hover:text-white focus-visible:outline-2 focus-visible:outline-sidebar-ring"
          >
            <SidebarSimple size={17} aria-hidden="true" />
          </button>

          <span aria-hidden="true" className="mx-1 h-5 w-px bg-sidebar-border" />

          <button
            type="button"
            onClick={() => setCenterOpen(true)}
            aria-label={
              unreadCount > 0 ? copy.notificationsUnread(unreadCount) : copy.notifications
            }
            aria-haspopup="dialog"
            className="relative flex size-9 items-center justify-center rounded-lg text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-white focus-visible:outline-2 focus-visible:outline-sidebar-ring"
          >
            <Bell size={15} aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="tnum absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] leading-none font-semibold text-primary-foreground ring-2 ring-ink-raised"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <p
            role="status"
            className="tnum hidden items-center gap-2 text-[11px] text-sidebar-foreground/50 xl:flex"
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
        </div>

        {hasContextSelectors && (
          <div className="scroll-dark flex min-w-0 items-center justify-end gap-4 overflow-x-auto">
            {isProducts ? (
              <GbmSelector />
            ) : (
              <>
                {isOverview && (
                  <div className="w-48 shrink-0">
                    <SidebarPlanSwitcher topbar />
                  </div>
                )}
                {showProductSelector && <ProductContextSelector />}
              </>
            )}
          </div>
        )}
      </header>

      <NotificationCenter open={centerOpen} onOpenChange={setCenterOpen} />
    </div>
  )
}
