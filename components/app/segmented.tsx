'use client'

import { cn } from '@/lib/utils'

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex h-7 items-center rounded-md bg-secondary p-0.5"
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-6 rounded-[3px] px-2.5 text-[11.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring',
              selected
                ? 'bg-card text-foreground shadow-[0_0_0_1px_var(--border)]'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
