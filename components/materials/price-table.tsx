'use client'

import { Fragment, useMemo, useState } from 'react'
import {
  CaretRight,
  Check,
  ClockCounterClockwise,
  MagnifyingGlass,
  PencilSimple,
  X,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Segmented } from '@/components/app/segmented'
import { useMaterials } from '@/components/materials/material-provider'
import { ITEMS, ITEM_BY_KEY, type ItemKey } from '@/lib/ppb-model'
import {
  fmtDate,
  fmtPct,
  fmtPrice,
  type Material,
  type Origin,
  type PriceEntry,
  type PriceVersion,
} from '@/lib/material-store'
import { cn } from '@/lib/utils'

type ItemFilter = 'all' | 'none' | ItemKey
type OriginFilter = 'all' | Origin

const SELECT_CLASS =
  'h-8 rounded-md border border-border bg-card px-2 text-[12.5px] focus-visible:outline-2 focus-visible:outline-ring'

function OriginChip({ origin }: { origin: Origin }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center rounded-sm px-1.5 text-[11px] font-medium',
        origin === 'local' ? 'bg-brand/10 text-brand' : 'bg-secondary text-muted-foreground',
      )}
    >
      {origin === 'local' ? 'Local' : 'Import'}
    </span>
  )
}

function ItemBadge({ item }: { item: ItemKey }) {
  const def = ITEM_BY_KEY[item]
  return (
    <span className="inline-flex h-5 items-center gap-1.5 rounded-sm bg-secondary px-1.5 text-[11px] font-medium">
      <span
        aria-hidden="true"
        className="size-2 rounded-[1px] ring-1 ring-border"
        style={{ background: def.color }}
      />
      {def.name}
    </span>
  )
}

function Delta({ current, previous }: { current: number; previous: number }) {
  if (Math.abs(current - previous) < 1e-9) return null
  const change = current / previous - 1
  return (
    <span
      className={cn(
        'text-[11px] font-medium tabular-nums',
        change > 0 ? 'text-critical' : 'text-success',
      )}
    >
      {fmtPct(change)}
    </span>
  )
}

