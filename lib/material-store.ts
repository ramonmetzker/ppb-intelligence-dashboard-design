import { ITEMS, type ItemKey } from '@/lib/ppb-model'
import { PRICE_FEED } from '@/lib/material-prices'

export type Origin = 'import' | 'local'

/** The app's working date. Uploads without a date and inline edits are stamped with it. */
export const TODAY = PRICE_FEED.asOf

export type PriceVersion = { price: number; origin: Origin; updatedAt: string }

export type PriceEntry = PriceVersion & {
  id: string
  code: string
  vendor: string
  /** Earlier versions, newest first. The current version is not repeated here. */
  history: PriceVersion[]
}

export type Material = { code: string; description: string; item: ItemKey | null }

export type PriceBook = {
  materials: Record<string, Material>
  entries: PriceEntry[]
}

export const entryId = (code: string, vendor: string) =>
  `${code.trim().toUpperCase()}|${vendor.trim().toLowerCase()}`

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${MONTH_SHORT[m - 1]} ${d}, ${y}`
}

export const fmtPrice = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`

export const fmtPct = (ratio: number) =>
  `${ratio > 0 ? '+' : ''}${(ratio * 100).toFixed(1)}%`

/* -------------------------------------------------------------------------- */
/* Sample data                                                                 */
/* -------------------------------------------------------------------------- */

type SeedVendor = [
  vendor: string,
  origin: Origin,
  price: number,
  updatedAt: string,
  history?: [price: number, updatedAt: string][],
]

const SEED: { code: string; description: string; item: ItemKey | null; vendors: SeedVendor[] }[] = [
  {
    code: 'MEM-GH82-16G',
    description: 'LPDDR5 memory module, 16 GB',
    item: 'memory',
    vendors: [
      ['Hynix Korea', 'import', 20.0, '2026-10-28', [[19.6, '2026-09-30'], [19.2, '2026-08-29']]],
      ['Samsung Semiconductor', 'import', 20.35, '2026-10-21', [[20.1, '2026-09-18']]],
      ['Memtech Manaus', 'local', 21.4, '2026-11-03', [[21.0, '2026-10-06'], [20.8, '2026-09-04']]],
    ],
  },
  {
    code: 'MEM-GH96-08G',
    description: 'LPDDR4X memory module, 8 GB',
    item: 'memory',
    vendors: [
      ['Hynix Korea', 'import', 12.1, '2026-10-28', [[12.3, '2026-09-30']]],
      ['Micron Asia', 'import', 12.4, '2026-10-12'],
      ['Memtech Manaus', 'local', 13.05, '2026-11-03', [[12.85, '2026-10-06']]],
    ],
  },
  {
    code: 'BAT-EB938-CELL',
    description: 'Li-ion cell, EB-BS938',
    item: 'battery',
    vendors: [
      ['ATL Shenzhen', 'import', 8.0, '2026-10-30', [[8.05, '2026-10-01'], [8.2, '2026-09-02']]],
      ['Sunwoda', 'import', 8.12, '2026-10-24'],
      ['Moura Baterias', 'local', 8.52, '2026-11-04', [[8.6, '2026-10-07']]],
    ],
  },
  {
    code: 'BAT-FPC-02',
    description: 'Battery flex connector',
    item: 'battery',
    vendors: [
      ['Yuhui Electronics', 'import', 0.74, '2026-10-19'],
      ['Flexcom Brasil', 'local', 0.82, '2026-11-02', [[0.79, '2026-09-28']]],
    ],
  },
  {
    code: 'ADP-TA20-US',
    description: 'Wall charger, 20 W',
    item: 'adapter',
    vendors: [
      ['Flex Shenzhen', 'import', 3.0, '2026-10-27', [[3.04, '2026-09-29']]],
      ['Anker OEM', 'import', 3.05, '2026-10-15'],
      ['Salcomp Manaus', 'local', 3.09, '2026-11-03', [[3.12, '2026-10-05']]],
    ],
  },
  {
    code: 'ADP-CBL-USBC',
    description: 'USB-C cable, 1 m',
    item: 'adapter',
    vendors: [
      ['Lintes Technology', 'import', 0.88, '2026-10-22'],
      ['Cabos do Sul', 'local', 0.96, '2026-11-01'],
    ],
  },
  {
    code: 'PBA-GH82-ASM',
    description: 'Populated board assembly, GH82',
    item: 'pba',
    vendors: [
      ['SMT Vietnam', 'import', 50.0, '2026-10-29', [[50.4, '2026-09-30'], [51.0, '2026-08-31']]],
      ['Jabil Campinas', 'local', 54.0, '2026-11-04', [[53.6, '2026-10-06']]],
    ],
  },
  {
    code: 'PBA-GH96-ASM',
    description: 'Populated board assembly, GH96',
    item: 'pba',
    vendors: [
      ['SMT Vietnam', 'import', 44.1, '2026-10-29'],
      ['Flex Sorocaba', 'local', 47.2, '2026-11-02', [[46.9, '2026-10-02']]],
    ],
  },
  {
    code: 'MB-GH82-MB',
    description: 'Main board, GH82-MB',
    item: 'mainBoard',
    vendors: [
      ['Shenzhen Boards', 'import', 30.0, '2026-10-26', [[30.2, '2026-09-27']]],
      ['Hon Hai Precision', 'import', 30.4, '2026-10-13'],
      ['Local SMT Manaus', 'local', 32.7, '2026-11-05', [[32.9, '2026-10-08'], [33.4, '2026-09-08']]],
    ],
  },
  {
    code: 'MB-PCB-6L',
    description: '6-layer PCB panel',
    item: 'mainBoard',
    vendors: [
      ['TTM Technologies', 'import', 6.15, '2026-10-20'],
      ['Plasma PCB', 'local', 6.8, '2026-11-01', [[6.7, '2026-10-01']]],
    ],
  },
  {
    code: 'HW-SCR-M2X3',
    description: 'Screw M2 x 3 mm',
    item: null,
    vendors: [['Parafusos BR', 'local', 0.012, '2026-10-30']],
  },
]

