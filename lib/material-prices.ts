import type { ItemKey } from '@/lib/ppb-model'

/** Sample quotes. The live supplier price feed replaces QUOTES and nothing else has to change. */
export const PRICE_FEED = {
  live: false,
  asOf: '2026-11-06',
  note: 'Sample prices. The live supplier feed connects here.',
} as const

type Quote = { local: number; imported: number }

type ItemPrices = {
  unit: string
  /** Quotes for Nov and Dec, in dollars per unit. */
  months: [Quote, Quote]
  /** Local premium over import that the model's spend per point was calibrated on. */
  reference: number
}

export const QUOTES: Record<ItemKey, ItemPrices> = {
  memory: {
    unit: 'module',
    months: [
      { local: 21.4, imported: 20.0 },
      { local: 22.4, imported: 20.0 },
    ],
    reference: 0.095,
  },
  battery: {
    unit: 'cell',
    months: [
      { local: 8.52, imported: 8.0 },
      { local: 8.32, imported: 8.0 },
    ],
    reference: 0.055,
  },
  adapter: {
    unit: 'unit',
    months: [
      { local: 3.09, imported: 3.0 },
      { local: 3.1, imported: 3.0 },
    ],
    reference: 0.032,
  },
  pba: {
    unit: 'assembly',
    months: [
      { local: 54.0, imported: 50.0 },
      { local: 53.5, imported: 50.0 },
    ],
    reference: 0.075,
  },
  mainBoard: {
    unit: 'board',
    months: [
      { local: 32.7, imported: 30.0 },
      { local: 33.15, imported: 30.0 },
    ],
    reference: 0.098,
  },
  inspProcess: {
    unit: 'process',
    months: [
      { local: 1.8, imported: 1.6 },
      { local: 1.85, imported: 1.6 },
    ],
    reference: 0.125,
  },
  rfid: {
    unit: 'tag',
    months: [
      { local: 0.42, imported: 0.38 },
      { local: 0.43, imported: 0.38 },
    ],
    reference: 0.105,
  },
}

/** How much more local costs than import, as a ratio. */
export const premium = (key: ItemKey, open: 0 | 1) => {
  const q = QUOTES[key].months[open]
  return q.local / q.imported - 1
}

/** Multiplier on the model's spend per point: above 1 means local is pricier than usual this month. */
export const priceIndex = (key: ItemKey, open: 0 | 1) => premium(key, open) / QUOTES[key].reference
