'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group'
import { kindOf, resolveColumn } from '@/lib/data-table/query'
import type { ColumnSchema } from '@/lib/data-table/types'
import { cn } from '@/lib/utils'
import type { DataTableLabels } from './filter-utils'

type Suggestion = { key: string; label: string; hint?: string; color?: string; apply: (word: string) => string }

type Props<T> = {
  value: string
  onChange: (value: string) => void
  schemas: readonly ColumnSchema<T>[]
  labels: DataTableLabels
  placeholder?: string
  debounceMs?: number
  className?: string
}

const quoteIfNeeded = (text: string) => (/\s/.test(text) ? `"${text}"` : text)

function currentWord(text: string, caret: number) {
  const before = text.slice(0, caret)
  const start = Math.max(before.lastIndexOf(' '), before.lastIndexOf('\t')) + 1
  return { start, word: before.slice(start), after: text.slice(caret) }
}

export function PowerSearch<T>({ value, onChange, schemas, labels, placeholder, debounceMs = 250, className }: Props<T>) {
  const uid = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(value)
  const [caret, setCaret] = useState(value.length)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const committed = useRef(value)

  useEffect(() => {
    if (value !== committed.current) {
      committed.current = value
      setDraft(value)
    }
  }, [value])

  useEffect(() => {
    if (draft === committed.current) return
    const timer = window.setTimeout(() => {
      committed.current = draft
      onChange(draft)
    }, debounceMs)
    return () => window.clearTimeout(timer)
  }, [draft, debounceMs, onChange])

  const commitNow = (next: string) => {
    committed.current = next
    onChange(next)
  }

  const suggestions = useMemo<Suggestion[]>(() => {
    const filterable = schemas.filter((s) => s.filterable !== false)
    const { word } = currentWord(draft, caret)
    const match = /^(-?)([^:=<>!"]+)(:|=)([^"]*)$/.exec(word)

    if (match) {
      const [, minus, field, operator, rest] = match
      const schema = resolveColumn(schemas, field)
      if (!schema) return []
      const kind = kindOf(schema)
      const lastComma = rest.lastIndexOf(',')
      const typed = rest.slice(lastComma + 1).toLowerCase()
      const head = rest.slice(0, lastComma + 1)
      const options =
        kind === 'select'
          ? (schema.options ?? [])
          : kind === 'boolean'
            ? [
                { value: 'yes', label: labels.yes },
                { value: 'no', label: labels.no },
              ]
            : []
      return options
        .filter((o) => !typed || o.label.toLowerCase().includes(typed) || o.value.toLowerCase().includes(typed))
        .slice(0, 8)
        .map((o) => ({
          key: `${schema.id}-${o.value}`,
          label: o.label,
          hint: schema.header,
          color: 'color' in o ? o.color : undefined,
          apply: () => `${minus}${schema.id}${operator}${head}${quoteIfNeeded(o.label)} `,
        }))
    }

    if (/[<>!=:"]/.test(word)) return []
    const typed = word.toLowerCase().replace(/[\s_-]/g, '')
    if (!typed && draft.trim() !== '') return []
    return filterable
      .filter((s) => !typed || s.id.toLowerCase().startsWith(typed) || s.header.toLowerCase().replace(/[\s_-]/g, '').startsWith(typed))
      .slice(0, 8)
      .map((s) => ({ key: s.id, label: s.header, hint: `${s.id}:`, apply: () => `${s.id}:` }))
  }, [draft, caret, schemas, labels])

  const showList = open && suggestions.length > 0

  const accept = (suggestion: Suggestion) => {
    const input = inputRef.current
    const position = input?.selectionStart ?? draft.length
    const { start, word, after } = currentWord(draft, position)
    const insert = suggestion.apply(word)
    const next = `${draft.slice(0, start)}${insert}${after.replace(/^\s+/, '')}`
    setDraft(next)
    setActive(-1)
    const nextCaret = start + insert.length
    requestAnimationFrame(() => {
      input?.focus()
      input?.setSelectionRange(nextCaret, nextCaret)
      setCaret(nextCaret)
    })
  }

  return (
    <div className={cn('relative min-w-0', className)}>
      <InputGroup className="h-9 bg-card">
        <InputGroupAddon align="inline-start">
          <Search aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label={labels.searchLabel}
          aria-expanded={showList}
          aria-controls={`${uid}-list`}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${uid}-opt-${active}` : undefined}
          title={labels.searchTip}
          autoComplete="off"
          spellCheck={false}
          value={draft}
          placeholder={placeholder ?? labels.searchPlaceholder}
          onChange={(event) => {
            setDraft(event.target.value)
            setCaret(event.target.selectionStart ?? event.target.value.length)
            setOpen(true)
            setActive(-1)
          }}
          onSelect={(event) => setCaret(event.currentTarget.selectionStart ?? draft.length)}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing || event.keyCode === 229) return
            if (event.key === 'ArrowDown' && suggestions.length) {
              event.preventDefault()
              setOpen(true)
              setActive((i) => (i + 1) % suggestions.length)
            } else if (event.key === 'ArrowUp' && suggestions.length) {
              event.preventDefault()
              setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
            } else if ((event.key === 'Enter' || event.key === 'Tab') && showList && active >= 0) {
              event.preventDefault()
              accept(suggestions[active])
            } else if (event.key === 'Enter') {
              event.preventDefault()
              commitNow(draft)
              setOpen(false)
            } else if (event.key === 'Escape') {
              if (showList) {
                event.preventDefault()
                event.stopPropagation()
                setOpen(false)
              } else if (draft) {
                setDraft('')
                commitNow('')
              }
            }
          }}
          className="h-full min-w-0 text-[13px] md:text-[13px]"
        />
        {draft && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label={labels.clearSearch}
              onClick={() => {
                setDraft('')
                commitNow('')
                inputRef.current?.focus()
              }}
            >
              <X aria-hidden="true" />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>

      {showList && (
        <ul
          id={`${uid}-list`}
          role="listbox"
          aria-label={labels.filterByColumn}
          onMouseDown={(event) => event.preventDefault()}
          className="absolute top-full right-0 left-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.key}
              id={`${uid}-opt-${index}`}
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
              onClick={() => accept(suggestion)}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px]',
                index === active && 'bg-muted',
              )}
            >
              {suggestion.color && (
                <span aria-hidden="true" className="size-2 rounded-[2px]" style={{ backgroundColor: suggestion.color }} />
              )}
              <span className="min-w-0 flex-1 truncate">{suggestion.label}</span>
              {suggestion.hint && <span className="shrink-0 font-mono text-xs text-muted-foreground">{suggestion.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
