'use client'

import { useMemo } from 'react'
import { ITEMS, type ItemKey } from '@/lib/ppb-model'
import { fmtPct } from '@/lib/material-store'
import { useMaterials } from '@/components/materials/material-provider'
import { cn } from '@/lib/utils'

type Stat = {
  key: ItemKey
  materials: number
  vendors: number
  local: number
  /** Average gap between the cheapest local and the cheapest import quote, across materials that have both. */
  premium: number | null
}

export function PriceSummary() {
  const { book } = useMaterials()

  const stats = useMemo<Stat[]>(
    () =>
      ITEMS.map((item) => {
        const codes = Object.values(book.materials)
          .filter((m) => m.item === item.key)
          .map((m) => m.code)
        let vendors = 0
        let local = 0
        const gaps: number[] = []
        for (const code of codes) {
          const entries = book.entries.filter((e) => e.code === code)
          vendors += entries.length
          local += entries.filter((e) => e.origin === 'local').length
          const cheapest = (origin: 'local' | 'import') => {
            const prices = entries.filter((e) => e.origin === origin).map((e) => e.price)
            return prices.length ? Math.min(...prices) : null
          }
          const l = cheapest('local')
          const i = cheapest('import')
          if (l != null && i != null) gaps.push(l / i - 1)
        }
        return {
          key: item.key,
          materials: codes.length,
          vendors,
          local,
          premium: gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null,
        }
      }),
    [book],
  )

  return (
    <section
      aria-label="Local premium by PPB item"
      className="grid grid-cols-2 overflow-hidden rounded-lg border border-border bg-card md:grid-cols-5"
    >
      {stats.map((stat, index) => {
        const item = ITEMS.find((i) => i.key === stat.key)!
        const importCount = stat.vendors - stat.local
        return (
          <div
            key={stat.key}
            className={cn(
              'flex flex-col gap-2 p-3.5',
              index > 0 && 'md:border-l md:border-border',
              index > 0 && index % 2 === 1 && 'border-l border-border md:border-l',
              index >= 2 && 'border-t border-border md:border-t-0',
            )}
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2 rounded-[1px] ring-1 ring-border"
                style={{ background: item.color }}
              />
              <p className="text-[12px] font-medium">{item.name}</p>
            </div>
            <div>
              <p className="font-display text-[22px] leading-6 font-semibold tracking-tight tabular-nums">
                {stat.premium == null ? 'n/a' : fmtPct(stat.premium)}
              </p>
              <p className="text-[11px] text-muted-foreground">local vs import, cheapest quotes</p>
            </div>
            <div className="mt-auto flex flex-col gap-1">
              <div
                role="img"
                aria-label={`${stat.local} local and ${importCount} import vendors`}
                className="flex h-1.5 overflow-hidden rounded-[1px] bg-secondary"
              >
                <span className="bg-brand" style={{ width: `${stat.vendors ? (stat.local / stat.vendors) * 100 : 0}%` }} />
              </div>
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {stat.materials} materials, {stat.local} local / {importCount} import vendors
              </p>
            </div>
          </div>
        )
      })}
    </section>
  )
}
