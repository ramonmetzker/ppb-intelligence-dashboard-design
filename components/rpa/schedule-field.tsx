'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { describeCron, nextRun, normalizeCron, parseCron, SCHEDULE_PRESETS } from '@/lib/rpa/cron'
import { formatNextRun } from './format'
import { useNow } from './use-now'

type Props = {
  id: string
  value: string
  onChange: (value: string) => void
  error?: string
}

export function ScheduleField({ id, value, onChange, error }: Props) {
  const now = useNow()
  const parsed = parseCron(value)
  const next = parsed.ok && now !== null ? nextRun(value, new Date(now)) : null
  const inlineError = error ?? (!parsed.ok && value.trim() ? parsed.error : undefined)

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-foreground">
        Schedule (cron, UTC)
      </label>

      <div role="group" aria-label="Schedule presets" className="flex flex-wrap gap-1.5">
        {SCHEDULE_PRESETS.map((preset) => (
          <Button
            key={preset.cron}
            type="button"
            size="sm"
            variant="outline"
            aria-pressed={normalizeCron(value) === preset.cron}
            className="aria-pressed:border-brand aria-pressed:bg-brand-soft aria-pressed:text-brand-deep"
            onClick={() => onChange(preset.cron)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <Input
        id={id}
        value={value}
        spellCheck={false}
        autoComplete="off"
        placeholder="0 6 * * *"
        className="font-mono"
        aria-invalid={Boolean(inlineError)}
        aria-describedby={`${id}-help`}
        onChange={(event) => onChange(event.target.value)}
      />

      <div id={`${id}-help`} aria-live="polite" className="min-h-8 text-xs">
        {inlineError ? (
          <p role="alert" className="text-critical">
            {inlineError}
          </p>
        ) : (
          <>
            <p className="font-medium text-foreground">{describeCron(value)}</p>
            <p className="text-muted-foreground">
              {next ? `Next run ${formatNextRun(next)}` : 'minute hour day-of-month month day-of-week'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
