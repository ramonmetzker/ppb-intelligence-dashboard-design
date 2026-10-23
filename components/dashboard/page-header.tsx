'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const FILTERS = [
  { label: 'Plant', value: 'Manaus', options: ['Manaus', 'Campinas'] },
  { label: 'Business', value: 'MX', options: ['MX', 'VD', 'DA'] },
  { label: 'Product', value: 'HHP', options: ['HHP', 'Tablet', 'Wearable'] },
  { label: 'Year', value: '2026', options: ['2026', '2025', '2024'] },
]

export function PageHeader() {
  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <h1 className="text-[30px] leading-9 font-semibold tracking-tight text-balance">
          PPB Overview
        </h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          2026 annual compliance and optimization outlook
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        {FILTERS.map((filter) => (
          <div key={filter.label} className="flex flex-col gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              {filter.label}
            </span>
            <Select defaultValue={filter.value}>
              <SelectTrigger
                aria-label={filter.label}
                className="h-9 w-[132px] rounded-lg border-input bg-card text-[13px] font-medium shadow-none"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {filter.options.map((option) => (
                  <SelectItem key={option} value={option}>
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
