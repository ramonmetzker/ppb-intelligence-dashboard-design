import { ITEMS, type ItemKey } from '@/lib/ppb-model'

export const OPEN_ENDED_DATE = '2999-12-31'

export const PRICE_IMPORT_HEADERS = [
  'Part Number',
  'Description',
  'Spec',
  'PPB Item',
  'FOB',
  'Freight',
  'CIF',
  'II',
  'Landed Price',
  'Landed vs FOB',
  'Local Price',
  'Diff',
  'Valid From',
  'Valid To',
  'Cost / Point',
] as const

export type MaterialPrice = {
  id: string
  partNumber: string
  description: string
  spec: string
  ppbItem: ItemKey | null
  importedFob: number
  importedFreight: number
  importedCif: number
  importedIi: number
  importedLandedPrice: number
  importedLandedVsFob: number
  localPrice: number
  diff: number
  validFrom: string
  validTo: string
  costPerPoint: number
}

export type PriceImportStatus = 'new' | 'replace' | 'same'

export type PriceImportRow = MaterialPrice & {
  line: number
  status: PriceImportStatus
  previous?: MaterialPrice
}

export type PriceImportPreview = {
  rows: PriceImportRow[]
  errors: string[]
  hasInput: boolean
}

const rowId = (partNumber: string, validFrom: string) => `${partNumber}|${validFrom}`

const row = (values: Omit<MaterialPrice, 'id'>): MaterialPrice => ({
  ...values,
  id: rowId(values.partNumber, values.validFrom),
})

export const MATERIAL_PRICE_ROWS: readonly MaterialPrice[] = [
  row({
    partNumber: '1108-000750',
    description: 'A366/A566',
    spec: 'UMCP 256x64',
    ppbItem: 'memory',
    importedFob: 166.3,
    importedFreight: 1.66,
    importedCif: 167.96,
    importedIi: 12.09,
    importedLandedPrice: 180.05,
    importedLandedVsFob: 0.0827,
    localPrice: 171.3,
    diff: -8.75,
    validFrom: '2026-10-01',
    validTo: OPEN_ENDED_DATE,
    costPerPoint: -0.0194,
  }),
  row({
    partNumber: '1108-000750',
    description: 'A366/A566',
    spec: 'UMCP 256x64',
    ppbItem: 'memory',
    importedFob: 160,
    importedFreight: 1.6,
    importedCif: 161.6,
    importedIi: 11.64,
    importedLandedPrice: 173.24,
    importedLandedVsFob: 0.0828,
    localPrice: 174.6,
    diff: 1.36,
    validFrom: '2026-01-01',
    validTo: '2026-09-30',
    costPerPoint: 0.003,
  }),
  row({
    partNumber: '1108-000751',
    description: 'A366/A566',
    spec: 'UMCP 512x64',
    ppbItem: 'memory',
    importedFob: 214.8,
    importedFreight: 2.15,
    importedCif: 216.95,
    importedIi: 15.62,
    importedLandedPrice: 232.57,
    importedLandedVsFob: 0.082,
    localPrice: 221.4,
    diff: -11.17,
    validFrom: '2026-10-01',
    validTo: OPEN_ENDED_DATE,
    costPerPoint: -0.0248,
  }),
  row({
    partNumber: '1108-001120',
    description: 'EB-BS938',
    spec: 'Li-ion Cell 5000mAh',
    ppbItem: 'battery',
    importedFob: 8,
    importedFreight: 0.08,
    importedCif: 8.08,
    importedIi: 0.58,
    importedLandedPrice: 8.66,
    importedLandedVsFob: 0.0825,
    localPrice: 8.52,
    diff: -0.14,
    validFrom: '2026-10-01',
    validTo: OPEN_ENDED_DATE,
    costPerPoint: -0.0004,
  }),
  row({
    partNumber: '1108-002020',
    description: 'TA20-US',
    spec: 'USB-C 20W',
    ppbItem: 'adapter',
    importedFob: 3,
    importedFreight: 0.03,
    importedCif: 3.03,
    importedIi: 0.22,
    importedLandedPrice: 3.25,
    importedLandedVsFob: 0.0833,
    localPrice: 3.09,
    diff: -0.16,
    validFrom: '2026-10-01',
    validTo: OPEN_ENDED_DATE,
    costPerPoint: -0.0007,
  }),
  row({
    partNumber: '1108-003500',
    description: 'GH82',
    spec: 'PBA assembled board',
    ppbItem: 'pba',
    importedFob: 50,
    importedFreight: 0.5,
    importedCif: 50.5,
    importedIi: 3.64,
    importedLandedPrice: 54.14,
    importedLandedVsFob: 0.0828,
    localPrice: 54,
    diff: -0.14,
    validFrom: '2026-10-01',
    validTo: OPEN_ENDED_DATE,
    costPerPoint: -0.0003,
  }),
  row({
    partNumber: '1108-003620',
    description: 'GH82-MB',
    spec: '6-layer main board',
    ppbItem: 'mainBoard',
    importedFob: 30,
    importedFreight: 0.3,
    importedCif: 30.3,
    importedIi: 2.18,
    importedLandedPrice: 32.48,
    importedLandedVsFob: 0.0827,
    localPrice: 32.7,
    diff: 0.22,
    validFrom: '2026-10-01',
    validTo: OPEN_ENDED_DATE,
    costPerPoint: 0.0005,
  }),
  row({
    partNumber: '1108-004100',
    description: 'Final inspection',
    spec: 'Assembly line process',
    ppbItem: 'inspProcess',
    importedFob: 1.8,
    importedFreight: 0.02,
    importedCif: 1.82,
    importedIi: 0.13,
    importedLandedPrice: 1.95,
    importedLandedVsFob: 0.0833,
    localPrice: 1.85,
    diff: -0.1,
    validFrom: '2026-10-01',
    validTo: OPEN_ENDED_DATE,
    costPerPoint: -0.0002,
  }),
  row({
    partNumber: '1108-005010',
    description: 'RFID tag',
    spec: 'UHF 860-960 MHz',
    ppbItem: 'rfid',
    importedFob: 0.42,
    importedFreight: 0.01,
    importedCif: 0.43,
    importedIi: 0.03,
    importedLandedPrice: 0.46,
    importedLandedVsFob: 0.0952,
    localPrice: 0.43,
    diff: -0.03,
    validFrom: '2026-10-01',
    validTo: OPEN_ENDED_DATE,
    costPerPoint: -0.0001,
  }),
]

