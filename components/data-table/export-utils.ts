export type ExportColumn<T> = {
  header: string
  value: (row: T) => unknown
}

function safeFileName(value: string) {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return normalized || 'table'
}

function csvCell(value: unknown) {
  if (value === null || value === undefined) return ''
  const text = value instanceof Date ? value.toISOString() : typeof value === 'object' ? JSON.stringify(value) : String(value)
  const injectionSafe = typeof value === 'string' && /^[=+@\t\r-]/.test(text) ? `'${text}` : text
  return `"${injectionSafe.replace(/"/g, '""')}"`
}

function download(content: string, type: string, fileName: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function downloadCsv<T>(rows: readonly T[], columns: readonly ExportColumn<T>[], fileName: string) {
  const header = columns.map((column) => csvCell(column.header)).join(',')
  const body = rows.map((row) => columns.map((column) => csvCell(column.value(row))).join(',')).join('\r\n')
  download(`\uFEFF${header}${body ? `\r\n${body}` : ''}`, 'text/csv;charset=utf-8', `${safeFileName(fileName)}.csv`)
}

export function downloadJson<T>(rows: readonly T[], fileName: string) {
  download(JSON.stringify(rows, null, 2), 'application/json;charset=utf-8', `${safeFileName(fileName)}.json`)
}
