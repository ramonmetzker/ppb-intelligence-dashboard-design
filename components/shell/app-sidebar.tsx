'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Cube,
  CaretUpDown,
  ChartBar,
  GitBranch,
  SidebarSimple,
  SquaresFour,
  Tag,
  WarningDiamond,
} from '@phosphor-icons/react'
import type { Icon } from '@phosphor-icons/react'
import { PpbMark } from '@/components/brand/ppb-mark'
import { SidebarPlanSwitcher } from '@/components/app/plan-switcher'
import { usePreferences } from '@/components/shell/preferences-provider'
import type { Dictionary } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type NavKey = keyof Dictionary['nav']

const GROUPS: {
  label: NavKey
  items: { label: NavKey; href: string; icon: Icon }[]
}[] = [
  {
    label: 'analyze',
    items: [
      { label: 'overview', href: '/', icon: SquaresFour },
      { label: 'production', href: '/production', icon: ChartBar },
      { label: 'items', href: '/items', icon: Cube },
    ],
  },
  {
    label: 'plan',
    items: [
      { label: 'simulation', href: '/simulation', icon: GitBranch },
      { label: 'materials', href: '/materials', icon: Tag },
    ],
  },
  {
    label: 'monitor',
    items: [{ label: 'risks', href: '/risks', icon: WarningDiamond }],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { t, user, setUserDialogOpen } = usePreferences()
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <aside
      aria-label={t.nav.primary}
      data-collapsed={collapsed}
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out lg:flex',
        collapsed ? 'w-[72px]' : 'w-60',
      )}
    >
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-4">
        <Link
          href="/"
          aria-label="PPB Intelligence"
          className={cn('flex min-w-0 flex-1 items-center', collapsed ? 'justify-center' : 'gap-3')}
        >
          <PpbMark size={30} className="shrink-0" />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <p className="font-display truncate text-[14px] font-semibold tracking-tight text-white">
                PPB Intelligence
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
        className={cn('scroll-dark flex-1 overflow-y-auto py-4', collapsed ? 'px-2.5' : 'px-3')}
      >
        <div className="flex flex-col gap-5">
          {GROUPS.map((group) => (
            <div key={group.label}>
              {collapsed ? (
                <div className="mx-2 mb-2 h-px bg-sidebar-border" aria-hidden="true" />
              ) : (
                <p className="mb-1.5 px-2.5 text-[10px] font-medium tracking-[0.12em] text-sidebar-foreground/40 uppercase">
                  {t.nav[group.label]}
                </p>
              )}
              <ul className="flex flex-col gap-1">
                {group.items.map(({ label, href, icon: NavIcon }) => {
                  const active = isActive(href)
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        aria-current={active ? 'page' : undefined}
                        aria-label={collapsed ? t.nav[label] : undefined}
                        title={collapsed ? t.nav[label] : undefined}
                        className={cn(
                          'relative flex h-10 items-center rounded-md text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring',
                          collapsed ? 'justify-center px-0' : 'gap-3 px-3',
                          active
                            ? 'bg-sidebar-accent text-white'
                            : 'text-sidebar-foreground/70 hover:bg-white/5 hover:text-white',
                        )}
                      >
                        {active && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-(--sidebar-highlight)"
                          />
                        )}
                        <NavIcon
                          size={19}
                          weight={active ? 'fill' : 'regular'}
                          className={cn(
                            'shrink-0',
                            active
                              ? 'text-(--sidebar-highlight)'
                              : 'text-sidebar-foreground/50',
                          )}
                          aria-hidden="true"
                        />
                        {!collapsed && <span className="truncate">{t.nav[label]}</span>}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="flex shrink-0 flex-col gap-2 border-t border-sidebar-border p-3">
        {!collapsed && <SidebarPlanSwitcher />}
        <button
          type="button"
          onClick={() => setUserDialogOpen(true)}
          aria-haspopup="dialog"
          aria-label={`${user.fullName}. ${t.topBar.account}`}
          title={collapsed ? user.fullName : undefined}
          className={cn(
            'flex h-10 items-center rounded-md text-left transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-ring',
            collapsed ? 'justify-center px-0' : 'gap-2.5 px-2',
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
        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex h-9 items-center rounded-md border border-sidebar-border text-[11px] font-medium text-sidebar-foreground/65 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-ring',
            collapsed ? 'justify-center' : 'gap-2.5 px-2.5',
          )}
        >
          <SidebarSimple size={17} weight="regular" aria-hidden="true" />
          {!collapsed && <span>Collapse sidebar</span>}
        </button>
      </div>
    </aside>
  )
}
