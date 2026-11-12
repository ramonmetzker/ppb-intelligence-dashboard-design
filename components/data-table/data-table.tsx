'use client'

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { MoreHorizontal, SearchX, Inbox } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useDataTableLabels, type DataTableLocale } from './locale'
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
  type DataTableColumnDefinition,
  type DataTableColumnGroup,
  type DataTableQuery,
  type Density,
  isDataTableColumnGroup,
  type QueryChangeReason,
  type RowAction,
  type SelectionContext,
  type SortDirection,
} from '@/lib/data-table/types'
import { cn } from '@/lib/utils'
import { BulkBar } from './bulk-bar'
import { downloadCsv, downloadJson, type ExportColumn } from './export-utils'
import { describeFilter, type DataTableLabels } from './filter-utils'
import { HeaderCell } from './header-cell'
import { Pagination } from './pagination'
import {
  readDataTableSettings,
  useDataTableStorageKey,
  writeDataTableSettings,
} from './persistence'
import { PowerSearch } from './power-search'
import {
  ActiveFilters,
  ColumnsMenu,
  DensityMenu,
  ExportMenu,
  ScrollControls,
  type ExportKind,
  type FilterChip,
} from './toolbar-controls'

const SELECT_WIDTH = 44
const DEFAULT_COLUMN_WIDTH = 160
const DEFAULT_MIN_COLUMN_WIDTH = 112
const DEFAULT_MAX_COLUMN_WIDTH = 640

function clampColumnWidth<T>(column: DataTableColumn<T>, width: number) {
  const min = column.minWidth ?? DEFAULT_MIN_COLUMN_WIDTH
  const max = Math.max(column.maxWidth ?? DEFAULT_MAX_COLUMN_WIDTH, min)
  return Math.min(Math.max(Math.round(width), min), max)
}

export type DataTableHandle<T> = {
  scrollToColumn: (id: string) => void
  scrollBy: (direction: -1 | 1) => void
  clearSelection: () => void
  resetQuery: () => void
  getQuery: () => DataTableQuery
  getSelection: () => SelectionContext<T>
}

export type DataTableExportOptions<T> = {
  fileName?: string
  /** Required for “Export all” when server mode has more rows than the current payload. */
  getAllRows?: (query: DataTableQuery) => Promise<readonly T[]> | readonly T[]
  onError?: (error: unknown) => void
}

export interface DataTableProps<T> {
  /** Leaf columns or one-level groups with child columns. Define outside the component or memoise. */
  columns: readonly DataTableColumnDefinition<T>[]
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
  columnResizing?: boolean
  columnReordering?: boolean
  /** Merge adjacent equal values with native rowSpan. Pass column ids to limit the feature. */
  mergeEqualRows?: boolean | readonly string[]
  /** Enabled by default. Pass options for a custom file name or server-side all-rows loader. */
  exporter?: boolean | DataTableExportOptions<T>
  /** Stable key used to persist this table's view configuration for the current user. */
  persistenceKey?: string
  defaultDensity?: Density
  stickyHeader?: boolean
  /** Height of the scroll area. Use 'none' to let the table grow with the page. */
  maxHeight?: CSSProperties['maxHeight']

  emptyState?: ReactNode
  /** 'en' | 'pt-BR' | 'ko', or a custom label set. Falls back to the nearest DataTableLocaleProvider, then English. */
  locale?: DataTableLocale
  /** Per-table tweaks applied on top of the resolved locale. */
  labels?: Partial<DataTableLabels>
  apiRef?: Ref<DataTableHandle<T>>
  className?: string
}

type Placed<T> = { column: DataTableColumn<T>; width: number; pin?: 'left' | 'right'; offset?: number; edge?: 'left' | 'right'; grow?: boolean }
type HeaderSegment<T> = { group?: DataTableColumnGroup<T>; columns: Placed<T>[] }

const ROW_HEIGHT: Record<Density, string> = {
  compact: 'h-8',
  default: 'h-10',
  comfortable: 'h-12',
}

