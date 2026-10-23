export const REQUIRED_SCORE = 662

export const status = {
  current: 573.74,
  forecast: 641.2,
  optimized: 668.3,
  required: REQUIRED_SCORE,
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

const actual = [
  430.2, 455.9, 478.4, 497.8, 514.6, 529.3, 543.1, 555.7, 565.1, 573.74,
]
const forecastTail = [603.4, 641.2]
const optimizedTail = [632.6, 668.3]

export type TrajectoryPoint = {
  month: string
  actual?: number
  forecast?: number
  optimized?: number
}

export const trajectory: TrajectoryPoint[] = MONTHS.map((month, i) => {
  if (i < 9) return { month, actual: actual[i] }
  if (i === 9) {
    return { month, actual: actual[i], forecast: actual[i], optimized: actual[i] }
  }
  return {
    month,
    forecast: forecastTail[i - 10],
    optimized: optimizedTail[i - 10],
  }
})

export const riskDrivers = [
  {
    rank: '01',
    driver: 'Memory localization',
    reason: 'Local share of GH82 volume below plan since Q2',
    impact: -14.3,
  },
  {
    rank: '02',
    driver: 'Imported battery volume',
    reason: 'Higher import mix on EB-BS938 cells',
    impact: -4.1,
  },
  {
    rank: '03',
    driver: 'November production mix',
    reason: 'SM-S938 ramp shifts volume to import-heavy BOMs',
    impact: -2.8,
  },
  {
    rank: '04',
    driver: 'New model BOM uncertainty',
    reason: '3 models still without validated BOM mapping',
    impact: -1.7,
  },
  {
    rank: '05',
    driver: 'Supplier availability',
    reason: 'Two local suppliers capped at current allocation',
    impact: -0.9,
  },
]

export const sinceLastForecast = [
  {
    label: 'Memory local share',
    value: '34% → 29%',
    direction: 'down' as const,
    note: 'Adverse',
  },
  {
    label: 'Model SM-S938 production',
    value: '+18%',
    direction: 'up' as const,
    note: 'Volume',
  },
  {
    label: 'Imported battery volume',
    value: '+12%',
    direction: 'up' as const,
    note: 'Adverse',
  },
  {
    label: 'Material price variance',
    value: '+2.4%',
    direction: 'up' as const,
    note: 'Cost',
  },
]

export type Risk = 'High' | 'Medium' | 'Low'

export const categories: {
  name: string
  current: number
  max: number
  forecast: number
  optimized: number
  risk: Risk
}[] = [
  {
    name: 'Memory',
    current: 41.55,
    max: 450,
    forecast: 178.4,
    optimized: 312.7,
    risk: 'High',
  },
  {
    name: 'Battery',
    current: 142.3,
    max: 220,
    forecast: 168.2,
    optimized: 181.6,
    risk: 'Medium',
  },
  {
    name: 'Adapter',
    current: 71.8,
    max: 100,
    forecast: 79.6,
    optimized: 84.2,
    risk: 'Low',
  },
  {
    name: 'PBA Assembly',
    current: 198.45,
    max: 260,
    forecast: 204.1,
    optimized: 207,
    risk: 'Low',
  },
  {
    name: 'Main Board',
    current: 119.64,
    max: 180,
    forecast: 131.5,
    optimized: 142.8,
    risk: 'Medium',
  },
]

export const costPoints = [
  { name: 'Memory / GH82', gain: 11.4, cost: 420 },
  { name: 'Memory / GH96', gain: 8.2, cost: 360 },
  { name: 'Battery / EB-BS938', gain: 6.7, cost: 270 },
  { name: 'Main Board / GH82-MB', gain: 4.2, cost: 190 },
  { name: 'PBA / SMT line', gain: 3.1, cost: 150 },
  { name: 'Display driver', gain: 2.1, cost: 140 },
  { name: 'Camera module', gain: 1.8, cost: 378 },
  { name: 'Adapter / EP-TA800', gain: 1.4, cost: 52 },
  { name: 'Antenna set', gain: 1.1, cost: 66 },
  { name: 'Charger cable', gain: 0.9, cost: 35 },
  { name: 'Speaker module', gain: 0.8, cost: 41 },
  { name: 'Packaging', gain: 0.6, cost: 28 },
]

export const closingSteps = [
  { label: 'Production actual', state: 'Complete' },
  { label: 'MB51 consumption', state: 'Complete' },
  { label: 'BOM snapshot', state: 'Complete' },
  { label: 'Material prices', state: 'Complete' },
  { label: 'Supplier origin', state: 'Complete' },
  { label: 'PPB classification', state: 'Warning' },
  { label: 'Calculation', state: 'Pending' },
] as const

export const attention = [
  {
    icon: 'bom' as const,
    text: '3 new models need BOM mapping',
    count: 3,
    severity: 'High' as Risk,
  },
  {
    icon: 'origin' as const,
    text: '12 materials missing supplier origin',
    count: 12,
    severity: 'Medium' as Risk,
  },
  {
    icon: 'price' as const,
    text: '4 materials missing updated price',
    count: 4,
    severity: 'Low' as Risk,
  },
]