function HistoryList({ entry }: { entry: PriceEntry }) {
  const versions: PriceVersion[] = [entry, ...entry.history]
  return (
    <div className="px-3 py-2.5 pl-12">
      <p className="mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        Price history, {entry.vendor}
      </p>
      <ol className="flex flex-col">
        {versions.map((v, i) => {
          const older = versions[i + 1]
          return (
            <li
              key={`${v.updatedAt}-${i}`}
              className="flex h-7 items-center gap-3 border-t border-border/70 text-[12px] first:border-t-0"
            >
              <span className="w-24 text-muted-foreground tabular-nums">{fmtDate(v.updatedAt)}</span>
              <span className="w-20 font-medium tabular-nums">{fmtPrice(v.price)}</span>
              <span className="w-16">
                <OriginChip origin={v.origin} />
              </span>
              {older ? (
                <Delta current={v.price} previous={older.price} />
              ) : (
                <span className="text-[11px] text-muted-foreground">First recorded</span>
              )}
              {i === 0 && <span className="text-[11px] font-medium text-brand">Current</span>}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function PriceTable() {
  const { book, lastImport, dismissImport, editEntry, classify } = useMaterials()
  const [query, setQuery] = useState('')
  const [itemFilter, setItemFilter] = useState<ItemFilter>('all')
  const [originFilter, setOriginFilter] = useState<OriginFilter>('all')
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(Object.keys(book.materials).sort().slice(0, 2)),
  )
  const [historyOpen, setHistoryOpen] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<{ id: string; price: string; origin: Origin } | null>(null)

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const order = (m: Material) => (m.item ? ITEMS.findIndex((i) => i.key === m.item) : ITEMS.length)
    return Object.values(book.materials)
      .filter((m) =>
        itemFilter === 'all' ? true : itemFilter === 'none' ? m.item === null : m.item === itemFilter,
      )
      .map((material) => {
        const all = book.entries.filter((e) => e.code === material.code)
        const matchesMaterial =
          !q || material.code.toLowerCase().includes(q) || material.description.toLowerCase().includes(q)
        const entries = all.filter(
          (e) =>
            (originFilter === 'all' || e.origin === originFilter) &&
            (matchesMaterial || e.vendor.toLowerCase().includes(q)),
        )
        return { material, entries }
      })
      .filter((g) => g.entries.length > 0)
      .sort((a, b) => order(a.material) - order(b.material) || a.material.code.localeCompare(b.material.code))
  }, [book, query, itemFilter, originFilter])

  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) =>
    setter((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const unclassified = Object.values(book.materials).filter((m) => !m.item).length
  const priceValue = editing ? Number(editing.price.replace(',', '.')) : NaN
  const priceValid = Number.isFinite(priceValue) && priceValue > 0

  const saveEdit = () => {
    if (!editing || !priceValid) return
    editEntry(editing.id, priceValue, editing.origin)
    setEditing(null)
  }

  return (
    <section
      aria-labelledby="price-table-heading"
      className="flex min-w-0 flex-col rounded-lg border border-border bg-card"
    >
      <h2 id="price-table-heading" className="sr-only">
        Prices by material
      </h2>

      {lastImport && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-t-lg border-b border-border bg-success/10 px-4 py-2 text-[12.5px] text-success"
        >
          <p>
            <span className="font-medium">{lastImport.fileName}</span> imported: {lastImport.added} new,{' '}
            {lastImport.updated} updated. Previous prices were saved to the history.
          </p>
          <button
            type="button"
            onClick={dismissImport}
            aria-label="Dismiss import message"
            className="rounded-sm p-0.5 hover:bg-success/10 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
        <div className="relative w-56">
          <MagnifyingGlass
            size={14}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search code, description, vendor"
            aria-label="Search materials"
            className="h-8 rounded-md pl-8 text-[12.5px] md:text-[12.5px]"
          />
        </div>
        <select
          aria-label="Filter by PPB item"
          value={itemFilter}
          onChange={(e) => setItemFilter(e.target.value as ItemFilter)}
          className={SELECT_CLASS}
        >
          <option value="all">All PPB items</option>
          {ITEMS.map((i) => (
            <option key={i.key} value={i.key}>
              {i.name}
            </option>
          ))}
          <option value="none">Unclassified{unclassified ? ` (${unclassified})` : ''}</option>
        </select>
        <Segmented<OriginFilter>
          label="Filter by origin"
          value={originFilter}
          onChange={setOriginFilter}
          options={[
            { value: 'all', label: 'All origins' },
            { value: 'import', label: 'Import' },
            { value: 'local', label: 'Local' },
          ]}
        />
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(new Set(groups.map((g) => g.material.code)))}
          >
            Expand all
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setOpen(new Set())}>
            Collapse all
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] table-fixed text-left text-[12.5px]">
          <colgroup>
            <col className="w-[36%]" />
            <col className="w-[20%]" />
            <col className="w-[11%]" />
            <col className="w-[13%]" />
            <col className="w-[12%]" />
            <col className="w-[8%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border text-[11px] tracking-wide text-muted-foreground uppercase">
              <th scope="col" className="px-3 py-2 font-medium">Material</th>
              <th scope="col" className="px-3 py-2 font-medium">Vendor</th>
              <th scope="col" className="px-3 py-2 font-medium">Origin</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">Price (USD)</th>
              <th scope="col" className="px-3 py-2 font-medium">Last update</th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          {groups.map(({ material, entries }) => {
            const expanded = open.has(material.code)
            const prices = entries.map((e) => e.price)
            const min = Math.min(...prices)
            const max = Math.max(...prices)
            const latest = entries.reduce((a, e) => (e.updatedAt > a ? e.updatedAt : a), '')
            const localCount = entries.filter((e) => e.origin === 'local').length
            const lowest = entries.length > 1 ? min : null

            return (
              <tbody key={material.code} className="border-b border-border last:border-b-0">
                <tr
                  className="h-11 cursor-pointer bg-secondary/50 hover:bg-secondary/80"
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button, select, input')) return
                    toggle(setOpen, material.code)
                  }}
                >
                  <td className="px-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${material.code}`}
                        onClick={() => toggle(setOpen, material.code)}
                        className="flex min-w-0 items-center gap-2 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        <CaretRight
                          size={12}
                          weight="bold"
                          aria-hidden="true"
                          className={cn('shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-90')}
                        />
                        <span className="min-w-0 leading-tight">
                          <span className="block truncate text-[13px] font-semibold tabular-nums">
                            {material.code}
                          </span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {material.description || 'No description'}
                          </span>
                        </span>
                      </button>
                      {material.item ? (
                        <ItemBadge item={material.item} />
                      ) : (
                        <select
                          aria-label={`Assign a PPB item to ${material.code}`}
                          value=""
                          onChange={(e) => classify(material.code, e.target.value as ItemKey)}
                          className="h-6 rounded-sm bg-warning/10 px-1.5 text-[11px] font-medium text-warning focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          <option value="" disabled>
                            Assign PPB item
                          </option>
                          {ITEMS.map((i) => (
                            <option key={i.key} value={i.key}>
                              {i.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </td>
                  <td className="px-3 text-muted-foreground">
                    {entries.length} vendor{entries.length > 1 ? 's' : ''}
                  </td>
                  <td className="px-3 text-[11.5px] text-muted-foreground tabular-nums">
                    {localCount} local / {entries.length - localCount} import
                  </td>
                  <td className="px-3 text-right text-muted-foreground tabular-nums">
                    {min === max ? fmtPrice(min) : `${fmtPrice(min)} to ${fmtPrice(max)}`}
                  </td>
                  <td className="px-3 text-muted-foreground tabular-nums">{fmtDate(latest)}</td>
                  <td />
                </tr>

                {expanded &&
                  entries.map((entry) => {
                    const isEditing = editing?.id === entry.id
                    const showHistory = historyOpen.has(entry.id)
                    const previous = entry.history[0]
                    return (
                      <Fragment key={entry.id}>
                        <tr className="h-10 border-t border-border/70 hover:bg-secondary/30">
                          <td className="px-3" />
                          <td className="px-3">
                            <span className="flex items-center gap-2">
                              <span className="truncate font-medium">{entry.vendor}</span>
                              {lowest != null && entry.price === lowest && (
                                <span className="shrink-0 rounded-sm bg-success/10 px-1 text-[10.5px] font-medium text-success">
                                  Lowest
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-3">
                            {isEditing ? (
                              <Segmented<Origin>
                                label={`Origin for ${entry.vendor}`}
                                value={editing.origin}
                                onChange={(origin) => setEditing({ ...editing, origin })}
                                options={[
                                  { value: 'import', label: 'Import' },
                                  { value: 'local', label: 'Local' },
                                ]}
                              />
                            ) : (
                              <OriginChip origin={entry.origin} />
                            )}
                          </td>
                          <td className="px-3 text-right">
                            {isEditing ? (
                              <Input
                                autoFocus
                                inputMode="decimal"
                                aria-label={`Price for ${entry.vendor}`}
                                aria-invalid={!priceValid}
                                value={editing.price}
                                onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit()
                                  if (e.key === 'Escape') setEditing(null)
                                }}
                                className="ml-auto h-7 w-24 rounded-md px-2 text-right text-[12.5px] tabular-nums md:text-[12.5px]"
                              />
                            ) : (
                              <span className="inline-flex items-baseline justify-end gap-2">
                                {previous && <Delta current={entry.price} previous={previous.price} />}
                                <span className="font-medium tabular-nums">{fmtPrice(entry.price)}</span>
                              </span>
                            )}
                          </td>
                          <td className="px-3 text-muted-foreground tabular-nums">{fmtDate(entry.updatedAt)}</td>
                          <td className="px-2">
                            <div className="flex items-center justify-end gap-0.5">
                              {isEditing ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label="Save price"
                                    disabled={!priceValid}
                                    onClick={saveEdit}
                                  >
                                    <Check aria-hidden="true" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label="Cancel edit"
                                    onClick={() => setEditing(null)}
                                  >
                                    <X aria-hidden="true" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label={`Price history for ${entry.vendor}, ${entry.history.length} earlier version${entry.history.length === 1 ? '' : 's'}`}
                                    aria-expanded={showHistory}
                                    onClick={() => toggle(setHistoryOpen, entry.id)}
                                    className={cn(showHistory && 'bg-muted')}
                                  >
                                    <ClockCounterClockwise aria-hidden="true" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label={`Edit price for ${entry.vendor}`}
                                    onClick={() =>
                                      setEditing({
                                        id: entry.id,
                                        price: String(entry.price),
                                        origin: entry.origin,
                                      })
                                    }
                                  >
                                    <PencilSimple aria-hidden="true" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        {showHistory && (
                          <tr className="bg-secondary/30">
                            <td colSpan={6}>
                              <HistoryList entry={entry} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
              </tbody>
            )
          })}
        </table>

        {groups.length === 0 && (
          <p className="px-4 py-10 text-center text-[13px] text-muted-foreground">
            No materials match these filters.
          </p>
        )}
      </div>
    </section>
  )
}
