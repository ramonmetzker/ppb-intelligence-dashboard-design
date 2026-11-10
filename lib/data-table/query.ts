import {
  DEFAULT_QUERY,
  type ColumnFilter,
  type ColumnSchema,
  type DataTableQuery,
  type FilterKind,
  type FilterOp,
  type QueryResult,
  type SortState,
} from './types'

/* ------------------------------------------------------------------ */
/* Value access                                                        */
/* ------------------------------------------------------------------ */

export function kindOf<T>(schema: ColumnSchema<T>): FilterKind {
  return schema.kind ?? 'text'
}

export function getValue<T>(row: T, schema: ColumnSchema<T>): unknown {
  const { accessor } = schema
  if (typeof accessor === 'function') return accessor(row)
  if (accessor !== undefined) return row[accessor]
  return (row as Record<string, unknown>)[schema.id]
}

function isEmptyValue(value: unknown) {
  return value === null || value === undefined || value === ''
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (isEmptyValue(value)) return Number.NaN
  return Number(String(value).replace(',', '.'))
}

/* ------------------------------------------------------------------ */
/* Filters                                                             */
/* ------------------------------------------------------------------ */

export const FILTER_OPS: Record<FilterKind, readonly FilterOp[]> = {
  text: ['contains', 'notContains', 'equals', 'startsWith'],
  number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between'],
  select: ['in', 'notIn'],
  date: ['on', 'before', 'after', 'between'],
  boolean: ['is'],
}

export function defaultOp(kind: FilterKind): FilterOp {
  return FILTER_OPS[kind][0]
}

export function isFilterActive(filter: ColumnFilter): boolean {
  const { value, op } = filter
  if (typeof value === 'boolean') return true
  if (Array.isArray(value)) {
    if (op === 'between') return value.some((v) => v !== '')
    return value.length > 0
  }
  return value.trim() !== ''
}

export function matchesFilter<T>(row: T, schema: ColumnSchema<T>, filter: ColumnFilter): boolean {
  if (schema.filterFn) return schema.filterFn(row, filter)
  const raw = getValue(row, schema)
  const { op, value } = filter

  switch (kindOf(schema)) {
    case 'number': {
      const n = toNumber(raw)
      if (op === 'between' && Array.isArray(value)) {
        if (Number.isNaN(n)) return false
        const lo = toNumber(value[0])
        const hi = toNumber(value[1])
        return (Number.isNaN(lo) || n >= lo) && (Number.isNaN(hi) || n <= hi)
      }
      const target = toNumber(Array.isArray(value) ? value[0] : value)
      if (Number.isNaN(target)) return true
      if (op === 'neq') return Number.isNaN(n) || n !== target
      if (Number.isNaN(n)) return false
      if (op === 'gt') return n > target
      if (op === 'gte') return n >= target
      if (op === 'lt') return n < target
      if (op === 'lte') return n <= target
      return n === target
    }
    case 'date': {
      const d = isEmptyValue(raw) ? '' : String(raw).slice(0, 10)
      if (!d) return false
      if (op === 'between' && Array.isArray(value)) {
        const [from, to] = value
        return (!from || d >= from) && (!to || d <= to)
      }
      const target = Array.isArray(value) ? value[0] : String(value)
      if (!target) return true
      if (op === 'before') return d < target
      if (op === 'after') return d > target
      return d === target
    }
    case 'select': {
      const list = Array.isArray(value) ? value : [String(value)]
      if (list.length === 0) return true
      const hit = list.includes(String(raw ?? ''))
      return op === 'notIn' ? !hit : hit
    }
    case 'boolean':
      return Boolean(raw) === (typeof value === 'boolean' ? value : value === 'true')
    default: {
      const text = String(raw ?? '').toLowerCase()
      const q = String(Array.isArray(value) ? value[0] : value).toLowerCase()
      if (!q) return true
      if (op === 'equals') return text === q
      if (op === 'startsWith') return text.startsWith(q)
      if (op === 'notContains') return !text.includes(q)
      return text.includes(q)
    }
  }
}

/* ------------------------------------------------------------------ */
/* Powersearch                                                         */
/* ------------------------------------------------------------------ */

