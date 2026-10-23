import { ITEM_BY_KEY } from '@/lib/ppb-model'
import {
  TEMPLATE_HEADERS,
  TODAY,
  parseRows,
  type PriceBook,
  type UploadPreview,
} from '@/lib/material-store'

/** Both libraries are loaded on demand so they never reach the server bundle. */
export async function downloadTemplate(book: PriceBook) {
  const { default: writeExcelFile } = await import('write-excel-file/browser')

  const header = TEMPLATE_HEADERS.map((value) => ({ value, fontWeight: 'bold' as const }))
  const body = [...book.entries]
    .sort((a, b) => a.code.localeCompare(b.code) || a.vendor.localeCompare(b.vendor))
    .map((e) => {
      const item = book.materials[e.code]?.item
      return [
        e.code,
        e.vendor,
        { value: e.price, type: Number, format: '0.00##' },
        e.origin,
        e.updatedAt,
        item ? ITEM_BY_KEY[item].name : '',
      ]
    })

  await writeExcelFile([header, ...body], {
    columns: [{ width: 18 }, { width: 26 }, { width: 20 }, { width: 10 }, { width: 18 }, { width: 16 }],
  }).toFile(`ppb-material-prices-${TODAY}.xlsx`)
}

export async function readPriceFile(file: File, book: PriceBook): Promise<UploadPreview> {
  const { readSheet } = await import('read-excel-file/browser')
  const raw = (await readSheet(file)) as unknown
  const firstIsSheet = Array.isArray(raw) && raw.length > 0 && !Array.isArray(raw[0])
  const rows = firstIsSheet ? (raw as { data: unknown[][] }[])[0].data : (raw as unknown[][])
  return parseRows(rows, book, file.name)
}
