'use client'

import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { FILTER_OPS, defaultOp, isFilterActive, kindOf } from '@/lib/data-table/query'
import type { ColumnFilter, ColumnSchema, FilterOp, FilterValue } from '@/lib/data-table/types'
import { cn } from '@/lib/utils'
import type { DataTableLabels } from './filter-utils'

type Props<T> = {
  schema: ColumnSchema<T>
  filter: ColumnFilter | undefined
  labels: DataTableLabels
  onApply: (filter: ColumnFilter | null) => void
}

const selectClass =
  'h-8 w-full rounded-lg border border-input bg-transparent px-2 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

function initialValue(op: FilterOp, kind: ReturnType<typeof kindOf>, current?: FilterValue): FilterValue {
  if (current !== undefined) return current
  if (kind === 'select') return []
  if (kind === 'boolean') return true
  return op === 'between' ? ['', ''] : ''
}

export function ColumnFilterEditor<T>({ schema, filter, labels, onApply }: Props<T>) {
  const uid = useId()
  const kind = kindOf(schema)
  const [op, setOp] = useState<FilterOp>(filter?.op ?? defaultOp(kind))
  const [value, setValue] = useState<FilterValue>(() => initialValue(filter?.op ?? defaultOp(kind), kind, filter?.value))

  const changeOp = (next: FilterOp) => {
    const wasRange = op === 'between'
    const isRange = next === 'between'
    setOp(next)
    if (wasRange !== isRange && kind !== 'select' && kind !== 'boolean') {
      setValue(isRange ? [typeof value === 'string' ? value : '', ''] : Array.isArray(value) ? value[0] : '')
    }
  }

  const draft: ColumnFilter = { id: schema.id, op, value }
  const canApply = isFilterActive(draft)
  const apply = () => onApply(canApply ? draft : null)

  const inputType = kind === 'number' ? 'number' : kind === 'date' ? 'date' : 'text'
  const rangeValue = Array.isArray(value) ? value : ['', '']

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        apply()
      }}
    >
      {kind !== 'boolean' && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`${uid}-op`} className="text-xs font-medium text-muted-foreground">
            {schema.header}
          </label>
          <select
            id={`${uid}-op`}
            value={op}
            onChange={(event) => changeOp(event.target.value as FilterOp)}
            className={selectClass}
          >
            {FILTER_OPS[kind].map((candidate) => (
              <option key={candidate} value={candidate}>
                {labels.ops[candidate as keyof typeof labels.ops]}
              </option>
            ))}
          </select>
        </div>
      )}

      {kind === 'select' && (
        <ul className="-mx-1 flex max-h-56 flex-col overflow-y-auto" role="group" aria-label={labels.valuesFor(schema.header)}>
          {(schema.options ?? []).map((option) => {
            const selected = Array.isArray(value) && value.includes(option.value)
            const id = `${uid}-${option.value}`
            return (
              <li key={option.value}>
                <label
                  htmlFor={id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-[13px] hover:bg-muted"
                >
                  <Checkbox
                    id={id}
                    checked={selected}
                    onCheckedChange={(checked) => {
                      const current = Array.isArray(value) ? value : []
                      setValue(checked ? [...current, option.value] : current.filter((v) => v !== option.value))
                    }}
                  />
                  {option.color && (
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  <span className="min-w-0 truncate">{option.label}</span>
                </label>
              </li>
            )
          })}
        </ul>
      )}

      {kind === 'boolean' && (
        <div role="radiogroup" aria-label={schema.header} className="flex gap-1.5">
          {[true, false].map((option) => (
            <button
              key={String(option)}
              type="button"
              role="radio"
              aria-checked={value === option}
              onClick={() => setValue(option)}
              className={cn(
                'h-8 flex-1 rounded-lg border text-[13px] font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                value === option
                  ? 'border-brand bg-brand-soft text-brand-deep'
                  : 'border-input hover:bg-muted',
              )}
            >
              {option ? labels.yes : labels.no}
            </button>
          ))}
        </div>
      )}

      {(kind === 'text' || kind === 'number' || kind === 'date') && op !== 'between' && (
        <Input
          type={inputType}
          autoFocus
          aria-label={labels.value}
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => setValue(event.target.value)}
          placeholder={kind === 'text' ? labels.value : undefined}
          className="tnum"
        />
      )}

      {(kind === 'number' || kind === 'date') && op === 'between' && (
        <div className="grid grid-cols-2 gap-2">
          <Input
            type={inputType}
            autoFocus
            aria-label={kind === 'date' ? labels.from : labels.min}
            placeholder={kind === 'date' ? labels.from : labels.min}
            value={rangeValue[0] ?? ''}
            onChange={(event) => setValue([event.target.value, rangeValue[1] ?? ''])}
            className="tnum"
          />
          <Input
            type={inputType}
            aria-label={kind === 'date' ? labels.to : labels.max}
            placeholder={kind === 'date' ? labels.to : labels.max}
            value={rangeValue[1] ?? ''}
            onChange={(event) => setValue([rangeValue[0] ?? '', event.target.value])}
            className="tnum"
          />
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => onApply(null)} disabled={!filter}>
          {labels.clear}
        </Button>
        <Button type="submit" size="sm">
          {labels.apply}
        </Button>
      </div>
    </form>
  )
}
