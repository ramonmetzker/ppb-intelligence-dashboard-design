'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const FILTERS = [
  { label: 'Business', value: 'GBM', options: ['GBM'] },
  { label: 'Product', value: 'HHP', options: ['HHP', 'Tablet', 'Wearable'] },
  { label: 'Year', value: '2026', options: ['2026', '2025'] },
]

export function PageHeader() {
  return (
    <div
      id="overview"
      className="flex flex-col gap-3 pb-1 md:flex-row md:items-end md:justify-between"
    >
      <div>
        <h1 className="font-display text-[24px] leading-7 font-semibold tracking-tight text-balance">
          PPB Overview
        </h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Where we are, where the year closes, and what each AI scenario changes.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        {FILTERS.map((filter) => (
          <div key={filter.label} className="flex flex-col gap-1">
            <span className="eyebrow">{filter.label}</span>
            <Select defaultValue={filter.value}>
              <SelectTrigger
                aria-label={filter.label}
                className="h-8 w-[112px] rounded-md border-input bg-card text-[12.5px] font-medium shadow-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {filter.options.map((option) => (
                  <SelectItem
                    key={option}
                    value={option}
                    disabled={option !== filter.value}
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  )
}
