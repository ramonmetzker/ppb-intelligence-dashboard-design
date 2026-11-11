const dateFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const shortDateFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'UTC',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export const formatDate = (value: string | Date) => dateFormat.format(new Date(value))
export const formatTime = (value: string | Date) => `${timeFormat.format(new Date(value))} UTC`
export const formatDateTime = (value: string | Date) => `${formatDate(value)}, ${formatTime(value)}`
export const formatNextRun = (value: Date) => `${shortDateFormat.format(value)}, ${formatTime(value)}`
