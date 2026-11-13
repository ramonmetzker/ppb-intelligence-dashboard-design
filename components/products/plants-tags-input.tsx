'use client'

import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatPlants, parsePlants } from '@/lib/products/data'
import { cn } from '@/lib/utils'
import { useRef, useState, type KeyboardEvent } from 'react'

type Props = {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  invalid?: boolean
}

export function PlantsTagsInput({ id, value, onChange, placeholder, invalid }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState('')
  const plants = parsePlants(value)

  const commit = (raw: string) => {
    const additions = raw.split(',').map((plant) => plant.trim()).filter(Boolean)
    if (additions.length === 0) return

    const next = parsePlants(formatPlants([...plants, ...additions]))
    onChange(formatPlants(next))
  }

  const handleChange = (nextValue: string) => {
    const parts = nextValue.split(',')
    if (parts.length === 1) {
      setDraft(nextValue)
      return
    }

    commit(parts.slice(0, -1).join(','))
    setDraft(parts.at(-1)?.trimStart() ?? '')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return

    if (event.key === 'Enter') {
      event.preventDefault()
      commit(draft)
      setDraft('')
      return
    }

    if (event.key === 'Backspace' && !draft && plants.length > 0) {
      event.preventDefault()
      onChange(formatPlants(plants.slice(0, -1)))
    }
  }

  const handleBlur = () => {
    commit(draft)
    setDraft('')
  }

  return (
    <div
      role="group"
      aria-label="Plants"
      className={cn(
        'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 shadow-xs transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30',
        invalid && 'border-critical focus-within:border-critical focus-within:ring-critical/30',
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {plants.map((plant) => (
        <Badge key={plant} variant="secondary" className="h-6 gap-1 pl-2 pr-1 text-xs">
          {plant}
          <button
            type="button"
            aria-label={`Remove ${plant}`}
            className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            onClick={(event) => {
              event.stopPropagation()
              onChange(formatPlants(plants.filter((item) => item.toLowerCase() !== plant.toLowerCase())))
              inputRef.current?.focus()
            }}
          >
            <X className="size-3" aria-hidden="true" />
          </button>
        </Badge>
      ))}
      <Input
        ref={inputRef}
        id={id}
        value={draft}
        placeholder={plants.length === 0 ? placeholder : undefined}
        aria-invalid={invalid}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="h-7 min-w-28 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
      />
    </div>
  )
}
