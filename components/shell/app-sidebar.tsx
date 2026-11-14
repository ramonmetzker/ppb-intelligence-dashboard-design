'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { CaretRight, CaretUpDown } from '@phosphor-icons/react'
import { PpbLoadingMark, PpbMark } from '@/components/brand/ppb-mark'
import { useRpas } from '@/components/rpa/rpa-provider'
import { useShell } from '@/components/shell/shell-provider'
import { usePreferences } from '@/components/shell/preferences-provider'
import { useNavigationTransition } from '@/components/app/route-progress'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { NAV_GROUPS, type AppNavGroup } from '@/components/shell/navigation'
import { countUnassignedSalesModels, SALES_ASSIGNMENT_ROWS } from '@/lib/reference-bom-data'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const pathname = usePathname()
  const { collapsed } = useShell()
  const isNavigating = useNavigationTransition()
  const { errorCount } = useRpas()
  const { t, user, setUserDialogOpen } = usePreferences()
  const [rawDataOpen, setRawDataOpen] = useState(false)
  const referenceBomUnassignedCount = countUnassignedSalesModels(SALES_ASSIGNMENT_ROWS)
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  const renderItems = (group: AppNavGroup, compact = false) => (
    <ul className={cn('flex flex-col', compact ? 'gap-0.5' : 'gap-1', collapsed && 'items-center')}>
      {group.items.map(({ label, href, icon: NavIcon }) => {
        const active = isActive(href)
        const isReferenceBom = href === '/raw-data/reference-bom'
        const count = isReferenceBom ? referenceBomUnassignedCount : href === '/rpa-monitor' ? errorCount : 0
        const countLabel = isReferenceBom
          ? `${count} ${count === 1 ? 'model' : 'models'} pending BOM assignment`
          : `${count} failed ${count === 1 ? 'RPA' : 'RPAs'}`
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? 'page' : undefined}
              aria-label={collapsed ? t.nav[label] : undefined}
              title={collapsed ? t.nav[label] : undefined}
              className={cn(
                'relative flex items-center rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring',
                compact ? 'h-8 text-[12px]' : 'h-10 text-[13px]',
                collapsed ? 'w-10 justify-center px-0' : compact ? 'gap-2.5 px-2.5' : 'gap-3 px-3',
                active
                  ? 'bg-sidebar-accent text-white'
                  : 'text-sidebar-foreground/70 hover:bg-white/5 hover:text-white',
              )}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-(--sidebar-highlight)"
                />
              )}
              <NavIcon
                size={compact ? 17 : 19}
                weight={active ? 'fill' : 'regular'}
                className={cn(
                  'shrink-0',
                  active ? 'text-(--sidebar-highlight)' : 'text-sidebar-foreground/50',
                )}
                aria-hidden="true"
              />
              {!collapsed && <span className="truncate">{t.nav[label]}</span>}
              {count > 0 && (
                <span
                  aria-label={countLabel}
                  title={countLabel}
                  className={cn(
                    'tnum flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-[11px] font-semibold text-primary-foreground',
                    isReferenceBom ? 'bg-warning' : 'bg-critical',
                    collapsed ? 'absolute top-0.5 right-0.5' : 'ml-auto',
                  )}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )

  return (
    <aside
      aria-label={t.nav.primary}
      data-collapsed={collapsed}
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-[width] duration-300 ease-out lg:flex',
        collapsed ? 'w-[76px]' : 'w-64',
      )}
    >
      <div className="flex h-16 shrink-0 items-center px-4">
        <Link
          href="/"
          aria-label="PPB"
          className={cn('flex min-w-0 items-center', collapsed ? 'w-11 justify-center' : 'flex-1 gap-3')}
        >
          <span className="flex size-11 shrink-0 items-center justify-center text-sidebar-primary-foreground">
            {isNavigating ? <PpbLoadingMark size={44} /> : <PpbMark size={44} />}
          </span>
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="font-display truncate text-[14px] font-semibold tracking-tight text-white">
                PPB
              </p>
              <p className="truncate text-[10.5px] text-sidebar-foreground/55">
                {t.nav.appSubtitle}
              </p>
            </div>
          )}
        </Link>
      </div>

      <nav
        aria-label={t.nav.pages}
        className={cn(
          'scroll-dark flex-1 overflow-y-auto py-3',
          collapsed ? 'px-0' : 'px-3',
        )}
      >
        <div className="flex flex-col gap-4">
          {NAV_GROUPS.map((group) => {
            const isCollapsible = group.label === 'rawData'
            const groupHasActiveItem = group.items.some(({ href }) => isActive(href))
            const groupOpen = collapsed || !isCollapsible || rawDataOpen || groupHasActiveItem

            return isCollapsible && !collapsed ? (
              <Collapsible key={group.label} open={groupOpen} onOpenChange={setRawDataOpen}>
                <CollapsibleTrigger className="group mb-1 flex h-7 w-full items-center justify-between rounded-md px-2.5 text-left text-[10px] font-medium tracking-[0.12em] text-sidebar-foreground/40 uppercase transition-colors hover:bg-white/5 hover:text-sidebar-foreground/70 focus-visible:outline-2 focus-visible:outline-ring">
                  <span>{t.nav[group.label]}</span>
                  <span className="flex items-center gap-1.5">
                    <span className="rounded bg-sidebar-accent/70 px-1.5 py-0.5 text-[9px] tracking-normal text-sidebar-foreground/45">
                      {group.items.length}
                    </span>
                    <CaretRight
                      size={13}
                      className="transition-transform duration-200 group-data-panel-open:rotate-90"
                      aria-hidden="true"
                    />
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
                  {renderItems(group, true)}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <div key={group.label} className={cn(collapsed && 'flex flex-col items-center')}>
                {collapsed ? (
                  <div className="mb-2 h-px w-10 bg-sidebar-border" aria-hidden="true" />
                ) : (
                  <p className="mb-1.5 px-2.5 text-[10px] font-medium tracking-[0.12em] text-sidebar-foreground/40 uppercase">
                    {t.nav[group.label]}
                  </p>
                )}
                {groupOpen && renderItems(group)}
              </div>
            )
          })}
        </div>
      </nav>

      <div className={cn('shrink-0 p-3', collapsed && 'flex justify-center')}>
        <button
          type="button"
          onClick={() => setUserDialogOpen(true)}
          aria-haspopup="dialog"
          aria-label={`${user.fullName}. ${t.topBar.account}`}
          title={collapsed ? user.fullName : undefined}
          className={cn(
            'flex h-10 w-full items-center rounded-md text-left transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-ring',
            collapsed ? 'w-10 justify-center px-0' : 'gap-2.5 px-2',
          )}
        >
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink-raised text-[10px] font-medium text-white"
          >
            {user.initials}
          </span>
          {!collapsed && (
            <>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[12px] font-medium text-white">
                  {user.fullName}
                </span>
                <span className="block truncate text-[10.5px] text-sidebar-foreground/50">
                  {user.knoxId}
                </span>
              </span>
              <CaretUpDown
                size={12}
                className="text-sidebar-foreground/45"
                aria-hidden="true"
              />
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
