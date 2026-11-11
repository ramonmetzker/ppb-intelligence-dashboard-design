import { kindOf } from '@/lib/data-table/query'
import type { DataTableLabels } from '@/lib/data-table/locales'
import type { ColumnFilter, ColumnSchema } from '@/lib/data-table/types'

export type { DataTableLabels }

export function describeFilterValue<T>(schema: ColumnSchema<T>, filter: ColumnFilter, labels: DataTableLabels): string {
  const { value, op } = filter
  switch (kindOf(schema)) {
    case 'boolean':
      return value === true ? labels.yes : labels.no
    case 'select': {
      const list = Array.isArray(value) ? value : [String(value)]
      return list.map((v) => schema.options?.find((o) => o.value === v)?.label ?? v).join(', ')
    }
    default:
      if (op === 'between' && Array.isArray(value)) {
        const [from, to] = value
        if (from && to) return `${from} - ${to}`
        return from ? `>= ${from}` : `<= ${to}`
      }
      return String(Array.isArray(value) ? value[0] : value)
  }
}

export function describeFilter<T>(schema: ColumnSchema<T>, filter: ColumnFilter, labels: DataTableLabels): string {
  const op = labels.ops[filter.op as keyof typeof labels.ops]
  const value = describeFilterValue(schema, filter, labels)
  if (filter.op === 'between') return `${schema.header}: ${value}`
  return `${schema.header} ${op} ${value}`
}