export type SearchToken = {
  raw: string
  start: number
  end: number
  columnId: string
  filter: ColumnFilter
}

export type ParsedSearch = {
  tokens: SearchToken[]
  /** Free-text terms, lowercased, matched against every searchable column. */
  terms: string[]
}

type Part = { raw: string; start: number; end: number }

function splitParts(input: string): Part[] {
  const parts: Part[] = []
  let start = -1
  let quoted = false
  for (let i = 0; i <= input.length; i++) {
    const ch = input[i]
    const boundary = i === input.length || (!quoted && /\s/.test(ch))
    if (boundary) {
      if (start >= 0) parts.push({ raw: input.slice(start, i), start, end: i })
      start = -1
      continue
    }
    if (start < 0) start = i
    if (ch === '"') quoted = !quoted
  }
  return parts
}

const unquote = (text: string) => text.replace(/"/g, '')
const normalizeKey = (text: string) => text.toLowerCase().replace(/[\s_\-.]/g, '')
const TOKEN_PATTERN = /^(-?)([^\s:=!<>"]+)(!=|>=|<=|:|=|>|<)(.*)$/

export function resolveColumn<T>(
  schemas: readonly ColumnSchema<T>[],
  key: string,
): ColumnSchema<T> | undefined {
  const wanted = normalizeKey(key)
  return schemas.find(
    (s) => s.filterable !== false && (normalizeKey(s.id) === wanted || normalizeKey(s.header) === wanted),
  )
}

export function resolveOptionValues<T>(schema: ColumnSchema<T>, raw: string): string[] {
  const options = schema.options ?? []
  return raw
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .map((part) => {
      const exact = options.find((o) => o.value.toLowerCase() === part || o.label.toLowerCase() === part)
      const loose =
        exact ??
        options.find((o) => o.label.toLowerCase().startsWith(part) || o.value.toLowerCase().startsWith(part))
      return loose?.value ?? part
    })
}

const PARTIAL_DATE = /^\d{4}(-\d{2})?$/
const FULL_DATE = /^\d{4}-\d{2}-\d{2}$/

function monthRange(value: string): [string, string] {
  if (value.length === 4) return [`${value}-01-01`, `${value}-12-31`]
  return [`${value}-01`, `${value}-31`]
}

function buildFilter<T>(
  schema: ColumnSchema<T>,
  negate: boolean,
  operator: string,
  rawValue: string,
): ColumnFilter | null {
  const id = schema.id
  const value = unquote(rawValue).trim()
  if (!value) return null
  const neg = negate || operator === '!='

  switch (kindOf(schema)) {
    case 'select': {
      if (operator !== ':' && operator !== '=' && operator !== '!=') return null
      return { id, op: neg ? 'notIn' : 'in', value: resolveOptionValues(schema, value) }
    }
    case 'number': {
      if (operator === ':' || operator === '=' || operator === '!=') {
        const range = value.split('..')
        if (range.length === 2 && range.every((p) => p === '' || !Number.isNaN(toNumber(p))) && (range[0] || range[1])) {
          return { id, op: 'between', value: range }
        }
      }
      if (Number.isNaN(toNumber(value))) return null
      const op: FilterOp =
        operator === '>' ? 'gt' : operator === '>=' ? 'gte' : operator === '<' ? 'lt' : operator === '<=' ? 'lte' : neg ? 'neq' : 'eq'
      return { id, op, value }
    }
    case 'date': {
      if (operator === '!=') return null
      const range = value.split('..')
      const isDate = (v: string) => v === '' || FULL_DATE.test(v)
      if (range.length === 2 && range.every(isDate) && (range[0] || range[1])) {
        return { id, op: 'between', value: range }
      }
      if (!PARTIAL_DATE.test(value) && !FULL_DATE.test(value)) return null
      const partial = PARTIAL_DATE.test(value)
      if (operator === '>=') return { id, op: 'between', value: [partial ? monthRange(value)[0] : value, ''] }
      if (operator === '<=') return { id, op: 'between', value: ['', partial ? monthRange(value)[1] : value] }
      if (operator === '>') return { id, op: 'after', value: partial ? monthRange(value)[1] : value }
      if (operator === '<') return { id, op: 'before', value: partial ? monthRange(value)[0] : value }
      if (partial) return { id, op: 'between', value: monthRange(value) }
      return { id, op: 'on', value }
    }
    case 'boolean': {
      if (operator !== ':' && operator !== '=' && operator !== '!=') return null
      const lowered = value.toLowerCase()
      const yes = ['yes', 'true', '1', 'y'].includes(lowered)
      const no = ['no', 'false', '0', 'n'].includes(lowered)
      if (!yes && !no) return null
      return { id, op: 'is', value: neg ? !yes : yes }
    }
    default: {
      if (operator === '>' || operator === '<' || operator === '>=' || operator === '<=') return null
      if (operator === '=') return { id, op: neg ? 'notContains' : 'equals', value }
      return { id, op: neg ? 'notContains' : 'contains', value }
    }
  }
}

export function parseSearch<T>(search: string, schemas: readonly ColumnSchema<T>[]): ParsedSearch {
  const tokens: SearchToken[] = []
  const terms: string[] = []
  for (const part of splitParts(search)) {
    const match = TOKEN_PATTERN.exec(part.raw)
    if (match) {
      const [, minus, field, operator, rest] = match
      const schema = resolveColumn(schemas, field)
      if (schema) {
        if (!unquote(rest).trim()) continue
        const filter = buildFilter(schema, minus === '-', operator, rest)
        if (filter) {
          tokens.push({ ...part, columnId: schema.id, filter })
          continue
        }
      }
    }
    const term = unquote(part.raw).trim().toLowerCase()
    if (term) terms.push(term)
  }
  return { tokens, terms }
}

/** Removes one token from the raw search string and tidies the whitespace. */
export function removeSearchToken(search: string, token: Pick<SearchToken, 'start' | 'end'>): string {
  return `${search.slice(0, token.start)} ${search.slice(token.end)}`.replace(/\s+/g, ' ').trim()
}

/* ------------------------------------------------------------------ */
/* Sorting                                                             */
/* ------------------------------------------------------------------ */

function compareValues<T>(a: T, b: T, schema: ColumnSchema<T>): number {
  if (schema.sortFn) return schema.sortFn(a, b)
  const av = getValue(a, schema)
  const bv = getValue(b, schema)
  switch (kindOf(schema)) {
    case 'number':
      return toNumber(av) - toNumber(bv)
    case 'boolean':
      return Number(Boolean(av)) - Number(Boolean(bv))
    case 'date':
      return String(av).localeCompare(String(bv))
    case 'select': {
      const label = (v: unknown) =>
        schema.options?.find((o) => o.value === String(v))?.label ?? String(v ?? '')
      return label(av).localeCompare(label(bv), undefined, { numeric: true, sensitivity: 'base' })
    }
    default:
      return String(av ?? '').localeCompare(String(bv ?? ''), undefined, {
        numeric: true,
        sensitivity: 'base',
      })
  }
}

function sortRows<T>(rows: T[], schemas: ReadonlyMap<string, ColumnSchema<T>>, sort: readonly SortState[]): T[] {
  const active = sort.filter((s) => schemas.has(s.id))
  if (active.length === 0) return rows
  return [...rows].sort((a, b) => {
    for (const { id, direction } of active) {
      const schema = schemas.get(id)!
      const aEmpty = isEmptyValue(getValue(a, schema))
      const bEmpty = isEmptyValue(getValue(b, schema))
      if (aEmpty || bEmpty) {
        if (aEmpty && bEmpty) continue
        return aEmpty ? 1 : -1
      }
      const result = compareValues(a, b, schema)
      if (result !== 0) return direction === 'asc' ? result : -result
    }
    return 0
  })
}

/* ------------------------------------------------------------------ */
/* Query                                                               */
/* ------------------------------------------------------------------ */

function searchTextOf<T>(row: T, schema: ColumnSchema<T>): string {
  if (schema.searchText) return schema.searchText(row).toLowerCase()
  const raw = getValue(row, schema)
  if (isEmptyValue(raw)) return ''
  const text = String(raw).toLowerCase()
  if (kindOf(schema) === 'select') {
    const label = schema.options?.find((o) => o.value === String(raw))?.label
    return label ? `${text} ${label.toLowerCase()}` : text
  }
  return text
}

function isSearchable<T>(schema: ColumnSchema<T>) {
  if (schema.searchable !== undefined) return schema.searchable
  const kind = kindOf(schema)
  return kind === 'text' || kind === 'select'
}

/** Column filters plus the filters hidden inside the powersearch tokens. */
export function effectiveFilters<T>(
  query: Pick<DataTableQuery, 'filters' | 'search'>,
  schemas: readonly ColumnSchema<T>[],
): { filters: ColumnFilter[]; terms: string[] } {
  const parsed = parseSearch(query.search, schemas)
  return {
    filters: [...query.filters.filter(isFilterActive), ...parsed.tokens.map((t) => t.filter)],
    terms: parsed.terms,
  }
}

export function filterAndSort<T>(
  rows: readonly T[],
  schemas: readonly ColumnSchema<T>[],
  query: Pick<DataTableQuery, 'filters' | 'search' | 'sort'>,
): T[] {
  const byId = new Map(schemas.map((s) => [s.id, s]))
  const { filters, terms } = effectiveFilters(query, schemas)
  const searchable = schemas.filter(isSearchable)

  const filtered = rows.filter((row) => {
    for (const filter of filters) {
      const schema = byId.get(filter.id)
      if (schema && !matchesFilter(row, schema, filter)) return false
    }
    for (const term of terms) {
      if (!searchable.some((schema) => searchTextOf(row, schema).includes(term))) return false
    }
    return true
  })

  return sortRows(filtered, byId, query.sort)
}

export function clampPage(page: number, total: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  return { page: Math.min(Math.max(1, page), pageCount), pageCount }
}

/** The whole pipeline. Client mode runs this in the browser; a server route can run the same call. */
export function runQuery<T>(
  rows: readonly T[],
  schemas: readonly ColumnSchema<T>[],
  query: DataTableQuery,
  paginate = true,
): QueryResult<T> {
  const filtered = filterAndSort(rows, schemas, query)
  const total = filtered.length
  if (!paginate) return { filtered, pageRows: filtered, total, page: 1, pageCount: 1 }
  const { page, pageCount } = clampPage(query.page, total, query.pageSize)
  const startAt = (page - 1) * query.pageSize
  return { filtered, pageRows: filtered.slice(startAt, startAt + query.pageSize), total, page, pageCount }
}

/* ------------------------------------------------------------------ */
/* URL serialisation (server mode)                                      */
/* ------------------------------------------------------------------ */

export function queryToParams(query: DataTableQuery, defaults: DataTableQuery = DEFAULT_QUERY): URLSearchParams {
  const params = new URLSearchParams()
  if (query.page !== 1) params.set('page', String(query.page))
  if (query.pageSize !== defaults.pageSize) params.set('size', String(query.pageSize))
  if (query.sort.length) params.set('sort', query.sort.map((s) => `${s.id}:${s.direction}`).join(','))
  if (query.search.trim()) params.set('q', query.search)
  for (const filter of query.filters.filter(isFilterActive)) {
    params.append('f', JSON.stringify([filter.id, filter.op, filter.value]))
  }
  return params
}

type ParamSource = { get(name: string): string | null; getAll(name: string): string[] }

export function paramsToQuery(params: ParamSource, defaults: DataTableQuery = DEFAULT_QUERY): DataTableQuery {
  const page = Number(params.get('page'))
  const size = Number(params.get('size'))
  const sort: SortState[] = (params.get('sort') ?? '')
    .split(',')
    .map((chunk) => chunk.split(':'))
    .filter(([id, dir]) => id && (dir === 'asc' || dir === 'desc'))
    .map(([id, dir]) => ({ id, direction: dir as SortState['direction'] }))

  const filters: ColumnFilter[] = []
  for (const entry of params.getAll('f')) {
    try {
      const [id, op, value] = JSON.parse(entry)
      if (typeof id === 'string' && typeof op === 'string' && value !== undefined) {
        filters.push({ id, op: op as FilterOp, value })
      }
    } catch {
      // Ignore malformed filter entries instead of failing the whole request.
    }
  }

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: Number.isInteger(size) && size > 0 && size <= 500 ? size : defaults.pageSize,
    sort,
    filters,
    search: params.get('q') ?? '',
  }
}