const normaliseHeader = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\//g, ' ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')

const HEADER_ALIASES: Record<string, string> = {
  part: 'part_number',
  partnumber: 'part_number',
  pn: 'part_number',
  item: 'ppb_item',
  ppb: 'ppb_item',
  landed: 'landed_price',
  landed_vs_fob_percent: 'landed_vs_fob',
  landed_vs_fob_pct: 'landed_vs_fob',
  local: 'local_price',
  cost_point: 'cost_per_point',
  cost_per_pp: 'cost_per_point',
}

const FIELD_KEYS = [
  'part_number',
  'description',
  'spec',
  'ppb_item',
  'fob',
  'freight',
  'cif',
  'ii',
  'landed_price',
  'landed_vs_fob',
  'local_price',
  'diff',
  'valid_from',
  'valid_to',
  'cost_per_point',
] as const

const text = (value: unknown) => String(value ?? '').trim()
const numberValue = (value: unknown) => {
  const raw = text(value).replace(/[\s$%]/g, '')
  if (!raw) return null
  const normalised = raw.includes(',') && raw.includes('.')
    ? raw.lastIndexOf(',') > raw.lastIndexOf('.')
      ? raw.replace(/\./g, '').replace(',', '.')
      : raw.replace(/,/g, '')
    : raw.replace(',', '.')
  const result = Number(normalised)
  return Number.isFinite(result) ? result : null
}

const isoDate = (value: unknown) => {
  const match = text(value).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text(value)) return null
  return text(value)
}

const parseItem = (value: string): ItemKey | null | 'invalid' => {
  if (!value) return null
  const key = value.toLowerCase().replace(/[^a-z0-9]/g, '')
  const item = ITEMS.find((candidate) => candidate.key.toLowerCase().replace(/[^a-z0-9]/g, '') === key || candidate.name.toLowerCase().replace(/[^a-z0-9]/g, '') === key)
  return item?.key ?? 'invalid'
}

const currentFor = (rows: readonly MaterialPrice[], partNumber: string) =>
  rows
    .filter((candidate) => candidate.partNumber === partNumber && candidate.validTo === OPEN_ENDED_DATE)
    .sort((a, b) => b.validFrom.localeCompare(a.validFrom))[0]

const comparable = (a: MaterialPrice, b: MaterialPrice) =>
  a.partNumber === b.partNumber &&
  a.description === b.description &&
  a.spec === b.spec &&
  a.ppbItem === b.ppbItem &&
  a.importedFob === b.importedFob &&
  a.importedFreight === b.importedFreight &&
  a.importedCif === b.importedCif &&
  a.importedIi === b.importedIi &&
  a.importedLandedPrice === b.importedLandedPrice &&
  a.importedLandedVsFob === b.importedLandedVsFob &&
  a.localPrice === b.localPrice &&
  a.diff === b.diff &&
  a.validFrom === b.validFrom &&
  a.costPerPoint === b.costPerPoint

