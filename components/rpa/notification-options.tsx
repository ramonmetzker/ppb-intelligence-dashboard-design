'use client'

import { useId } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import type { RpaNotifications } from '@/lib/rpa/data'

const OPTIONS: { key: keyof RpaNotifications; label: string; hint: string }[] = [
  { key: 'success', label: 'Notify on success', hint: 'Get a notification every time a run finishes without errors.' },
  { key: 'error', label: 'Notify on error', hint: 'Get a notification when a run fails or finishes with warnings.' },
]

type Props = {
  value: RpaNotifications
  onChange: (value: RpaNotifications) => void
}

export function NotificationOptions({ value, onChange }: Props) {
  const uid = useId()

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-xs font-medium text-foreground">Notifications</legend>
      {OPTIONS.map((option) => (
        <label
          key={option.key}
          htmlFor={`${uid}-${option.key}`}
          className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50 has-data-checked:border-brand has-data-checked:bg-brand-soft/50"
        >
          <Checkbox
            id={`${uid}-${option.key}`}
            checked={value[option.key]}
            onCheckedChange={(checked) => onChange({ ...value, [option.key]: checked })}
            className="mt-0.5"
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{option.label}</span>
            <span className="text-xs text-muted-foreground">{option.hint}</span>
          </span>
        </label>
      ))}
    </fieldset>
  )
}