export function DataTable<T>(props: DataTableProps<T>) {
  const {
    columns: columnDefinitions,
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
    columnResizing = true,
    columnReordering = true,
    mergeEqualRows = false,
    exporter = true,
    persistenceKey,
    defaultDensity = 'default',
    stickyHeader = true,
    maxHeight = 'min(70dvh, 720px)',
    emptyState,
    locale,
    labels: labelOverrides,
    apiRef,
    className,
  } = props

  const labels = useDataTableLabels(locale, labelOverrides)
  const storageKey = useDataTableStorageKey(persistenceKey)
  const columns = useMemo(
    () => columnDefinitions.flatMap((definition) => (isDataTableColumnGroup(definition) ? definition.children : [definition])),
    [columnDefinitions],
  )
  const columnGroupById = useMemo(() => {
    const groups = new Map<string, DataTableColumnGroup<T>>()
    for (const definition of columnDefinitions) {
      if (!isDataTableColumnGroup(definition)) continue
      for (const child of definition.children) groups.set(child.id, definition)
    }
    return groups
  }, [columnDefinitions])
  const hasColumnGroups = columnGroupById.size > 0

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

  const defaultHidden = useMemo(
    () => Object.fromEntries(columns.filter((column) => column.defaultHidden).map((column) => [column.id, true])),
    [columns],
  )
  const [hidden, setHidden] = useState<Record<string, boolean>>(() => defaultHidden)
  const [pins, setPins] = useState<Record<string, 'left' | 'right' | 'none'>>({})
  const [density, setDensity] = useState<Density>(defaultDensity)
  const [columnOrder, setColumnOrder] = useState<string[]>(() => columns.map((column) => column.id))
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null)
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const draggedColumnRef = useRef<string | null>(null)
  const [dragTarget, setDragTarget] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const orderedColumns = useMemo(() => {
    const byId = new Map(columns.map((column) => [column.id, column]))
    const knownOrder = columnOrder.filter((id) => byId.has(id))
    const seen = new Set(knownOrder)
    return [
      ...knownOrder.map((id) => byId.get(id)!),
      ...columns.filter((column) => !seen.has(column.id)),
    ]
  }, [columns, columnOrder])

  const visibleColumns = useMemo(
    () => orderedColumns.filter((column) => !hidden[column.id]),
    [orderedColumns, hidden],
  )

  const rowSpans = useMemo(() => {
    if (!mergeEqualRows || rows.length < 2) return null
    const requested = Array.isArray(mergeEqualRows) ? new Set(mergeEqualRows) : null
    const mergeColumns = visibleColumns.filter(
      (column) => column.mergeRows !== false && (!requested || requested.has(column.id)),
    )
    if (mergeColumns.length === 0) return null

    const spans = new Map<string, number[]>()
    for (const column of mergeColumns) {
      const values = rows.map((row) => (column.getMergeValue ? column.getMergeValue(row) : getValue(row, column)))
      const columnSpans = Array.from({ length: rows.length }, () => 1)
      let runStart = 0
      for (let index = 1; index <= values.length; index += 1) {
        const previousValue = values[index - 1]
        const hasContent = previousValue !== null && previousValue !== undefined && previousValue !== ''
        if (index < values.length && hasContent && Object.is(values[index], previousValue)) continue
        const span = index - runStart
        columnSpans[runStart] = span
        for (let mergedIndex = runStart + 1; mergedIndex < index; mergedIndex += 1) columnSpans[mergedIndex] = 0
        runStart = index
      }
      spans.set(column.id, columnSpans)
    }
    return spans
  }, [mergeEqualRows, rows, visibleColumns])

  useEffect(() => {
    if (!storageKey) {
      setLoadedStorageKey(null)
      return
    }

    const stored = readDataTableSettings(storageKey)
    const knownIds = new Set(columns.map((column) => column.id))
    const storedOrder = stored?.columnOrder?.filter((id) => knownIds.has(id)) ?? []
    const seen = new Set(storedOrder)
    const nextOrder = [...storedOrder, ...columns.map((column) => column.id).filter((id) => !seen.has(id))]
    const nextHidden = Object.fromEntries(
      Object.entries({ ...defaultHidden, ...stored?.hiddenColumns }).filter(([id]) => knownIds.has(id)),
    )
    const nextWidths = Object.fromEntries(
      Object.entries(stored?.columnWidths ?? {}).flatMap(([id, width]) => {
        const column = columns.find((candidate) => candidate.id === id)
        return column ? [[id, clampColumnWidth(column, width)]] : []
      }),
    )
    const nextPins = Object.fromEntries(
      Object.entries(stored?.pinnedColumns ?? {}).filter(([id]) => knownIds.has(id)),
    )

    setColumnOrder(nextOrder)
    setColumnWidths(nextWidths)
    setHidden(columns.every((column) => nextHidden[column.id]) ? defaultHidden : nextHidden)
    setPins(nextPins)
    setDensity(stored?.density ?? defaultDensity)

    if (
      pagination &&
      stored?.pageSize &&
      pageSizeOptions.includes(stored.pageSize) &&
      stored.pageSize !== query.pageSize
    ) {
      updateQueryRef.current({ pageSize: stored.pageSize }, 'pageSize')
    }
    setLoadedStorageKey(storageKey)
    // Loading is intentionally keyed to the table schema and storage identity, not the live query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, defaultDensity, defaultHidden, pageSizeOptions, pagination, storageKey])

  useEffect(() => {
    if (!storageKey || loadedStorageKey !== storageKey) return
    const knownIds = new Set(columns.map((column) => column.id))
    const timeout = window.setTimeout(() => {
      writeDataTableSettings(storageKey, {
        columnOrder: orderedColumns.map((column) => column.id),
        columnWidths: Object.fromEntries(Object.entries(columnWidths).filter(([id]) => knownIds.has(id))),
        hiddenColumns: Object.fromEntries(Object.entries(hidden).filter(([id]) => knownIds.has(id))),
        pinnedColumns: Object.fromEntries(Object.entries(pins).filter(([id]) => knownIds.has(id))),
        density,
        pageSize: pagination ? query.pageSize : undefined,
      })
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [columnWidths, columns, density, hidden, loadedStorageKey, orderedColumns, pagination, pins, query.pageSize, storageKey])

  const hasActions = Boolean(rowActions)
  const resolvedActionsWidth =
    actionsWidth ??
    (Array.isArray(rowActions)
      ? 16 + Math.min(rowActions.filter((a) => a.inline).length, 2) * 32 + (rowActions.some((a) => !a.inline) ? 32 : 0)
      : 80)

  const layout = useMemo(() => {
    const pinOf = (c: DataTableColumn<T>) => {
      const override = pins[c.id]
      return override === 'none' ? undefined : (override ?? c.pin)
    }
    const widthOf = (c: DataTableColumn<T>) =>
      clampColumnWidth(c, columnWidths[c.id] ?? c.width ?? DEFAULT_COLUMN_WIDTH)
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
  }, [visibleColumns, pins, columnWidths, selectable, hasActions, resolvedActionsWidth])

  const headerSegments = useMemo(() => {
    const segments: HeaderSegment<T>[] = []
    for (const placed of layout.placed) {
      const group = columnGroupById.get(placed.column.id)
      const previous = segments[segments.length - 1]
      if (group && previous?.group?.id === group.id && previous.columns[0]?.pin === placed.pin) {
        previous.columns.push(placed)
      } else {
        segments.push({ group, columns: [placed] })
      }
    }
    return segments
  }, [columnGroupById, layout.placed])
  const placedIndexById = useMemo(
    () => new Map(layout.placed.map((placed, index) => [placed.column.id, index])),
    [layout.placed],
  )
  const hasVisibleColumnGroups = hasColumnGroups && headerSegments.some((segment) => segment.group)

  const effectivePin = (column: DataTableColumn<T>) => {
    const override = pins[column.id]
    return override === 'none' ? undefined : (override ?? column.pin)
  }

  const reorderColumn = (sourceId: string, targetId: string, afterTarget: boolean) => {
    if (sourceId === targetId) return
    const source = columns.find((column) => column.id === sourceId)
    const target = columns.find((column) => column.id === targetId)
    if (!source || !target || source.reorderable === false) return

    setColumnOrder((current) => {
      const knownIds = new Set(columns.map((column) => column.id))
      const complete = [
        ...current.filter((id) => knownIds.has(id)),
        ...columns.map((column) => column.id).filter((id) => !current.includes(id)),
      ]
      const withoutSource = complete.filter((id) => id !== sourceId)
      const targetIndex = withoutSource.indexOf(targetId)
      withoutSource.splice(targetIndex + (afterTarget ? 1 : 0), 0, sourceId)
      return withoutSource
    })

    setPins((current) => ({
      ...current,
      [sourceId]: effectivePin(target) ?? 'none',
    }))
  }

  const moveColumn = (id: string, direction: -1 | 1) => {
    const visibleOrder = layout.placed.map((placed) => placed.column.id)
    const index = visibleOrder.indexOf(id)
    const targetId = visibleOrder[index + direction]
    if (targetId) reorderColumn(id, targetId, direction === 1)
  }

  const startColumnDrag = (event: DragEvent<HTMLButtonElement>, id: string) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
    draggedColumnRef.current = id
    setDraggedColumn(id)
    setDragTarget(null)
  }

  const dragOverColumn = (event: DragEvent<HTMLTableCellElement>, id: string) => {
    const sourceId = draggedColumnRef.current
    if (!sourceId || sourceId === id) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragTarget(id)
  }

  const dropColumn = (event: DragEvent<HTMLTableCellElement>, targetId: string) => {
    event.preventDefault()
    const sourceId = draggedColumnRef.current ?? event.dataTransfer.getData('text/plain')
    if (sourceId && sourceId !== targetId) {
      const bounds = event.currentTarget.getBoundingClientRect()
      reorderColumn(sourceId, targetId, event.clientX >= bounds.left + bounds.width / 2)
    }
    draggedColumnRef.current = null
    setDraggedColumn(null)
    setDragTarget(null)
  }

  const resizeColumnBy = (column: DataTableColumn<T>, direction: -1 | 1) => {
    setColumnWidths((current) => ({
      ...current,
      [column.id]: clampColumnWidth(
        column,
        (current[column.id] ?? column.width ?? DEFAULT_COLUMN_WIDTH) + direction * 16,
      ),
    }))
  }

  const startColumnResize = (event: ReactPointerEvent<HTMLButtonElement>, column: DataTableColumn<T>) => {
    event.preventDefault()
    event.stopPropagation()
    const startX = event.clientX
    const startWidth = columnWidths[column.id] ?? column.width ?? DEFAULT_COLUMN_WIDTH
    const previousCursor = document.body.style.cursor
    const previousUserSelect = document.body.style.userSelect
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const resize = (pointerEvent: PointerEvent) => {
      const width = clampColumnWidth(column, startWidth + pointerEvent.clientX - startX)
      setColumnWidths((current) => (current[column.id] === width ? current : { ...current, [column.id]: width }))
    }
    const finish = () => {
      document.body.style.cursor = previousCursor
      document.body.style.userSelect = previousUserSelect
      window.removeEventListener('pointermove', resize)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
    }

    window.addEventListener('pointermove', resize)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
  }

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

  const exportOptions = typeof exporter === 'object' ? exporter : {}
  const canExportAll = mode === 'client' || total <= data.length || Boolean(exportOptions.getAllRows)

  const rawExportColumns = (exportColumns: readonly DataTableColumn<T>[]): ExportColumn<T>[] =>
    exportColumns.map((column) => ({ header: column.id, value: (row) => getValue(row, column) }))

  const visualExportColumns = (exportColumns: readonly DataTableColumn<T>[]): ExportColumn<T>[] =>
    exportColumns.map((column) => ({
      header: column.header,
      value: (row) => {
        const value = getValue(row, column)
        if (column.exportValue) return column.exportValue(row, value)
        if (value === null || value === undefined) return ''
        switch (kindOf(column)) {
          case 'number':
            return typeof value === 'number' ? value.toLocaleString('en-US') : String(value)
          case 'boolean':
            return value ? labels.yes : labels.no
          case 'select':
            return column.options?.find((option) => option.value === String(value))?.label ?? String(value)
          default:
            return value
        }
      },
    }))

  const handleExport = async (kind: ExportKind) => {
    if (exporting) return
    setExporting(true)
    const fileName = exportOptions.fileName ?? caption
    try {
      if (kind === 'raw') {
        downloadJson(data, `${fileName}-raw`)
      } else if (kind === 'page') {
        downloadCsv(rows, rawExportColumns(columns), `${fileName}-page-${page}`)
      } else if (kind === 'view') {
        downloadCsv(rows, visualExportColumns(layout.placed.map((placed) => placed.column)), `${fileName}-view`)
      } else {
        const allRows =
          mode === 'client'
            ? (result?.filtered ?? data)
            : exportOptions.getAllRows
              ? await exportOptions.getAllRows(query)
              : data
        downloadCsv(allRows, rawExportColumns(columns), `${fileName}-all`)
      }
    } catch (error) {
      exportOptions.onError?.(error)
    } finally {
      setExporting(false)
    }
  }

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

  const renderHeaderCell = (
    placed: Placed<T>,
    index: number,
    rowSpan?: number,
    groupedChild = false,
    groupStart = false,
    groupEnd = false,
  ) => {
    const { column } = placed
    const sort = sortOf(column.id)
    const sortable = column.sortable !== false
    const reorderable = columnReordering && column.reorderable !== false
    const style: CSSProperties = {
      ...stickyStyle(placed),
      ...(groupedChild && (stickyHeader || placed.pin) ? { top: 40 } : {}),
    }

    return (
      <HeaderCell
        key={column.id}
        column={{ ...column, pin: placed.pin }}
        style={style}
        pinned={Boolean(placed.pin)}
        edge={placed.edge}
        rowSpan={rowSpan}
        groupStart={groupStart}
        groupEnd={groupEnd}
        stickyHeader={stickyHeader || Boolean(placed.pin)}
        sortable={sortable}
        filterable={column.filterable !== false}
        pinnable={columnPinning}
        resizable={columnResizing && column.resizable !== false}
        reorderable={reorderable}
        dragging={draggedColumn === column.id}
        dragTarget={dragTarget === column.id}
        canMoveLeft={reorderable && index > 0}
        canMoveRight={reorderable && index < layout.placed.length - 1}
        sortDirection={sort?.direction ?? false}
        sortIndex={sort && query.sort.length > 1 ? query.sort.indexOf(sort) + 1 : undefined}
        filter={query.filters.find((filter) => filter.id === column.id)}
        labels={labels}
        onSort={(direction, additive) => setSort(column.id, direction, additive)}
        onToggleSort={(additive) => toggleSort(column.id, additive)}
        onFilter={(filter) => setColumnFilter(column.id, filter)}
        onPin={(pin) => setPins((previous) => ({ ...previous, [column.id]: pin ?? 'none' }))}
        onMove={(direction) => moveColumn(column.id, direction)}
        onDragStart={(event) => startColumnDrag(event, column.id)}
        onDragOver={(event) => dragOverColumn(event, column.id)}
        onDrop={(event) => dropColumn(event, column.id)}
        onDragEnd={() => {
          draggedColumnRef.current = null
          setDraggedColumn(null)
          setDragTarget(null)
        }}
        onResizeStart={(event) => startColumnResize(event, column)}
        onResizeBy={(direction) => resizeColumnBy(column, direction)}
        onHide={
          column.hideable !== false && hideableCount > 1
            ? () => setHidden((previous) => ({ ...previous, [column.id]: true }))
            : undefined
        }
      />
    )
  }

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
              className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'text-muted-foreground data-[popup-open]:bg-muted')}
            >
              <MoreHorizontal aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              {menu.map((action, index) => (
                <div key={action.id}>
                  {action.separatorBefore && index > 0 && <DropdownMenuSeparator />}
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
  const pinnedCell =
    'isolate z-20 !bg-card group-hover/row:!bg-muted group-data-[selected=true]/row:!bg-brand-soft'

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
                columns={orderedColumns.map((column) => ({
                  id: column.id,
                  header: column.header,
                  visible: !hidden[column.id],
                  hideable: column.hideable !== false && (hidden[column.id] || hideableCount > 1),
                }))}
                labels={labels}
                onToggle={(id, visible) => setHidden((prev) => ({ ...prev, [id]: !visible }))}
                onReset={() => {
                  setHidden(defaultHidden)
                  setPins({})
                  setColumnOrder(columns.map((column) => column.id))
                  setColumnWidths({})
                }}
              />
            )}
            {densityControl && <DensityMenu value={density} labels={labels} onChange={setDensity} />}
            {exporter !== false && (
              <ExportMenu
                labels={labels}
                busy={exporting}
                canExportAll={canExportAll}
                onExport={(kind) => void handleExport(kind)}
              />
            )}
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
                    rowSpan={hasVisibleColumnGroups ? 2 : undefined}
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

                {hasVisibleColumnGroups
                  ? headerSegments.map((segment, segmentIndex) => {
                      if (!segment.group) {
                        const placed = segment.columns[0]
                        return renderHeaderCell(placed, placedIndexById.get(placed.column.id) ?? 0, 2)
                      }
                      const first = segment.columns[0]
                      const last = segment.columns[segment.columns.length - 1]
                      const reference = first.pin === 'right' ? last : first
                      return (
                        <th
                          key={`${segment.group.id}-${segmentIndex}`}
                          scope="colgroup"
                          colSpan={segment.columns.length}
                          title={segment.group.description}
                          style={{
                            ...stickyStyle(reference),
                            ...(stickyHeader || reference.pin ? { position: 'sticky', top: 0 } : {}),
                          }}
                          className={cn(
                            'dt-cell h-10 overflow-hidden border-x border-b border-border bg-secondary px-3 text-center text-xs font-medium text-muted-foreground',
                            reference.pin ? 'z-30' : 'z-20',
                            segment.group.headerClassName,
                          )}
                        >
                          {segment.group.header}
                        </th>
                      )
                    })
                  : layout.placed.map((placed, index) => renderHeaderCell(placed, index))}

                {hasActions && (
                  <th
                    scope="col"
                    rowSpan={hasVisibleColumnGroups ? 2 : undefined}
                    data-edge={layout.rightEdgeOnActions ? 'right' : undefined}
                    style={{ position: 'sticky', right: 0, top: stickyHeader ? 0 : undefined }}
                    className="dt-cell z-40 h-10 border-b border-border bg-muted"
                  >
                    <span className="sr-only">{labels.rowActions}</span>
                  </th>
                )}
              </tr>
              {hasVisibleColumnGroups && (
                <tr>
                  {headerSegments.flatMap((segment) =>
                    segment.group
                      ? segment.columns.map((placed, childIndex) =>
                          renderHeaderCell(
                            placed,
                            placedIndexById.get(placed.column.id) ?? 0,
                            undefined,
                            true,
                            childIndex === 0,
                            childIndex === segment.columns.length - 1,
                          ),
                        )
                      : [],
                  )}
                </tr>
              )}
            </thead>

            <tbody className={cn(loading && !showSkeleton && 'opacity-60 transition-opacity')}>
              {showSkeleton &&
                Array.from({ length: Math.min(pageSize, 8) }, (_, index) => (
                  <tr key={index} aria-hidden="true">
                    {selectable && (
                      <td className={cn(cellBase, rowHeight, pinnedCell)} style={{ position: 'sticky', left: 0 }} />
                    )}
                    {layout.placed.map((placed) => (
                      <td
                        key={placed.column.id}
                        className={cn(cellBase, rowHeight, placed.pin && pinnedCell)}
                        style={stickyStyle(placed)}
                      >
                        <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                    {hasActions && (
                      <td className={cn(cellBase, rowHeight, pinnedCell)} style={{ position: 'sticky', right: 0 }} />
                    )}
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
                              <Button type="button" variant="outline" onClick={clearAllFilters}>
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
                      'group/row bg-card outline-none hover:bg-muted data-[selected=true]:bg-brand-soft focus-visible:[&>td]:bg-muted',
                      onRowClick && 'cursor-pointer',
                      getRowClassName?.(row),
                    )}
                  >
                    {selectable && (
                      <td
                        data-edge={layout.leftEdgeOnSelect ? 'left' : undefined}
                        style={{ position: 'sticky', left: 0 }}
                        className={cn(cellBase, rowHeight, pinnedCell)}
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
                      const rowSpan = rowSpans?.get(column.id)?.[rowIndex] ?? 1
                      if (rowSpan === 0) return null
                      const align = column.align ?? (column.kind === 'number' ? 'right' : 'left')
                      return (
                        <td
                          key={column.id}
                          rowSpan={rowSpan > 1 ? rowSpan : undefined}
                          data-edge={placed.edge}
                          data-merged-rows={rowSpan > 1 ? rowSpan : undefined}
                          style={stickyStyle(placed)}
                          className={cn(
                            cellBase,
                            rowHeight,
                            placed.pin ? pinnedCell : undefined,
                            rowSpan > 1 && !placed.pin && '!bg-transparent group-hover/row:!bg-transparent',
                            align === 'right' && 'tnum text-right',
                            align === 'center' && 'text-center',
                            column.className,
                          )}
                        >
                          <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                            {renderCellContent(row, rowIndex, column)}
                          </div>
                        </td>
                      )
                    })}

                    {hasActions && (
                      <td
                        data-edge={layout.rightEdgeOnActions ? 'right' : undefined}
                        style={{ position: 'sticky', right: 0 }}
                        className={cn(cellBase, rowHeight, pinnedCell, 'z-30 px-2')}
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