export function seedBook(): PriceBook {
  const materials: Record<string, Material> = {}
  const entries: PriceEntry[] = []
  for (const m of SEED) {
    materials[m.code] = { code: m.code, description: m.description, item: m.item }
    for (const [vendor, origin, price, updatedAt, history = []] of m.vendors) {
      entries.push({
        id: entryId(m.code, vendor),
        code: m.code,
        vendor,
        origin,
        price,
        updatedAt,
        history: history.map(([p, d]) => ({ price: p, origin, updatedAt: d })),
      })
    }
  }
  return { materials, entries }
}

/* -------------------------------------------------------------------------- */
/* Upload parsing                                                              */
/* -------------------------------------------------------------------------- */

export const TEMPLATE_HEADERS = [
  'material_code',
  'vendor',
  'current_price_usd',
  'origin',
  'last_update_date',
  'ppb_item',
] as const

export type PreviewStatus = 'new' | 'update' | 'same' | 'stale'

export type PreviewRow = {
  line: number
  code: string
  vendor: string
  price: number
  origin: Origin
  updatedAt: string
  item: ItemKey | null
  status: PreviewStatus
  previous?: PriceVersion
}

export type UploadPreview = {
  fileName: string
  rows: PreviewRow[]
  errors: { line: number; message: string }[]
  fatal?: string
}

const REQUIRED = ['material_code', 'vendor', 'current_price_usd', 'origin'] as const

const ALIASES: Record<string, string> = {
  code: 'material_code',
  material: 'material_code',
  supplier: 'vendor',
  price: 'current_price_usd',
  current_price: 'current_price_usd',
  price_usd: 'current_price_usd',
  last_update: 'last_update_date',
  updated_at: 'last_update_date',
  date: 'last_update_date',
  ppb: 'ppb_item',
  classification: 'ppb_item',
  ppb_classification: 'ppb_item',
}

