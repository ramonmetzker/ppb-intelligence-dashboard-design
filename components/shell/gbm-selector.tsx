'use client'

import { useProducts } from '@/components/products/products-provider'
import { GBMS } from '@/lib/products/data'
import { cn } from '@/lib/utils'

/**
 * Top bar control for master data pages. These pages are scoped to a single GBM,
 * so it replaces the plan and product selectors.
 */
export function GbmSelector() {
  const { gbm, setGbm } = useProducts()

  return (
    <div className="flex items-center gap-3">
      <span id="gbm-label" className="text-[10px] font-semibold tracking-[0.12em] text-sidebar-foreground/50 uppercase">
        GBM
      </span>
      <div
        role="radiogroup"
        aria-labelledby="gbm-label"
        className="flex h-10 w-56 items-center gap-0.5 rounded-lg border border-sidebar-border bg-sidebar-accent/55 p-0.5"
      >
        {GBMS.map((value) => {
          const selected = gbm === value
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => setGbm(value)}
              onKeyDown={(event) => {
                const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0
                if (!step) return
                event.preventDefault()
                const next = GBMS[(GBMS.indexOf(value) + step + GBMS.length) % GBMS.length]
                setGbm(next)
                const group = event.currentTarget.parentElement
                requestAnimationFrame(() => group?.querySelector<HTMLButtonElement>(`[data-gbm="${next}"]`)?.focus())
              }}
              data-gbm={value}
              className={cn(
                'h-full flex-1 rounded-md text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
                selected
                  ? 'bg-brand text-primary-foreground'
                  : 'text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-white',
              )}
            >
              {value}
            </button>
          )
        })}
      </div>
    </div>
  )
}
