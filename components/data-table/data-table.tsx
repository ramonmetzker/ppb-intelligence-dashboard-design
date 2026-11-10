'use client'

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { MoreHorizontal, SearchX, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePreferences } from '@/components/shell/preferences-provider'
import {
  clampPage,
  getValue,
  isFilterActive,
  kindOf,
  parseSearch,
  removeSearchToken,
  runQuery,
} from '@/lib/data-table/query'
import {
  DEFAULT_PAGE_SIZE_OPTIONS,
  DEFAULT_QUERY,
  type BulkAction,
  type ColumnFilter,
  type DataTableColumn,
  type DataTableQuery,
  type Density,
  type QueryChangeReason,
  type RowAction,
  type SelectionContext,
  type SortDirection,
} from '@/lib/data-table/types'
import { cn } from '@/lib/utils'
import { BulkBar } from './bulk-bar'
import { describeFilter, type DataTableLabels } from './filter-utils'
import { HeaderCell } from './header-cell'
import { Pagination } from './pagination'
import { PowerSearch } from './power-search'
import { ActiveFilters, ColumnsMenu, DensityMenu, ScrollControls, type FilterChip } from './toolbar-controls'

const SELECT_WIDTH = 44
const DEFAULT_COLUMN_WIDTH = 160

export type DataTableHandle<T> = {
  scrollToColumn: (id: string) => void
  scrollBy: (direction: -1 | 1) => void
  clearSelection: () => void
  resetQuery: () => void
  getQuery: () => DataTableQuery
  getSelection: () => SelectionContext<T>
}

export interface DataTableProps<T> {
  /** Define outside the component or memoise: the table recomputes layout when this identity changes. */
  columns: readonly DataTableColumn<T>[]
  /** Client mode: every row. Server mode: only the current page. */
  data: readonly T[]
  getRowId: (row: T) => string
  /** Accessible name for the table. Shown to screen readers only. */
  caption: string

  /**
   * `client`: the table filters, sorts and paginates `data` itself.
   * `server`: the table only reports query changes through `onQueryChange`; you fetch and pass the page back.
   */
  mode?: 'client' | 'server'
  /** Server mode: total number of rows matching the query, for the pager. */
  totalRows?: number
  loading?: boolean

  /** Controlled query. Omit to let the table own it (use `defaultQuery` for the initial value). */
  query?: DataTableQuery
  defaultQuery?: Partial<DataTableQuery>
  onQueryChange?: (query: DataTableQuery, reason: QueryChangeReason) => void

  pagination?: boolean
  pageSizeOptions?: readonly number[]

  selectable?: boolean
  isRowSelectable?: (row: T) => boolean
  onSelectionChange?: (selection: SelectionContext<T>) => void
  bulkActions?: readonly BulkAction<T>[]

  rowActions?: readonly RowAction<T>[] | ((row: T) => readonly RowAction<T>[])
  actionsWidth?: number
  onRowClick?: (row: T) => void
  getRowClassName?: (row: T) => string | undefined

  /** Rendered after the search box. Put filters or segmented controls that are specific to the page here. */
  toolbarStart?: ReactNode
  /** Rendered at the far end of the toolbar. The primary "add" button lives here by convention. */
  toolbarEnd?: ReactNode

  powerSearch?: boolean
  columnsMenu?: boolean
  densityControl?: boolean
  scrollControls?: boolean
  columnPinning?: boolean
  defaultDensity?: Density
  stickyHeader?: boolean
  /** Height of the scroll area. Use 'none' to let the table grow with the page. */
  maxHeight?: CSSProperties['maxHeight']

  emptyState?: ReactNode
  labels?: Partial<DataTableLabels>
  apiRef?: Ref<DataTableHandle<T>>
  className?: string
}

type Placed<T> = { column: DataTableColumn<T>; width: number; pin?: 'left' | 'right'; offset?: number; edge?: 'left' | 'right'; grow?: boolean }

const ROW_HEIGHT: Record<Density, string> = {
  compact: 'h-8',
  default: 'h-10',
  comfortable: 'h-12',
}