const normHeader = (h: unknown) =>
  String(h ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')

const text = (cell: unknown) => (cell == null ? '' : String(cell).trim())

const alnum = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

function parseItem(raw: string): ItemKey | null | 'invalid' {
  if (!raw) return null
  const key = alnum(raw)
  for (const item of ITEMS) {
    if (alnum(item.key) === key || alnum(item.name) === key) return item.key
  }
  if (key === 'pba') return 'pba'
  return 'invalid'
}

function parseOrigin(raw: string): Origin | null {
  const key = alnum(raw)
  if (key === 'import' || key === 'imported') return 'import'
  if (key === 'local') return 'local'
  return null
}

function parsePrice(cell: unknown): number | null {
  if (typeof cell === 'number') return Number.isFinite(cell) && cell > 0 ? cell : null
  const cleaned = text(cell).replace(/[$\s]/g, '')
  if (!/^\d+([.,]\d+)?$/.test(cleaned)) return null
  const value = Number(cleaned.replace(',', '.'))
  return value > 0 ? value : null
}

const pad = (n: number) => String(n).padStart(2, '0')

function validIso(y: number, m: number, d: number) {
  if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null
  return `${y}-${pad(m)}-${pad(d)}`
}

function parseDate(cell: unknown): string | null {
  if (cell == null || text(cell) === '') return TODAY
  if (cell instanceof Date && !Number.isNaN(cell.getTime())) {
    return validIso(cell.getUTCFullYear(), cell.getUTCMonth() + 1, cell.getUTCDate())
  }
  const s = text(cell)
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (iso) return validIso(Number(iso[1]), Number(iso[2]), Number(iso[3]))
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (us) return validIso(Number(us[3]), Number(us[1]), Number(us[2]))
  return null
}

export function parseRows(rows: unknown[][], book: PriceBook, fileName: string): UploadPreview {
  const empty: UploadPreview = { fileName, rows: [], errors: [] }
  if (!rows.length) return { ...empty, fatal: 'The file is empty.' }

  const header = rows[0].map((h) => {
    const n = normHeader(h)
    return ALIASES[n] ?? n
  })
  const missing = REQUIRED.filter((name) => header.indexOf(name) < 0)
  if (missing.length) {
    return {
      ...empty,
      fatal: `Missing column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}. Download the template and keep its header row.`,
    }
  }
  const at = (row: unknown[], name: string) => row[header.indexOf(name)]

  const preview: UploadPreview = { fileName, rows: [], errors: [] }
  const seen = new Map<string, number>()

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.every((c) => text(c) === '')) continue
    const line = i + 1
    const problems: string[] = []

    const code = text(at(row, 'material_code')).toUpperCase()
    const vendor = text(at(row, 'vendor'))
    if (!code) problems.push('material_code is empty')
    if (!vendor) problems.push('vendor is empty')

    const price = parsePrice(at(row, 'current_price_usd'))
    if (price == null) problems.push('current_price_usd must be a number above 0')

    const origin = parseOrigin(text(at(row, 'origin')))
    if (!origin) problems.push('origin must be import or local')

    const updatedAt = parseDate(at(row, 'last_update_date'))
    if (!updatedAt) problems.push('last_update_date must look like 2026-11-06')

    const itemRaw = header.includes('ppb_item') ? text(at(row, 'ppb_item')) : ''
    const parsedItem = parseItem(itemRaw)
    if (parsedItem === 'invalid') problems.push(`ppb_item "${itemRaw}" is not a PPB item`)

    const id = entryId(code, vendor)
    if (code && vendor) {
      const first = seen.get(id)
      if (first) problems.push(`repeats line ${first} (same material and vendor)`)
      else seen.set(id, line)
    }

    if (problems.length || price == null || !origin || !updatedAt || parsedItem === 'invalid') {
      preview.errors.push({ line, message: problems.join('; ') })
      continue
    }

    const existing = book.entries.find((e) => e.id === id)
    const item = parsedItem ?? book.materials[code]?.item ?? null
    let status: PreviewStatus = 'new'
    if (existing) {
      if (updatedAt < existing.updatedAt) status = 'stale'
      else if (Math.abs(existing.price - price) < 1e-9 && existing.origin === origin) status = 'same'
      else status = 'update'
    }

    preview.rows.push({
      line,
      code,
      vendor,
      price,
      origin,
      updatedAt,
      item,
      status,
      previous: existing && { price: existing.price, origin: existing.origin, updatedAt: existing.updatedAt },
    })
  }

  if (!preview.rows.length && !preview.errors.length) {
    preview.fatal = 'No price rows found below the header.'
  }
  return preview
}

/* -------------------------------------------------------------------------- */
/* Mutations                                                                   */
/* -------------------------------------------------------------------------- */

export function applyPreview(book: PriceBook, preview: UploadPreview): PriceBook {
  const materials = { ...book.materials }
  let entries = [...book.entries]

  for (const row of preview.rows) {
    if (row.status === 'same' || row.status === 'stale') continue

    const material = materials[row.code]
    if (!material) {
      materials[row.code] = { code: row.code, description: '', item: row.item }
    } else if (!material.item && row.item) {
      materials[row.code] = { ...material, item: row.item }
    }

    const id = entryId(row.code, row.vendor)
    const index = entries.findIndex((e) => e.id === id)
    if (index < 0) {
      entries.push({
        id,
        code: row.code,
        vendor: row.vendor,
        price: row.price,
        origin: row.origin,
        updatedAt: row.updatedAt,
        history: [],
      })
    } else {
      const old = entries[index]
      entries[index] = {
        ...old,
        price: row.price,
        origin: row.origin,
        updatedAt: row.updatedAt,
        history: [{ price: old.price, origin: old.origin, updatedAt: old.updatedAt }, ...old.history],
      }
    }
  }
  entries = entries.sort((a, b) => a.code.localeCompare(b.code) || a.vendor.localeCompare(b.vendor))
  return { materials, entries }
}

export function editEntry(book: PriceBook, id: string, price: number, origin: Origin): PriceBook {
  return {
    ...book,
    entries: book.entries.map((e) => {
      if (e.id !== id) return e
      if (Math.abs(e.price - price) < 1e-9 && e.origin === origin) return e
      return {
        ...e,
        price,
        origin,
        updatedAt: TODAY,
        history: [{ price: e.price, origin: e.origin, updatedAt: e.updatedAt }, ...e.history],
      }
    }),
  }
}

export function classifyMaterial(book: PriceBook, code: string, item: ItemKey | null): PriceBook {
  const material = book.materials[code]
  if (!material) return book
  return { ...book, materials: { ...book.materials, [code]: { ...material, item } } }
}
