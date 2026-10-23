import {
  CaretUpDown,
  ChartLine,
  ChartLineUp,
  Cube,
  Database,
  Factory,
  GearSix,
  GitBranch,
  MathOperations,
  SquaresFour,
} from '@phosphor-icons/react/dist/ssr'
import type { Icon } from '@phosphor-icons/react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

const NAV: { label: string; icon: Icon; active?: boolean }[] = [
  { label: 'Overview', icon: SquaresFour, active: true },
  { label: 'Performance', icon: ChartLine },
  { label: 'Forecast', icon: ChartLineUp },
  { label: 'Optimization', icon: MathOperations },
  { label: 'Scenarios', icon: GitBranch },
  { label: 'Operations', icon: Factory },
  { label: 'Data', icon: Database },
  { label: 'Administration', icon: GearSix },
]

export function AppSidebar() {
  return (
    <aside
      aria-label="Primary"
      className="sticky top-3 hidden h-[calc(100vh-1.5rem)] w-[232px] shrink-0 flex-col rounded-2xl border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-[0_8px_24px_-12px_rgba(10,14,20,0.45)] lg:flex"
    >
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-brand/15 text-brand ring-1 ring-brand/30">
          <Cube size={20} weight="duotone" aria-hidden="true" />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[14px] font-semibold tracking-tight text-white">
            PPB Intelligence
          </p>
          <p className="truncate text-[11px] text-sidebar-foreground/60">
            Basic Productive Process
          </p>
        </div>
      </div>

      <div className="mx-4 h-px bg-sidebar-border" />

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.1em] text-sidebar-foreground/40">
          Workspace
        </p>
        <ul className="flex flex-col gap-1">
          {NAV.map(({ label, icon: NavIcon, active }) => (
            <li key={label}>
              <a
                href="#"
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors',
                  active
                    ? 'bg-sidebar-accent text-white'
                    : 'text-sidebar-foreground/70 hover:bg-white/5 hover:text-white',
                )}
              >
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r-full bg-brand"
                  />
                )}
                <NavIcon
                  size={18}
                  weight={active ? 'fill' : 'regular'}
                  className={active ? 'text-brand' : 'text-sidebar-foreground/50'}
                  aria-hidden="true"
                />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex flex-col gap-3 border-t border-sidebar-border p-3">
        <div className="grid grid-cols-[72px_1fr] gap-2">
          <ContextControl label="Business" value="MX" />
          <ContextControl label="Plant" value="Manaus" />
        </div>
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-white/5"
        >
          <Avatar size="default" className="after:hidden">
            <AvatarFallback className="bg-graphite-raised text-[11px] font-medium text-white">
              RA
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[13px] font-medium text-white">
              Rafael Alves
            </span>
            <span className="block truncate text-[11px] text-sidebar-foreground/55">
              PPB analyst
            </span>
          </span>
          <CaretUpDown
            size={14}
            className="text-sidebar-foreground/50"
            aria-hidden="true"
          />
        </button>
      </div>
    </aside>
  )
}

function ContextControl({ label, value }: { label: string; value: string }) {
  return (
    <button
      type="button"
      aria-label={`${label}: ${value}`}
      className="flex h-11 flex-col justify-center rounded-lg border border-sidebar-border bg-graphite-raised px-2.5 text-left transition-colors hover:border-white/20"
    >
      <span className="text-[10px] leading-none text-sidebar-foreground/50">
        {label}
      </span>
      <span className="mt-1 flex items-center justify-between text-[13px] leading-none font-medium text-white">
        {value}
        <CaretUpDown
          size={12}
          className="text-sidebar-foreground/45"
          aria-hidden="true"
        />
      </span>
    </button>
  )
}