export function DataTable<T>(props: DataTableProps<T>) {
  const {
    columns,
    data,
    getRowId,
    caption,
    mode = 'client',
    totalRows,
    loading = false,
    query: controlledQuery,
    defaultQuery,
    onQueryChange,
    pagination = true,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
    selectable = false,
    isRowSelectable,
    onSelectionChange,
    bulkActions = [],
    rowActions,
    actionsWidth,
    onRowClick,
    getRowClassName,
    toolbarStart,
    toolbarEnd,
    powerSearch = true,
    columnsMenu = true,
    densityControl = true,
    scrollControls = true,
    columnPinning = true,
    defaultDensity = 'default',
    stickyHeader = true,
    maxHeight = 'min(70dvh, 720px)',
    emptyState,
    labels: labelOverrides,
    apiRef,
    className,
  } = props

  const { t } = usePreferences()
  const labels = useMemo<DataTableLabels>(() => ({ ...t.dataTable, ...labelOverrides }), [t.dataTable, labelOverrides])

  /* ----------------------------- query state ----------------------------- */

  const initialQuery = useMemo<DataTableQuery>(
    () => ({ ...DEFAULT_QUERY, ...defaultQuery }),
    // Only the first value matters: afterwards the table owns (or the parent controls) the query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const [internalQuery, setInternalQuery] = useState<DataTableQuery>(initialQuery)
  const query = controlledQuery ?? internalQuery

  const [selected, setSelected] = useState<Map<string, T>>(() => new Map())
  const [allMatching, setAllMatching] = useState(false)
  const lastClicked = useRef<number | null>(null)
  const shiftHeld = useRef(false)

  /* ---------------------------- derived results --------------------------- */

  const result = useMemo(
    () => (mode === 'client' ? runQuery(data, columns, query, pagination) : null),
    [mode, data, columns, query, pagination],
  )

  const rows: readonly T[] = result ? result.pageRows : data
  const total = result ? result.total : (totalRows ?? data.length)
  const pageSize = pagination ? query.pageSize : Math.max(total, 1)
  const { page, pageCount } = result
    ? { page: result.page, pageCount: pagination ? clampPage(result.page, total, pageSize).pageCount : 1 }
    : clampPage(query.page, total, pageSize)

  const updateQuery = (patch: Partial<DataTableQuery>, reason: QueryChangeReason) => {
    const next: DataTableQuery = { ...query, ...patch, page: reason === 'page' ? (patch.page ?? query.page) : 1 }
    if (controlledQuery === undefined) setInternalQuery(next)
    onQueryChange?.(next, reason)
    if (reason !== 'page' && allMatching) commitSelection(live, false)
  }
  const updateQueryRef = useRef(updateQuery)
  useEffect(() => {
    updateQueryRef.current = updateQuery
  })
  const changeSearch = useCallback((search: string) => updateQueryRef.current({ search }, 'search'), [])

  /* ------------------------------ view state ------------------------------ */

  const [hidden, setHidden] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(columns.filter((c) => c.defaultHidden).map((c) => [c.id, true])),
  )
  const [pins, setPins] = useState<Record<string, 'left' | 'right' | 'none'>>({})
  const [density, setDensity] = useState<Density>(defaultDensity)

  const visibleColumns = useMemo(() => columns.filter((c) => !hidden[c.id]), [columns, hidden])

  const hasActions = Boolean(rowActions)
  const resolvedActionsWidth =
    actionsWidth ??
    (Array.isArray(rowActions)
      ? 16 + Math.min(rowActions.filter((a) => a.inline).length, 2) * 32 + (rowActions.some((a) => !a.inline) ? 32 : 0)
      : 56)

  const layout = useMemo(() => {
    const pinOf = (c: DataTableColumn<T>) => {
      const override = pins[c.id]
      return override === 'none' ? undefined : (override ?? c.pin)
    }
    const widthOf = (c: DataTableColumn<T>) => c.width ?? DEFAULT_COLUMN_WIDTH
    const left = visibleColumns.filter((c) => pinOf(c) === 'left')
    const right = visibleColumns.filter((c) => pinOf(c) === 'right')
    const middle = visibleColumns.filter((c) => !pinOf(c))

    const growId = (middle.find((c) => c.grow) ?? middle[middle.length - 1])?.id

    let leftCursor = selectable ? SELECT_WIDTH : 0
    const placedLeft: Placed<T>[] = left.map((column, index) => {
      const placed: Placed<T> = {
        column,
        width: widthOf(column),
        pin: 'left',
        offset: leftCursor,
        edge: index === left.length - 1 ? 'left' : undefined,
      }
      leftCursor += placed.width
      return placed
    })

    let rightCursor = hasActions ? resolvedActionsWidth : 0
    const placedRight: Placed<T>[] = [...right].reverse().map((column, index, list) => {
      const placed: Placed<T> = {
        column,
        width: widthOf(column),
        pin: 'right',
        offset: rightCursor,
        edge: index === list.length - 1 ? 'right' : undefined,
      }
      rightCursor += placed.width
      return placed
    })
    placedRight.reverse()

    const placedMiddle: Placed<T>[] = middle.map((column) => ({
      column,
      width: widthOf(column),
      grow: column.id === growId,
    }))

    const sum = (list: Placed<T>[]) => list.reduce((acc, p) => acc + p.width, 0)
    const leftWidth = leftCursor
    const rightWidth = rightCursor
    return {
      placed: [...placedLeft, ...placedMiddle, ...placedRight],
      leftWidth,
      rightWidth,
      hasGrow: placedMiddle.length > 0,
      totalWidth: leftWidth + rightWidth + sum(placedMiddle),
      leftEdgeOnSelect: selectable && placedLeft.length === 0,
      rightEdgeOnActions: hasActions && placedRight.length === 0,
      middleOffsets: new Map(
        placedMiddle.map((p, i) => [p.column.id, placedMiddle.slice(0, i).reduce((acc, q) => acc + q.width, 0)]),
      ),
    }
  }, [visibleColumns, pins, selectable, hasActions, resolvedActionsWidth])

  /* ------------------------------ scrolling ------------------------------- */

  const scrollerRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const [scrollState, setScrollState] = useState({ left: false, right: false, viewport: 0 })

  const measure = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const next = {
      left: el.scrollLeft > 1,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1,
      viewport: el.clientWidth,
    }
    setScrollState((prev) => (prev.left === next.left && prev.right === next.right && prev.viewport === next.viewport ? prev : next))
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    if (tableRef.current) observer.observe(tableRef.current)
    return () => observer.disconnect()
  }, [measure])

  const scrollBehavior = (): ScrollBehavior =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'

  const scrollBy = useCallback(
    (direction: -1 | 1) => {
      const el = scrollerRef.current
      if (!el) return
      const free = Math.max(el.clientWidth - layout.leftWidth - layout.rightWidth, 160)
      el.scrollBy({ left: direction * free * 0.8, behavior: scrollBehavior() })
    },
    [layout.leftWidth, layout.rightWidth],
  )

  const scrollToColumn = useCallback(
    (id: string) => {
      const el = scrollerRef.current
      const offset = layout.middleOffsets.get(id)
      if (!el || offset === undefined) return
      el.scrollTo({ left: offset, behavior: scrollBehavior() })
    },
    [layout.middleOffsets],
  )

  /* ------------------------------- selection ------------------------------ */

  const isSelectable = useCallback((row: T) => (isRowSelectable ? isRowSelectable(row) : true), [isRowSelectable])

  const live = useMemo(() => {
    if (mode !== 'client' || selected.size === 0) return selected
    const present = new Set(data.map(getRowId))
    const next = new Map<string, T>()
    selected.forEach((row, id) => present.has(id) && next.set(id, row))
    return next.size === selected.size ? selected : next
  }, [mode, selected, data, getRowId])

  const buildContext = useCallback(
    (map: Map<string, T>, all: boolean): SelectionContext<T> => {
      if (all && result) {
        const everything = result.filtered.filter(isSelectable)
        return { ids: everything.map(getRowId), rows: everything, allMatching: true, count: everything.length, query }
      }
      const list = [...map.values()]
      return { ids: [...map.keys()], rows: list, allMatching: all, count: all ? total : map.size, query }
    },
    [result, isSelectable, getRowId, query, total],
  )

  function commitSelection(next: Map<string, T>, all: boolean) {
    setSelected(next)
    setAllMatching(all)
    onSelectionChange?.(buildContext(next, all))
  }

  const pageSelectable = useMemo(() => rows.filter(isSelectable), [rows, isSelectable])
  const selectedOnPage = pageSelectable.filter((row) => live.has(getRowId(row))).length
  const allPageSelected = pageSelectable.length > 0 && selectedOnPage === pageSelectable.length
  const somePageSelected = selectedOnPage > 0 && !allPageSelected

  const togglePage = (checked: boolean) => {
    const next = new Map(live)
    pageSelectable.forEach((row) => (checked ? next.set(getRowId(row), row) : next.delete(getRowId(row))))
    commitSelection(next, false)
  }

  const toggleRow = (row: T, index: number, checked: boolean) => {
    const next = new Map(live)
    const apply = (target: T) => (checked ? next.set(getRowId(target), target) : next.delete(getRowId(target)))
    if (shiftHeld.current && lastClicked.current !== null) {
      const [from, to] = [lastClicked.current, index].sort((a, b) => a - b)
      rows.slice(from, to + 1).filter(isSelectable).forEach(apply)
    } else {
      apply(row)
    }
    lastClicked.current = index
    commitSelection(next, false)
  }

  const selectAllMatching = () => {
    const next = new Map(live)
    if (result) result.filtered.filter(isSelectable).forEach((row) => next.set(getRowId(row), row))
    commitSelection(next, true)
  }

  const clearSelection = useCallback(() => {
    setSelected(new Map())
    setAllMatching(false)
    lastClicked.current = null
    onSelectionChange?.({ ids: [], rows: [], allMatching: false, count: 0, query })
  }, [onSelectionChange, query])

  const selectedCount = allMatching ? total : live.size
  const canSelectAllMatching = allPageSelected && total > pageSelectable.length && !allMatching

  /* ----------------------------- sort & filter ---------------------------- */

  const sortOf = (id: string) => query.sort.find((s) => s.id === id)
  const setSort = (id: string, direction: SortDirection | null, additive: boolean) => {
    const others = additive ? query.sort.filter((s) => s.id !== id) : []
    const existingIndex = query.sort.findIndex((s) => s.id === id)
    let next = others
    if (direction) {
      next = additive && existingIndex >= 0 ? query.sort.map((s) => (s.id === id ? { id, direction } : s)) : [...others, { id, direction }]
    }
    updateQuery({ sort: next }, 'sort')
  }
  const toggleSort = (id: string, additive: boolean) => {
    const current = sortOf(id)?.direction
    setSort(id, !current ? 'asc' : current === 'asc' ? 'desc' : null, additive)
  }

  const setColumnFilter = (id: string, filter: ColumnFilter | null) => {
    const rest = query.filters.filter((f) => f.id !== id)
    updateQuery({ filters: filter && isFilterActive(filter) ? [...rest, filter] : rest }, 'filter')
  }

  const parsedSearch = useMemo(() => parseSearch(query.search, columns), [query.search, columns])

  const chips = useMemo<FilterChip[]>(() => {
    const byId = new Map(columns.map((c) => [c.id, c]))
    const fromColumns = query.filters.filter(isFilterActive).flatMap((filter) => {
      const schema = byId.get(filter.id)
      if (!schema) return []
      return [
        {
          key: `col-${filter.id}`,
          label: describeFilter(schema, filter, labels),
          onRemove: () => setColumnFilter(filter.id, null),
        },
      ]
    })
    const fromSearch = parsedSearch.tokens.map((token) => ({
      key: `tok-${token.start}-${token.raw}`,
      label: describeFilter(byId.get(token.columnId)!, token.filter, labels),
      onRemove: () => updateQuery({ search: removeSearchToken(query.search, token) }, 'search'),
    }))
    return [...fromColumns, ...fromSearch]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, query, parsedSearch, labels])

  const resetQuery = useCallback(() => {
    const next = { ...initialQuery, page: 1 }
    if (controlledQuery === undefined) setInternalQuery(next)
    onQueryChange?.(next, 'reset')
  }, [controlledQuery, initialQuery, onQueryChange])

  const clearAllFilters = () => updateQuery({ filters: [], search: '' }, 'filter')

  useImperativeHandle(
    apiRef,
    () => ({
      scrollToColumn,
      scrollBy,
      clearSelection,
      resetQuery,
      getQuery: () => query,
      getSelection: () => buildContext(live, allMatching),
    }),
    [scrollToColumn, scrollBy, clearSelection, resetQuery, query, buildContext, live, allMatching],
  )

  /* -------------------------------- render -------------------------------- */

  const rowHeight = ROW_HEIGHT[density]
  const hasFilters = chips.length > 0
  const hideableCount = columns.filter((c) => !hidden[c.id]).length

  const stickyStyle = (placed: Pick<Placed<T>, 'pin' | 'offset'>): CSSProperties =>
    placed.pin === 'left'
      ? { position: 'sticky', left: placed.offset }
      : placed.pin === 'right'
        ? { position: 'sticky', right: placed.offset }
        : {}

  const renderCellContent = (row: T, rowIndex: number, column: DataTableColumn<T>): ReactNode => {
    const value = getValue(row, column)
    if (column.cell) return column.cell({ row, value, rowIndex, column })
    if (value === null || value === undefined || value === '') return <span className="text-muted-foreground/60">-</span>
    switch (kindOf(column)) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString('en-US') : String(value)
      case 'boolean':
        return value ? labels.yes : labels.no
      case 'select': {
        const option = column.options?.find((o) => o.value === String(value))
        return (
          <span className="inline-flex items-center gap-2">
            {option?.color && (
              <span aria-hidden="true" className="size-2 rounded-[2px]" style={{ backgroundColor: option.color }} />
            )}
            {option?.label ?? String(value)}
          </span>
        )
      }
      default:
        return String(value)
    }
  }

  const onRowKey = (event: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onRowClick?.(row)
    }
  }
  const onRowPointer = (event: MouseEvent<HTMLTableRowElement>, row: T) => {
    if ((event.target as HTMLElement).closest('button,a,input,label,[role=checkbox],[role=menuitem],[data-no-row-click]')) return
    onRowClick?.(row)
  }

  const renderRowActions = (row: T) => {
    const list = (typeof rowActions === 'function' ? rowActions(row) : (rowActions ?? [])).filter((a) => !a.hidden)
    const inline = list.filter((a) => a.inline).slice(0, 2)
    const menu = list.filter((a) => !inline.includes(a))
    return (
      <div className="flex items-center justify-end gap-0.5 opacity-70 transition-opacity group-focus-within/row:opacity-100 group-hover/row:opacity-100">
        {inline.map((action) => (
          <Button
            key={action.id}
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={action.label}
            title={action.label}
            disabled={action.disabled}
            onClick={() => action.onSelect(row)}
          >
            {action.icon}
          </Button>
        ))}
        {menu.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={labels.rowActions}
              className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-[popup-open]:bg-muted"
            >
              <MoreHorizontal aria-hidden="true" className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              {menu.map((action) => (
                <div key={action.id}>
                  {action.separatorBefore && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    disabled={action.disabled}
                    variant={action.tone === 'destructive' ? 'destructive' : 'default'}
                    onClick={() => action.onSelect(row)}
                  >
                    {action.icon}
                    {action.label}
                  </DropdownMenuItem>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    )
  }

  const cellBase = cn(
    'dt-cell overflow-hidden border-b border-border bg-card px-3 text-ellipsis whitespace-nowrap',
    'group-hover/row:bg-muted group-data-[selected=true]/row:bg-brand-soft',
  )

  const totalColumns = layout.placed.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0)
  const showSkeleton = loading && rows.length === 0
  const showEmpty = !loading && rows.length === 0
  const colSpanStyle: CSSProperties = { width: scrollState.viewport || undefined }

  return (
    <section className={cn('flex min-w-0 flex-col gap-3', className)} aria-busy={loading}>
      {selectedCount > 0 && bulkActions.length > 0 ? (
        <BulkBar
          count={live.size}
          total={total}
          allMatching={allMatching}
          canSelectAllMatching={canSelectAllMatching}
          actions={bulkActions}
          getContext={() => buildContext(live, allMatching)}
          labels={labels}
          onClear={clearSelection}
          onSelectAllMatching={selectAllMatching}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {powerSearch && (
            <PowerSearch
              value={query.search}
              onChange={changeSearch}
              schemas={columns}
              labels={labels}
              className="w-full sm:max-w-md sm:flex-1"
            />
          )}
          {toolbarStart}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {scrollControls && (
              <ScrollControls
                canScrollLeft={scrollState.left}
                canScrollRight={scrollState.right}
                jumpTargets={layout.placed.filter((p) => !p.pin).map((p) => ({ id: p.column.id, header: p.column.header }))}
                labels={labels}
                onScroll={scrollBy}
                onJump={scrollToColumn}
              />
            )}
            {columnsMenu && (
              <ColumnsMenu
                columns={columns.map((c) => ({
                  id: c.id,
                  header: c.header,
                  visible: !hidden[c.id],
                  hideable: c.hideable !== false && (hidden[c.id] || hideableCount > 1),
                }))}
                labels={labels}
                onToggle={(id, visible) => setHidden((prev) => ({ ...prev, [id]: !visible }))}
                onReset={() => {
                  setHidden(Object.fromEntries(columns.filter((c) => c.defaultHidden).map((c) => [c.id, true])))
                  setPins({})
                }}
              />
            )}
            {densityControl && <DensityMenu value={density} labels={labels} onChange={setDensity} />}
            {toolbarEnd}
          </div>
        </div>
      )}

      <ActiveFilters chips={chips} labels={labels} onClearAll={clearAllFilters} />

      <div className="relative overflow-hidden rounded-xl border border-border bg-card">
        {loading && <div aria-hidden="true" className="absolute inset-x-0 top-0 z-40 h-0.5 animate-pulse bg-brand" />}

        <div
          ref={scrollerRef}
          role="region"
          tabIndex={0}
          aria-label={`${caption}. ${labels.scrollRegion}`}
          data-scrolled-left={scrollState.left}
          data-scrolled-right={scrollState.right}
          onScroll={measure}
          style={{ maxHeight }}
          className="dt-scroller overflow-auto overscroll-x-contain outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          <table
            ref={tableRef}
            className="border-separate border-spacing-0 text-[13px]"
            style={{
              tableLayout: 'fixed',
              width: layout.hasGrow ? '100%' : layout.totalWidth,
              minWidth: layout.totalWidth,
            }}
          >
            <caption className="sr-only">{caption}</caption>
            <colgroup>
              {selectable && <col style={{ width: SELECT_WIDTH }} />}
              {layout.placed.map((p) => (
                <col key={p.column.id} style={p.grow ? { minWidth: p.width } : { width: p.width }} />
              ))}
              {hasActions && <col style={{ width: resolvedActionsWidth }} />}
            </colgroup>

            <thead>
              <tr>
                {selectable && (
                  <th
                    scope="col"
                    data-edge={layout.leftEdgeOnSelect ? 'left' : undefined}
                    style={{ position: 'sticky', left: 0 }}
                    className={cn('dt-cell z-30 h-10 border-b border-border bg-muted px-3', stickyHeader && 'top-0')}
                  >
                    <Checkbox
                      aria-label={labels.selectAllRows}
                      checked={allPageSelected}
                      indeterminate={somePageSelected}
                      disabled={pageSelectable.length === 0}
                      onCheckedChange={(checked) => togglePage(checked)}
                    />
                  </th>
                )}

                {layout.placed.map((placed) => {
                  const { column } = placed
                  const sort = sortOf(column.id)
                  const sortable = column.sortable !== false
                  return (
                    <HeaderCell
                      key={column.id}
                      column={{ ...column, pin: placed.pin }}
                      style={stickyStyle(placed)}
                      pinned={Boolean(placed.pin)}
                      edge={placed.edge}
                      stickyHeader={stickyHeader || Boolean(placed.pin)}
                      sortable={sortable}
                      filterable={column.filterable !== false}
                      pinnable={columnPinning}
                      sortDirection={sort?.direction ?? false}
                      sortIndex={sort && query.sort.length > 1 ? query.sort.indexOf(sort) + 1 : undefined}
                      filter={query.filters.find((f) => f.id === column.id)}
                      labels={labels}
                      onSort={(direction, additive) => setSort(column.id, direction, additive)}
                      onToggleSort={(additive) => toggleSort(column.id, additive)}
                      onFilter={(filter) => setColumnFilter(column.id, filter)}
                      onPin={(pin) => setPins((prev) => ({ ...prev, [column.id]: pin ?? 'none' }))}
                      onHide={
                        column.hideable !== false && hideableCount > 1
                          ? () => setHidden((prev) => ({ ...prev, [column.id]: true }))
                          : undefined
                      }
                    />
                  )
                })}

                {hasActions && (
                  <th
                    scope="col"
                    data-edge={layout.rightEdgeOnActions ? 'right' : undefined}
                    style={{ position: 'sticky', right: 0 }}
                    className={cn('dt-cell z-30 h-10 border-b border-border bg-muted', stickyHeader && 'top-0')}
                  >
                    <span className="sr-only">{labels.rowActions}</span>
                  </th>
                )}
              </tr>
            </thead>

            <tbody className={cn(loading && !showSkeleton && 'opacity-60 transition-opacity')}>
              {showSkeleton &&
                Array.from({ length: Math.min(pageSize, 8) }, (_, index) => (
                  <tr key={index} aria-hidden="true">
                    {selectable && <td className={cn(cellBase, rowHeight)} style={{ position: 'sticky', left: 0 }} />}
                    {layout.placed.map((placed) => (
                      <td key={placed.column.id} className={cn(cellBase, rowHeight)} style={stickyStyle(placed)}>
                        <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                    {hasActions && <td className={cn(cellBase, rowHeight)} style={{ position: 'sticky', right: 0 }} />}
                  </tr>
                ))}

              {showEmpty && (
                <tr>
                  <td colSpan={totalColumns} className="h-64 p-0">
                    <div style={colSpanStyle} className="sticky left-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                      {emptyState ?? (
                        <>
                          {hasFilters ? (
                            <SearchX aria-hidden="true" className="size-8 text-muted-foreground" />
                          ) : (
                            <Inbox aria-hidden="true" className="size-8 text-muted-foreground" />
                          )}
                          <p className="text-sm font-medium">{hasFilters ? labels.noResults : labels.noData}</p>
                          {hasFilters && (
                            <>
                              <p className="text-[13px] text-muted-foreground">{labels.noResultsHint}</p>
                              <Button type="button" variant="outline" size="sm" onClick={clearAllFilters}>
                                {labels.clearAll}
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {rows.map((row, rowIndex) => {
                const id = getRowId(row)
                const isSelected = live.has(id)
                return (
                  <tr
                    key={id}
                    data-selected={isSelected}
                    tabIndex={onRowClick ? 0 : undefined}
                    onClick={onRowClick ? (event) => onRowPointer(event, row) : undefined}
                    onKeyDown={onRowClick ? (event) => onRowKey(event, row) : undefined}
                    className={cn(
                      'group/row outline-none focus-visible:[&>td]:bg-muted',
                      onRowClick && 'cursor-pointer',
                      getRowClassName?.(row),
                    )}
                  >
                    {selectable && (
                      <td
                        data-edge={layout.leftEdgeOnSelect ? 'left' : undefined}
                        style={{ position: 'sticky', left: 0 }}
                        className={cn(cellBase, rowHeight, 'z-10')}
                        onClickCapture={(event) => {
                          shiftHeld.current = event.shiftKey
                        }}
                      >
                        <Checkbox
                          aria-label={labels.selectRow}
                          checked={isSelected}
                          disabled={!isSelectable(row)}
                          onCheckedChange={(checked) => toggleRow(row, rowIndex, checked)}
                        />
                      </td>
                    )}

                    {layout.placed.map((placed) => {
                      const { column } = placed
                      const align = column.align ?? (column.kind === 'number' ? 'right' : 'left')
                      return (
                        <td
                          key={column.id}
                          data-edge={placed.edge}
                          style={stickyStyle(placed)}
                          className={cn(
                            cellBase,
                            rowHeight,
                            placed.pin ? 'z-10' : undefined,
                            align === 'right' && 'tnum text-right',
                            align === 'center' && 'text-center',
                            column.className,
                          )}
                        >
                          {renderCellContent(row, rowIndex, column)}
                        </td>
                      )
                    })}

                    {hasActions && (
                      <td
                        data-edge={layout.rightEdgeOnActions ? 'right' : undefined}
                        style={{ position: 'sticky', right: 0 }}
                        className={cn(cellBase, rowHeight, 'z-10 px-2')}
                      >
                        {renderRowActions(row)}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {pagination && total > 0 && (
          <div className="border-t border-border px-3 py-2">
            <Pagination
              page={page}
              pageCount={pageCount}
              pageSize={pageSize}
              total={total}
              pageSizeOptions={pageSizeOptions}
              labels={labels}
              onPageChange={(next) => updateQuery({ page: next }, 'page')}
              onPageSizeChange={(size) => updateQuery({ pageSize: size }, 'pageSize')}
            />
          </div>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {loading ? labels.loading : labels.results(total)}
      </p>
    </section>
  )
}
