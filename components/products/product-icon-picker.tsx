'use client'

import { Code2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { PRODUCT_ICON_OPTIONS } from '@/lib/products/icons'
import { ProductIcon } from './product-icon'

type Props = {
  value: string
  onChange: (value: string) => void
}

export function ProductIconPicker({ value, onChange }: Props) {
  const selectedPreset = PRODUCT_ICON_OPTIONS.find((option) => option.svg === value)
  const customSelected = !selectedPreset

  return (
    <div className="flex flex-col gap-3">
      <div
        role="radiogroup"
        aria-label="Product icon"
        className="grid grid-cols-4 gap-2"
      >
        {PRODUCT_ICON_OPTIONS.map(({ key, label, Icon, svg }) => {
          const selected = selectedPreset?.key === key
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={label}
              onClick={() => onChange(svg)}
              className={cn(
                'flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-muted-foreground transition-colors focus-visible:outline-2 focus-visible:outline-ring',
                selected
                  ? 'border-brand bg-brand/10 text-brand'
                  : 'border-border hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              <span className="truncate text-[10px] font-medium">{label}</span>
            </button>
          )
        })}
        <button
          type="button"
          role="radio"
          aria-checked={customSelected}
          aria-label="Custom icon"
          onClick={() => onChange(selectedPreset ? '' : value)}
          className={cn(
            'flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-muted-foreground transition-colors focus-visible:outline-2 focus-visible:outline-ring',
            customSelected ? 'border-brand bg-brand/10 text-brand' : 'border-border hover:bg-muted hover:text-foreground',
          )}
        >
          <Code2 className="size-5" aria-hidden="true" />
          <span className="truncate text-[10px] font-medium">Custom</span>
        </button>
      </div>

      {customSelected && (
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Custom product icon"
          className="min-h-24 resize-y font-mono text-xs"
          spellCheck={false}
        />
      )}
    </div>
  )
}
