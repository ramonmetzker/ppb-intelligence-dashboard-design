import {
  ArrowsLeftRight,
  CaretUpDown,
  ChartBar,
  ChartLineUp,
  GitBranch,
  ListChecks,
  SquaresFour,
  WarningDiamond,
} from '@phosphor-icons/react/dist/ssr'
import type { Icon } from '@phosphor-icons/react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PpbMark } from '@/components/brand/ppb-mark'

const NAV: { label: string; href: string; icon: Icon }[] = [
  { label: 'Overview', href: '#overview', icon: SquaresFour },
  { label: 'Scenarios', href: '#scenarios', icon: GitBranch },
  { label: 'Trajectory', href: '#trajectory', icon: ChartLineUp },
  { label: 'What changes', href: '#changes', icon: ArrowsLeftRight },
  { label: 'Volume', href: '#volume', icon: ChartBar },
  { label: 'Risk drivers', href: '#drivers', icon: WarningDiamond },
  { label: 'Data readiness', href: '#readiness', icon: ListChecks },
]

export function AppSidebar() {
  return (
    <aside
      aria-label="Primary"
      className="sticky top-2 hidden h-[calc(100vh-1rem)] w-[196px] shrink-0 flex-col rounded-lg border border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex"
    >
      <div className="flex items-center gap-2.5 px-3.5 pt-4 pb-3.5">
        <PpbMark size={28} className="shrink-0" />
        <div className="min-w-0 leading-tight">
          <p className="font-display truncate text-[14px] font-semibold tracking-tight text-white">
            PPB Intelligence
          </p>
          <p className="truncate text-[10.5px] text-sidebar-foreground/55">
            Basic Productive Process
          </p>
        </div>
      </div>

      <div className="mx-3.5 h-px bg-sidebar-border" />

      <nav aria-label="Sections" className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="flex flex-col gap-0.5">
          {NAV.map(({ label, href, icon: NavIcon }, i) => {
            const active = i === 0
            return (
              <li key={label}>
                <a
                  href={href}
                  aria-current={active ? 'true' : undefined}
                  className={
                    active
                      ? 'relative flex h-8 items-center gap-2.5 rounded-md bg-sidebar-accent px-2.5 text-[12.5px] font-medium text-white'
                      : 'flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[12.5px] font-medium text-sidebar-foreground/70 transition-colors hover:bg-white/5 hover:text-white'
                  }
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
                    className={active ? 'text-[#7fa2ff]' : 'text-sidebar-foreground/45'}
                    aria-hidden="true"
                  />
                  {label}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="flex flex-col gap-2 border-t border-sidebar-border p-2">
        <div className="rounded-md border border-sidebar-border bg-ink-raised px-2.5 py-2">
          <p className="text-[10px] tracking-[0.08em] text-sidebar-foreground/50 uppercase">
            Model
          </p>
          <p className="mt-0.5 flex items-center justify-between text-[12px] font-medium text-white">
            Forecast v3.2
            <span aria-hidden="true" className="size-1.5 rounded-[1px] bg-success" />
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-white/5"
        >
          <Avatar size="sm" className="after:hidden">
            <AvatarFallback className="bg-ink-raised text-[10px] font-medium text-white">
              RA
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[12px] font-medium text-white">
              Rafael Alves
            </span>
            <span className="block truncate text-[10.5px] text-sidebar-foreground/50">
              PPB analyst
            </span>
          </span>
          <CaretUpDown size={12} className="text-sidebar-foreground/45" aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}
