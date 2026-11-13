import type { ReactNode } from 'react'

export type SortDirection = 'asc' | 'desc'
export type SortState = { id: string; direction: SortDirection }

export type FilterKind = 'text' | 'number' | 'select' | 'date' | 'boolean'

export type TextOp = 'contains' | 'notContains' | 'equals' | 'startsWith'
export type NumberOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'between'
export type SelectOp = 'in' | 'notIn'
export type DateOp = 'on' | 'before' | 'after' | 'between'
export type BooleanOp = 'is'
export type FilterOp = TextOp | NumberOp | SelectOp | DateOp | BooleanOp

/**
 * Filter values are kept as plain serialisable data so they can travel in a
 * URL or a request body: text/number/date are strings, `between` is a
 * [from, to] tuple, `select` is a list of option values, `boolean` is a boolean.
 */
export type FilterValue = string | string[] | boolean

export type ColumnFilter = { id: string; op: FilterOp; value: FilterValue }

export type DataTableQuery = {
  /** 1-based page number. */
  page: number
  pageSize: number
  sort: SortState[]
  filters: ColumnFilter[]
  /** Raw powersearch string. Parsed into tokens and free text by `parseSearch`. */
  search: string
}

export type SelectOption = {
  value: string
  label: string
  /** Optional swatch colour (any CSS colour) shown next to the label in menus. */
  color?: string
}

/**
 * Everything the query engine needs to know about a column. It contains no JSX,
 * so the same schema can be imported by a server route to run the identical
 * filter/sort logic that client mode runs in the browser.
 */
export interface ColumnSchema<T> {
  id: string
  header: string
  /** Key of the row, or a function. Defaults to `row[id]`. */
  accessor?: keyof T | ((row: T) => unknown)
  kind?: FilterKind
  options?: readonly SelectOption[]
  /** Set to false to exclude the column from filters and `field:value` powersearch tokens. */
  filterable?: boolean
  /** Included in the free-text part of the powersearch. Defaults to true for text and select. */
  searchable?: boolean
  /** Text used by the free-text search. Defaults to the accessor value (or option label). */
  searchText?: (row: T) => string
  sortFn?: (a: T, b: T) => number
  filterFn?: (row: T, filter: ColumnFilter) => boolean
}

export type CellContext<T> = {
  row: T
  value: unknown
  rowIndex: number
  column: DataTableColumn<T>
}

export type HeaderContext<T> = {
  column: DataTableColumn<T>
  sorted: SortDirection | false
}

export interface DataTableColumn<T> extends ColumnSchema<T> {
  sortable?: boolean
  filterable?: boolean
  /** Allow users to hide this column from the Columns menu. Defaults to true. */
  hideable?: boolean
  defaultHidden?: boolean
  /** Pin to an edge. Pinned columns stay visible while the rest scrolls horizontally. */
  pin?: 'left' | 'right'
  /** Width in px. Required to be a number so sticky offsets can be computed. Defaults to 160. */
  width?: number
  /** Bounds applied when the user resizes the column. Defaults to 80 and 640. */
  minWidth?: number
  maxWidth?: number
  /** Opt out of user resizing or reordering for this column. */
  resizable?: boolean
  reorderable?: boolean
  /** Lets the column absorb leftover horizontal space. Only one unpinned column should grow. */
  grow?: boolean
  align?: 'left' | 'right' | 'center'
  /** Replaces the cell content. Receives the row and its raw accessor value. */
  cell?: (ctx: CellContext<T>) => ReactNode
  /** Replaces the header label. Sort and filter controls are still rendered. */
  renderHeader?: (ctx: HeaderContext<T>) => ReactNode
  /** Short help text shown as the header tooltip. */
  description?: string
  /** Opt out of automatic equal-value row merging for this column. */
  mergeRows?: boolean
  /** Stable comparison value for row merging when the accessor returns a complex value. */
  getMergeValue?: (row: T) => unknown
  /** Plain value used by visual exports instead of the rendered React cell. */
  exportValue?: (row: T, value: unknown) => string | number | boolean | null | undefined
  className?: string
  headerClassName?: string
}

export type DataTableColumnGroup<T> = {
  id: string
  header: string
  description?: string
  headerClassName?: string
  children: readonly DataTableColumn<T>[]
}

export type DataTableColumnDefinition<T> = DataTableColumn<T> | DataTableColumnGroup<T>

export function isDataTableColumnGroup<T>(
  column: DataTableColumnDefinition<T>,
): column is DataTableColumnGroup<T> {
  return 'children' in column
}

export type ActionConfirm = {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
}

export type RowAction<T> = {
  id: string
  label: string
  icon?: ReactNode
  onSelect: (row: T) => void
  confirm?: ActionConfirm | ((row: T) => ActionConfirm)
  tone?: 'default' | 'destructive'
  disabled?: boolean
  hidden?: boolean
  /** Rendered as an icon button in the row instead of inside the menu (max 2 per row). */
  inline?: boolean
  separatorBefore?: boolean
}

export type SelectionContext<T> = {
  ids: string[]
  /** Rows the table has seen. In server mode this can be fewer than `ids` or `total`. */
  rows: T[]
  /** True when the user chose "select all N matching". The ids then only cover loaded rows. */
  allMatching: boolean
  /** Number of rows the action applies to. */
  count: number
  query: DataTableQuery
}

export type BulkAction<T> = {
  id: string
  label: string
  icon?: ReactNode
  onSelect: (ctx: SelectionContext<T>) => void
  confirm?: ActionConfirm | ((ctx: SelectionContext<T>) => ActionConfirm)
  tone?: 'default' | 'destructive'
  disabled?: (ctx: SelectionContext<T>) => boolean
}

export type RowReorderUpdate<T> = {
  id: string
  row: T
  index: number
  position: number
}

export type RowReorderContext<T> = {
  activeId: string
  overId: string
  fromIndex: number
  toIndex: number
  rows: T[]
  reorderedRows: T[]
  updates: RowReorderUpdate<T>[]
}

export type DataTableRowReordering<T> = {
  onReorder: (context: RowReorderContext<T>) => void
  disabled?: boolean
}

export type Density = 'compact' | 'default' | 'comfortable'

export type QueryChangeReason = 'page' | 'pageSize' | 'sort' | 'filter' | 'search' | 'reset'

export type QueryResult<T> = {
  /** Rows after filtering and sorting, before pagination. */
  filtered: T[]
  /** The current page. */
  pageRows: T[]
  total: number
  page: number
  pageCount: number
}

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

export const DEFAULT_QUERY: DataTableQuery = {
  page: 1,
  pageSize: 25,
  sort: [],
  filters: [],
  search: '',
}
