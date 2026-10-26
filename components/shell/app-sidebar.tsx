'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Cube,
  CaretUpDown,
  ChartBar,
  GitBranch,
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
  const { t, user, setUserDialogOpen } = usePreferences()
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <aside
      aria-label={t.nav.primary}
      className="sticky top-2 hidden h-[calc(100vh-1rem)] w-[200px] shrink-0 flex-col rounded-lg border border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex"
    >
      <Link href="/" className="flex items-center gap-2.5 px-3.5 pt-4 pb-3.5">
        <PpbMark size={28} className="shrink-0" />
        <div className="min-w-0 leading-tight">
          <p className="font-display truncate text-[14px] font-semibold tracking-tight text-white">
            PPB Intelligence
          </p>
          <p className="truncate text-[10.5px] text-sidebar-foreground/55">
            {t.nav.appSubtitle}
          </p>
        </div>
      </Link>

      <div className="mx-3.5 h-px bg-sidebar-border" />

      <nav aria-label={t.nav.pages} className="scroll-dark flex-1 overflow-y-auto px-2 py-3">
        <div className="flex flex-col gap-4">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-2.5 text-[10px] font-medium tracking-[0.1em] text-sidebar-foreground/40 uppercase">
                {t.nav[group.label]}
              </p>
              <ul className="flex flex-col gap-0.5">
                {group.items.map(({ label, href, icon: NavIcon }) => {
                  const active = isActive(href)
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[12.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring',
                          active
                            ? 'bg-sidebar-accent text-white'
                            : 'text-sidebar-foreground/70 hover:bg-white/5 hover:text-white',
                        )}
                      >
                        {active && (
                          <span
                            aria-hidden="true"
                            className="absolute top-1.5 bottom-1.5 -left-2 w-[2px] bg-brand"
                          />
                        )}
                        <NavIcon
                          size={16}
                          weight={active ? 'fill' : 'regular'}
                          className={
                            active ? 'text-(--sidebar-highlight)' : 'text-sidebar-foreground/45'
                          }
                          aria-hidden="true"
                        />
                        {t.nav[label]}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="flex flex-col gap-2 border-t border-sidebar-border p-2">
        <SidebarPlanSwitcher />
        <button
          type="button"
          onClick={() => setUserDialogOpen(true)}
          aria-haspopup="dialog"
          aria-label={`${user.fullName}. ${t.topBar.account}`}
          className="flex items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <span
            aria-hidden="true"
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink-raised text-[10px] font-medium text-white"
          >
            {user.initials}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[12px] font-medium text-white">
              {user.fullName}
            </span>
            <span className="block truncate text-[10.5px] text-sidebar-foreground/50">
              {user.knoxId}
            </span>
          </span>
          <CaretUpDown size={12} className="text-sidebar-foreground/45" aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}