export function parseMaterialPrices(input: string, currentRows: readonly MaterialPrice[]): PriceImportPreview {
  const lines = input.split(/\r?\n/).map((line) => line.trimEnd()).filter((line) => line.trim())
  if (lines.length === 0) return { rows: [], errors: [], hasInput: false }

  const headers = lines[0].split('\t').map((value) => HEADER_ALIASES[normaliseHeader(value)] ?? normaliseHeader(value))
  const errors: string[] = []
  const rows: PriceImportRow[] = []
  const seen = new Set<string>()
  const missing = FIELD_KEYS.filter((key) => !headers.includes(key))
  if (missing.length > 0) {
    return {
      rows,
      errors: [`Header must include: ${PRICE_IMPORT_HEADERS.join(' | ')}`],
      hasInput: true,
    }
  }

  const valueAt = (cells: string[], key: string) => cells[headers.indexOf(key)] ?? ''

  lines.slice(1).forEach((line, index) => {
    const lineNumber = index + 2
    const cells = line.split('\t').map((value) => value.trim())
    const rowErrors: string[] = []
    const partNumber = valueAt(cells, 'part_number').toUpperCase()
    const description = valueAt(cells, 'description')
    const spec = valueAt(cells, 'spec')
    const itemRaw = valueAt(cells, 'ppb_item')
    const ppbItem = parseItem(itemRaw)
    const validFrom = isoDate(valueAt(cells, 'valid_from'))
    const validTo = isoDate(valueAt(cells, 'valid_to'))
    const numeric = Object.fromEntries(
      (['fob', 'freight', 'cif', 'ii', 'landed_price', 'landed_vs_fob', 'local_price', 'diff', 'cost_per_point'] as const).map((key) => {
        const raw = valueAt(cells, key)
        const parsed = numberValue(raw)
        return [key, parsed == null ? null : key === 'landed_vs_fob' && text(raw).includes('%') ? parsed / 100 : parsed]
      }),
    ) as Record<'fob' | 'freight' | 'cif' | 'ii' | 'landed_price' | 'landed_vs_fob' | 'local_price' | 'diff' | 'cost_per_point', number | null>

    if (cells.length !== FIELD_KEYS.length) rowErrors.push(`expected ${FIELD_KEYS.length} columns`)
    if (!partNumber) rowErrors.push('Part Number is required')
    if (!description) rowErrors.push('Description is required')
    if (!spec) rowErrors.push('Spec is required')
    if (ppbItem === 'invalid') rowErrors.push(`PPB Item "${itemRaw}" is not a known item`)
    if (!validFrom) rowErrors.push('Valid From must be YYYY-MM-DD')
    if (!validTo) rowErrors.push('Valid To must be YYYY-MM-DD')
    if (validFrom && validTo && validTo < validFrom) rowErrors.push('Valid To must be on or after Valid From')
    for (const key of Object.keys(numeric)) {
      if (numeric[key as keyof typeof numeric] == null) rowErrors.push(`${key} must be a number`)
    }
    if (seen.has(partNumber)) rowErrors.push('Part Number is duplicated in the pasted data')
    if (partNumber) seen.add(partNumber)

    const current = currentFor(currentRows, partNumber)
    if (current && validFrom && validFrom < current.validFrom) {
      rowErrors.push(`Valid From must be on or after the current version (${current.validFrom})`)
    }

    if (rowErrors.length > 0 || !validFrom || !validTo || ppbItem === 'invalid' || Object.values(numeric).some((value) => value == null)) {
      errors.push(`Line ${lineNumber}: ${rowErrors.join(', ')}`)
      return
    }

    const parsed: MaterialPrice = {
      id: rowId(partNumber, validFrom),
      partNumber,
      description,
      spec,
      ppbItem,
      importedFob: numeric.fob!,
      importedFreight: numeric.freight!,
      importedCif: numeric.cif!,
      importedIi: numeric.ii!,
      importedLandedPrice: numeric.landed_price!,
      importedLandedVsFob: numeric.landed_vs_fob!,
      localPrice: numeric.local_price!,
      diff: numeric.diff!,
      validFrom,
      validTo,
      costPerPoint: numeric.cost_per_point!,
    }
    const status: PriceImportStatus = !current ? 'new' : comparable(current, parsed) ? 'same' : 'replace'
    rows.push({ line: lineNumber, ...parsed, status, previous: current })
  })

  if (rows.length === 0 && errors.length === 0) errors.push('No price rows found below the header.')
  return { rows, errors, hasInput: true }
}

const dayBefore = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

export function applyMaterialPriceImport(currentRows: readonly MaterialPrice[], importedRows: readonly PriceImportRow[]) {
  const next = [...currentRows]
  for (const imported of importedRows) {
    if (imported.status === 'same') continue
    const currentIndex = next.findIndex((candidate) => candidate.id === imported.previous?.id)
    const nextRow: MaterialPrice = { ...imported, id: rowId(imported.partNumber, imported.validFrom), validTo: OPEN_ENDED_DATE }
    if (currentIndex < 0) {
      next.push(nextRow)
      continue
    }
    const previous = next[currentIndex]
    if (previous.validFrom === imported.validFrom) {
      next[currentIndex] = { ...nextRow, id: previous.id }
    } else {
      next[currentIndex] = { ...previous, validTo: dayBefore(imported.validFrom) }
      next.push(nextRow)
    }
  }
  return next.sort((a, b) => a.partNumber.localeCompare(b.partNumber) || b.validFrom.localeCompare(a.validFrom))
}

export const ppbItemLabel = (key: ItemKey | null) => (key ? ITEMS.find((item) => item.key === key)?.name ?? key : 'Unclassified')
