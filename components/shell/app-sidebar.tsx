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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
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
    <SidebarMenu className={cn(collapsed && 'items-center', compact ? 'gap-0.5' : 'gap-1')}>
      {group.items.map(({ label, href, icon: NavIcon }) => {
        const active = isActive(href)
        const isReferenceBom = href === '/raw-data/reference-bom'
        const count = isReferenceBom
          ? referenceBomUnassignedCount
          : href === '/rpa-monitor'
            ? errorCount
            : 0
        const countLabel = isReferenceBom
          ? `${count} ${count === 1 ? 'model' : 'models'} pending BOM assignment`
          : `${count} failed ${count === 1 ? 'RPA' : 'RPAs'}`

        return (
          <SidebarMenuItem key={href}>
            <SidebarMenuButton
              render={
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  aria-label={collapsed ? t.nav[label] : undefined}
                  title={collapsed ? t.nav[label] : undefined}
                />
              }
              isActive={active}
              tooltip={collapsed ? t.nav[label] : undefined}
              size={compact ? 'sm' : 'default'}
              className="relative font-medium"
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-(--sidebar-highlight)"
                />
              )}
              <NavIcon
                weight={active ? 'fill' : 'regular'}
                className={cn(
                  active ? 'text-(--sidebar-highlight)' : 'text-sidebar-foreground/50',
                )}
                aria-hidden="true"
              />
              <span>{t.nav[label]}</span>
            </SidebarMenuButton>
            {count > 0 && (
              <SidebarMenuBadge
                aria-label={countLabel}
                title={countLabel}
                className={cn(
                  'tnum rounded-md px-1.5 text-[11px] font-semibold text-primary-foreground',
                  isReferenceBom ? 'bg-warning' : 'bg-critical',
                )}
              >
                {count > 99 ? '99+' : count}
              </SidebarMenuBadge>
            )}
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )

  return (
    <Sidebar
      aria-label={t.nav.primary}
      role="navigation"
      collapsible="icon"
      className="!border-r-0"
    >
      <SidebarHeader
        className={cn(
          'h-16 shrink-0',
          collapsed ? 'items-center p-2' : 'px-4 py-3',
        )}
      >
        <Link
          href="/"
          aria-label="PPB"
          className={cn(
            'flex min-w-0 items-center',
            collapsed ? 'size-11 justify-center' : 'flex-1 gap-3',
          )}
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
      </SidebarHeader>

      <SidebarContent className="sidebar-scroll scroll-dark p-3">
        <div className="flex flex-col gap-4">
          {NAV_GROUPS.map((group) => {
            const isCollapsible = group.label === 'rawData'
            const groupHasActiveItem = group.items.some(({ href }) => isActive(href))
            const groupOpen = collapsed || !isCollapsible || rawDataOpen || groupHasActiveItem

            if (isCollapsible && !collapsed) {
              return (
                <Collapsible
                  key={group.label}
                  open={groupOpen}
                  onOpenChange={setRawDataOpen}
                  className="group/collapsible"
                >
                  <SidebarGroup className="p-0">
                    <CollapsibleTrigger className="group mb-1 flex h-8 w-full items-center justify-between rounded-md px-2 text-left text-[10px] font-medium tracking-[0.12em] text-sidebar-foreground/40 uppercase transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground/70 focus-visible:outline-2 focus-visible:outline-ring">
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
                      <SidebarGroupContent>{renderItems(group, true)}</SidebarGroupContent>
                    </CollapsibleContent>
                  </SidebarGroup>
                </Collapsible>
              )
            }

            return (
              <SidebarGroup key={group.label} className="p-0">
                <SidebarGroupLabel>{t.nav[group.label]}</SidebarGroupLabel>
                {groupOpen && <SidebarGroupContent>{renderItems(group)}</SidebarGroupContent>}
              </SidebarGroup>
            )
          })}
        </div>
      </SidebarContent>

      <SidebarFooter className="shrink-0 p-3">
        <SidebarMenu className={collapsed ? 'items-center' : undefined}>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={collapsed ? user.fullName : undefined}
              render={
                <button
                  type="button"
                  onClick={() => setUserDialogOpen(true)}
                  aria-haspopup="dialog"
                  aria-label={`${user.fullName}. ${t.topBar.account}`}
                />
              }
              className="font-normal"
            >
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink-raised text-[10px] font-medium text-white"
              >
                {user.initials}
              </span>
              {!collapsed && (
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[12px] font-medium text-white">
                    {user.fullName}
                  </span>
                  <span className="block truncate text-[10.5px] text-sidebar-foreground/50">
                    {user.knoxId}
                  </span>
                </span>
              )}
              {!collapsed && (
                <CaretUpDown
                  size={12}
                  className="ml-auto text-sidebar-foreground/45"
                  aria-hidden="true"
                />
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
