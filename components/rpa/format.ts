const timeZones = {
  utc: { id: 'UTC', label: 'UTC' },
  local: { id: 'Etc/GMT+4', label: 'GMT-4' },
} as const

type TimeZoneKey = keyof typeof timeZones

const dateFormats: Record<TimeZoneKey, Intl.DateTimeFormat> = {
  utc: new Intl.DateTimeFormat('en-US', {
    timeZone: timeZones.utc.id,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }),
  local: new Intl.DateTimeFormat('en-US', {
    timeZone: timeZones.local.id,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }),
}

const shortDateFormats: Record<TimeZoneKey, Intl.DateTimeFormat> = {
  utc: new Intl.DateTimeFormat('en-US', { timeZone: timeZones.utc.id, month: 'short', day: 'numeric' }),
  local: new Intl.DateTimeFormat('en-US', { timeZone: timeZones.local.id, month: 'short', day: 'numeric' }),
}

const timeFormats: Record<TimeZoneKey, Intl.DateTimeFormat> = {
  utc: new Intl.DateTimeFormat('en-GB', {
    timeZone: timeZones.utc.id,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }),
  local: new Intl.DateTimeFormat('en-GB', {
    timeZone: timeZones.local.id,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }),
}

const timeZoneKey = (localTime: boolean): TimeZoneKey => (localTime ? 'local' : 'utc')

export const formatDate = (value: string | Date) => dateFormats.utc.format(new Date(value))
export const formatTime = (value: string | Date) => `${timeFormats.utc.format(new Date(value))} UTC`
export const formatDateTime = (value: string | Date, localTime = false) => {
  const zone = timeZoneKey(localTime)
  return `${dateFormats[zone].format(new Date(value))}, ${timeFormats[zone].format(new Date(value))} ${timeZones[zone].label}`
}
export const formatNextRun = (value: Date, localTime = false) => {
  const zone = timeZoneKey(localTime)
  return `${shortDateFormats[zone].format(value)}, ${timeFormats[zone].format(value)} ${timeZones[zone].label}`
}
