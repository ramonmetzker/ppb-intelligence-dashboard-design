/**
 * Minimal 5 field cron support: minute hour day-of-month month day-of-week.
 * Supports `*`, lists (1,15), ranges (1-5) and steps (*\/15, 0-30/10). All times are UTC.
 */

type FieldSpec = { min: number; max: number }

const FIELDS: FieldSpec[] = [
  { min: 0, max: 59 },
  { min: 0, max: 23 },
  { min: 1, max: 31 },
  { min: 1, max: 12 },
  { min: 0, max: 7 },
]

const FIELD_LABELS = ['minute', 'hour', 'day of month', 'month', 'day of week']

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export type CronParseResult =
  | { ok: true; sets: [Set<number>, Set<number>, Set<number>, Set<number>, Set<number>]; fields: string[] }
  | { ok: false; error: string }

function parseField(source: string, { min, max }: FieldSpec, label: string): Set<number> | string {
  const values = new Set<number>()
  for (const part of source.split(',')) {
    const [range, stepText, extra] = part.split('/')
    if (extra !== undefined || !range) return `Invalid ${label}.`

    let step = 1
    if (stepText !== undefined) {
      if (!/^\d+$/.test(stepText) || Number(stepText) < 1) return `Invalid step in ${label}.`
      step = Number(stepText)
    }

    let from: number
    let to: number
    if (range === '*') {
      from = min
      to = max
    } else {
      const match = /^(\d+)(?:-(\d+))?$/.exec(range)
      if (!match) return `Invalid ${label}.`
      from = Number(match[1])
      to = match[2] === undefined ? (stepText === undefined ? from : max) : Number(match[2])
    }

    if (from < min || to > max || from > to) return `The ${label} must be between ${min} and ${max}.`
    for (let value = from; value <= to; value += step) values.add(value)
  }
  return values
}

export function parseCron(expression: string): CronParseResult {
  const fields = expression.trim().split(/\s+/)
  if (fields.length !== 5 || fields[0] === '') {
    return { ok: false, error: 'Use 5 fields: minute hour day-of-month month day-of-week.' }
  }

  const parsed: Set<number>[] = []
  for (let index = 0; index < 5; index++) {
    const result = parseField(fields[index], FIELDS[index], FIELD_LABELS[index])
    if (typeof result === 'string') return { ok: false, error: result }
    parsed.push(result)
  }

  const [minutes, hours, days, months, weekdays] = parsed
  // 7 is an alias for Sunday.
  if (weekdays.has(7)) {
    weekdays.delete(7)
    weekdays.add(0)
  }

  return { ok: true, sets: [minutes, hours, days, months, weekdays], fields }
}

export function normalizeCron(expression: string) {
  return expression.trim().split(/\s+/).join(' ')
}

export function isValidCron(expression: string) {
  return parseCron(expression).ok
}

const pad = (value: number) => String(value).padStart(2, '0')

function ordinal(day: number) {
  const mod100 = day % 100
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`
  return `${day}${{ 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] ?? 'th'}`
}

const isNumber = (value: string) => /^\d+$/.test(value)

/** Short plain-language summary of the most common schedule shapes. Falls back to "Custom schedule". */
export function describeCron(expression: string): string {
  const parsed = parseCron(expression)
  if (!parsed.ok) return 'Invalid schedule'
  const [minute, hour, dom, month, dow] = parsed.fields

  const everyDay = dom === '*' && month === '*'
  const timeLabel = () => {
    const minutes = parsed.sets[0]
    const hours = parsed.sets[1]
    return [...hours].flatMap((h) => [...minutes].map((m) => `${pad(h)}:${pad(m)}`)).join(', ')
  }

  if (minute === '*' && hour === '*' && everyDay && dow === '*') return 'Every minute'

  const minuteStep = /^\*\/(\d+)$/.exec(minute)
  if (minuteStep && hour === '*' && everyDay && dow === '*') return `Every ${minuteStep[1]} minutes`

  if (isNumber(minute) && hour === '*' && everyDay && dow === '*') {
    return Number(minute) === 0 ? 'Every hour' : `Every hour at minute ${Number(minute)}`
  }

  const hourStep = /^\*\/(\d+)$/.exec(hour)
  if (isNumber(minute) && hourStep && everyDay && dow === '*') {
    return `Every ${hourStep[1]} hours at minute ${Number(minute)}`
  }

  const fixedTime = /^[\d,]+$/.test(minute) && /^[\d,]+$/.test(hour)
  if (fixedTime && month === '*') {
    const at = `at ${timeLabel()}`
    if (dom === '*' && dow === '*') return `Every day ${at}`
    if (dom === '*' && dow === '1-5') return `Weekdays ${at}`
    if (dom === '*' && /^[0-7]$/.test(dow)) return `Every ${WEEKDAYS[Number(dow) % 7]} ${at}`
    if (dow === '*' && isNumber(dom)) return `Day ${ordinal(Number(dom))} of every month ${at}`
  }

  return 'Custom schedule'
}

/** Next run strictly after `from`, or null when nothing matches in the next 4 years. */
export function nextRun(expression: string, from: Date): Date | null {
  const parsed = parseCron(expression)
  if (!parsed.ok) return null
  const [minutes, hours, days, months, weekdays] = parsed.sets
  const [, , domField, , dowField] = parsed.fields
  const domRestricted = domField !== '*'
  const dowRestricted = dowField !== '*'

  const cursor = new Date(from.getTime())
  cursor.setUTCSeconds(0, 0)
  cursor.setUTCMinutes(cursor.getUTCMinutes() + 1)
  const limit = from.getTime() + 4 * 366 * 86_400_000

  while (cursor.getTime() <= limit) {
    if (!months.has(cursor.getUTCMonth() + 1)) {
      cursor.setUTCMonth(cursor.getUTCMonth() + 1, 1)
      cursor.setUTCHours(0, 0, 0, 0)
      continue
    }

    const dayMatches = days.has(cursor.getUTCDate())
    const weekdayMatches = weekdays.has(cursor.getUTCDay())
    const dayOk = domRestricted && dowRestricted ? dayMatches || weekdayMatches : dayMatches && weekdayMatches
    if (!dayOk) {
      cursor.setUTCDate(cursor.getUTCDate() + 1)
      cursor.setUTCHours(0, 0, 0, 0)
      continue
    }

    if (!hours.has(cursor.getUTCHours())) {
      cursor.setUTCHours(cursor.getUTCHours() + 1, 0, 0, 0)
      continue
    }

    if (!minutes.has(cursor.getUTCMinutes())) {
      cursor.setUTCMinutes(cursor.getUTCMinutes() + 1, 0, 0)
      continue
    }

    return cursor
  }
  return null
}

export const SCHEDULE_PRESETS = [
  { label: 'Every hour', cron: '0 * * * *' },
  { label: 'Daily 06:00', cron: '0 6 * * *' },
  { label: 'Weekdays 08:00', cron: '0 8 * * 1-5' },
  { label: 'Mondays 07:00', cron: '0 7 * * 1' },
  { label: 'Monthly, day 1', cron: '0 5 1 * *' },
] as const
