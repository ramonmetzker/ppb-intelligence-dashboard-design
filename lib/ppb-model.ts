export const REQUIRED_SCORE = 662
export const CURRENT_SCORE = 573.74
export const BASE_FORECAST = 641.2
export const BASE_CONFIDENCE = 87

export const MONTHS = [
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
export type Month = (typeof MONTHS)[number]
export const LAST_ACTUAL = 9

/* -------------------------------------------------------------------------- */
/* PPB items                                                                   */
/* -------------------------------------------------------------------------- */

export type ItemKey = 'memory' | 'battery' | 'adapter' | 'pba' | 'mainBoard'

export const ITEMS: {
  key: ItemKey
  name: string
  current: number
  forecast: number
  color: string
}[] = [
  { key: 'memory', name: 'Memory', current: 41.55, forecast: 60.95, color: '#14308f' },
  { key: 'battery', name: 'Battery', current: 142.3, forecast: 156.5, color: '#2457e6' },
  { key: 'adapter', name: 'Adapter', current: 71.8, forecast: 76.7, color: '#5b8bff' },
  { key: 'pba', name: 'PBA Assembly', current: 198.45, forecast: 213.05, color: '#9dbcff' },
  { key: 'mainBoard', name: 'Main Board', current: 119.64, forecast: 134.0, color: '#cfdcff' },
]

/* -------------------------------------------------------------------------- */
/* Levers: the physical changes a scenario makes                               */
/* -------------------------------------------------------------------------- */

export type LeverKey = 'memory' | 'battery' | 'mainBoard' | 'mix'
export type Levers = Record<LeverKey, number>

export type LeverDef = {
  key: LeverKey
  label: string
  detail: string
  owner: string
  /** Baseline absolute value shown to the user (a share, in %). */
  base: number
  /** Slider range, expressed as a delta from the baseline. */
  min: number
  max: number
  step: number
  ptsPerUnit: number
  costPerUnit: number
  /** How the lever's points are distributed across PPB items. */
  split: Partial<Record<ItemKey, number>>
}

export const LEVERS: LeverDef[] = [
  {
    key: 'memory',
    label: 'Memory local share',
    detail: 'GH82 and GH96 modules sourced from local suppliers',
    owner: 'Sourcing',
    base: 29,
    min: -8,
    max: 14,
    step: 0.1,
    ptsPerUnit: 1.9,
    costPerUnit: 70,
    split: { memory: 1 },
  },
  {
    key: 'battery',
    label: 'Battery local share',
    detail: 'EB-BS938 cells moved from import to local supply',
    owner: 'Sourcing',
    base: 38,
    min: -8,
    max: 14,
    step: 0.1,
    ptsPerUnit: 1.1167,
    costPerUnit: 45,
    split: { battery: 1 },
  },
  {
    key: 'mainBoard',
    label: 'Main Board local share',
    detail: 'GH82-MB boards built on local SMT lines',
    owner: 'Manufacturing',
    base: 52,
    min: -6,
    max: 10,
    step: 0.1,
    ptsPerUnit: 1.05,
    costPerUnit: 47.5,
    split: { mainBoard: 1 },
  },
  {
    key: 'mix',
    label: 'SM-S938 volume reallocated',
    detail: 'Import-heavy volume moved to local-BOM lines in Nov to Dec',
    owner: 'Planning',
    base: 0,
    min: 0,
    max: 70,
    step: 1,
    ptsPerUnit: 0.12,
    costPerUnit: 3.75,
    split: { memory: 0.3125, battery: 0.25, pba: 0.25, mainBoard: 0.1875 },
  },
]

export const ZERO_LEVERS: Levers = { memory: 0, battery: 0, mainBoard: 0, mix: 0 }

/** Share of a lever's effect that has landed by each forecast month. */
const REALISATION: Record<'Nov' | 'Dec', number> = { Nov: 0.55, Dec: 1 }

/* -------------------------------------------------------------------------- */
/* Scenarios proposed by the model                                             */
/* -------------------------------------------------------------------------- */

export type Scenario = {
  id: string
  name: string
  tag: string
  blurb: string
  levers: Levers
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'baseline',
    name: 'Baseline forecast',
    tag: 'Baseline',
    blurb: 'No intervention. The year closes on the current trend.',
    levers: ZERO_LEVERS,
  },
  {
    id: 'balanced',
    name: 'Balanced optimization',
    tag: 'Recommended',
    blurb: 'Four coordinated levers with clear headroom over the target.',
    levers: { memory: 6, battery: 6, mainBoard: 4, mix: 40 },
  },
  {
    id: 'lowest-cost',
    name: 'Lowest-cost compliance',
    tag: 'Lowest cost',
    blurb: 'Cheapest combination that still clears 662.',
    levers: { memory: 7.2, battery: 0, mainBoard: 0, mix: 60 },
  },
  {
    id: 'memory-sprint',
    name: 'Memory localization sprint',
    tag: 'Single lever',
    blurb: 'Only GH82 and GH96 sourcing changes. Simplest to execute.',
    levers: { memory: 11, battery: 0, mainBoard: 0, mix: 0 },
  },
  {
    id: 'max-headroom',
    name: 'Maximum headroom',
    tag: 'Aggressive',
    blurb: 'Every lever pushed hard. Highest score, highest spend and risk.',
    levers: { memory: 10, battery: 10, mainBoard: 6, mix: 70 },
  },
  {
    id: 'mix-only',
    name: 'Volume mix rebalance',
    tag: 'Planning only',
    blurb: 'Reallocate SM-S938 volume without changing any supplier.',
    levers: { memory: 0, battery: 0, mainBoard: 0, mix: 70 },
  },
  {
    id: 'battery-hedge',
    name: 'Battery import hedge',
    tag: 'Partial',
    blurb: 'Localize EB-BS938 cells. Helps, but does not close the gap alone.',
    levers: { memory: 0, battery: 12, mainBoard: 0, mix: 0 },
  },
  {
    id: 'supplier-shock',
    name: 'Supplier disruption',
    tag: 'Stress test',
    blurb: 'Two local suppliers lose capacity and imports fill the gap.',
    levers: { memory: -4, battery: -3, mainBoard: 0, mix: 0 },
  },
]

export function sameLevers(a: Levers, b: Levers) {
  return (Object.keys(a) as LeverKey[]).every(
    (k) => Math.abs(a[k] - b[k]) < 0.001,
  )
}

export function matchScenario(levers: Levers) {
  return SCENARIOS.find((s) => sameLevers(s.levers, levers))
}

/* -------------------------------------------------------------------------- */
/* Risk drivers                                                                */
/* -------------------------------------------------------------------------- */

const DRIVERS: {
  id: string
  name: string
  reason: string
  impact: number
  lever: LeverKey | null
}[] = [
  {
    id: 'memory-localization',
    name: 'Memory localization',
    reason: 'Local share of GH82 volume below plan since Q2',
    impact: -14.3,
    lever: 'memory',
  },
  {
    id: 'battery-import',
    name: 'Imported battery volume',
    reason: 'Higher import mix on EB-BS938 cells',
    impact: -4.1,
    lever: 'battery',
  },
  {
    id: 'nov-mix',
    name: 'November production mix',
    reason: 'SM-S938 ramp shifts volume to import-heavy BOMs',
    impact: -2.8,
    lever: 'mix',
  },
  {
    id: 'bom',
    name: 'New model BOM uncertainty',
    reason: '3 models still without validated BOM mapping',
    impact: -1.7,
    lever: null,
  },
  {
    id: 'supplier',
    name: 'Supplier availability',
    reason: 'Two local suppliers capped at current allocation',
    impact: -0.9,
    lever: null,
  },
]

/* -------------------------------------------------------------------------- */
/* Simulation                                                                  */
/* -------------------------------------------------------------------------- */

export type Status = 'Compliant' | 'At risk' | 'Off track'

export function statusFor(score: number): Status {
  if (score >= REQUIRED_SCORE) return 'Compliant'
  if (score >= REQUIRED_SCORE - 25) return 'At risk'
  return 'Off track'
}

const ACTUAL = [
  430.2, 455.9, 478.4, 497.8, 514.6, 529.3, 543.1, 555.7, 565.1, CURRENT_SCORE,
]
const FORECAST_TAIL = [603.4, BASE_FORECAST]

export type TrajectoryPoint = {
  month: Month
  actual?: number
  forecast?: number
  scenario?: number
}

export type LeverRow = {
  def: LeverDef
  delta: number
  value: number
  pts: number
  cost: number
}

export type WaterfallStep = {
  label: string
  start: number
  end: number
  kind: 'total' | 'up' | 'down'
}

export type ItemRow = {
  key: ItemKey
  name: string
  color: string
  current: number
  forecast: number
  scenario: number
  delta: number
}

export type DriverRow = {
  id: string
  name: string
  reason: string
  baseline: number
  residual: number
}

export type Simulation = {
  levers: Levers
  leverRows: LeverRow[]
  gain: number
  yearEnd: number
  gap: number
  status: Status
  cost: number
  confidence: number
  trajectory: TrajectoryPoint[]
  steps: WaterfallStep[]
  items: ItemRow[]
  drivers: DriverRow[]
}

const round2 = (n: number) => Math.round(n * 100) / 100

export function simulate(levers: Levers): Simulation {
  const leverRows: LeverRow[] = LEVERS.map((def) => {
    const delta = levers[def.key]
    return {
      def,
      delta,
      value: def.base + delta,
      pts: round2(delta * def.ptsPerUnit),
      cost: Math.round(Math.max(0, delta) * def.costPerUnit),
    }
  })

  const gain = round2(leverRows.reduce((s, r) => s + r.pts, 0))
  const yearEnd = round2(BASE_FORECAST + gain)
  const cost = leverRows.reduce((s, r) => s + r.cost, 0)

  const upEffort = leverRows.reduce(
    (s, r) => s + Math.max(0, r.delta) / r.def.max,
    0,
  )
  const downEffort = leverRows.reduce(
    (s, r) => s + Math.max(0, -r.delta) / Math.abs(r.def.min || 1),
    0,
  )
  const confidence = Math.round(
    Math.min(92, Math.max(52, BASE_CONFIDENCE - upEffort * 5.5 - downEffort * 4)),
  )

  const trajectory: TrajectoryPoint[] = MONTHS.map((month, i) => {
    if (i < LAST_ACTUAL) return { month, actual: ACTUAL[i] }
    if (i === LAST_ACTUAL) {
      return {
        month,
        actual: ACTUAL[i],
        forecast: ACTUAL[i],
        scenario: ACTUAL[i],
      }
    }
    const fc = FORECAST_TAIL[i - LAST_ACTUAL - 1]
    const real = month === 'Nov' ? REALISATION.Nov : REALISATION.Dec
    return { month, forecast: fc, scenario: round2(fc + gain * real) }
  })

  const moving = leverRows
    .filter((r) => Math.abs(r.pts) >= 0.005)
    .sort((a, b) => Math.abs(b.pts) - Math.abs(a.pts))
  let running = BASE_FORECAST
  const steps: WaterfallStep[] = [
    { label: 'Forecast', start: 0, end: BASE_FORECAST, kind: 'total' },
    ...moving.map((r): WaterfallStep => {
      const start = running
      running = round2(running + r.pts)
      return {
        label: r.def.label,
        start,
        end: running,
        kind: r.pts >= 0 ? 'up' : 'down',
      }
    }),
    { label: 'Scenario', start: 0, end: yearEnd, kind: 'total' },
  ]

  const items: ItemRow[] = ITEMS.map((item) => {
    const lift = leverRows.reduce(
      (s, r) => s + r.pts * (r.def.split[item.key] ?? 0),
      0,
    )
    return {
      key: item.key,
      name: item.name,
      color: item.color,
      current: item.current,
      forecast: item.forecast,
      scenario: round2(item.forecast + lift),
      delta: round2(lift),
    }
  })

  const drivers: DriverRow[] = DRIVERS.map((d) => {
    const pts = d.lever ? (leverRows.find((r) => r.def.key === d.lever)?.pts ?? 0) : 0
    return {
      id: d.id,
      name: d.name,
      reason: d.reason,
      baseline: d.impact,
      residual: d.lever ? Math.min(0, round2(d.impact + pts)) : d.impact,
    }
  })

  return {
    levers,
    leverRows,
    gain,
    yearEnd,
    gap: round2(yearEnd - REQUIRED_SCORE),
    status: statusFor(yearEnd),
    cost,
    confidence,
    trajectory,
    steps,
    items,
    drivers,
  }
}

export const BASELINE = simulate(ZERO_LEVERS)

/** Plain-language read-out generated from the simulation, not hand-written per scenario. */
export function buildReadout(sim: Simulation) {
  const lines: string[] = []
  const gap = Math.abs(sim.gap).toFixed(2)

  if (sim.gain === 0) {
    const worst = [...sim.drivers].sort((a, b) => a.residual - b.residual)[0]
    lines.push(
      `With no intervention the year closes at ${sim.yearEnd.toFixed(2)}, ${gap} pts short of ${REQUIRED_SCORE}.`,
    )
    lines.push(
      `${worst.name} is the largest drag at ${worst.residual.toFixed(1)} pts. Pick a scenario to see what would close the gap.`,
    )
    return lines
  }

  lines.push(
    sim.gap >= 0
      ? `Closes the year at ${sim.yearEnd.toFixed(2)}, ${gap} pts above the ${REQUIRED_SCORE} requirement.`
      : `Closes the year at ${sim.yearEnd.toFixed(2)}, still ${gap} pts short of ${REQUIRED_SCORE}.`,
  )

  const top = [...sim.leverRows].sort(
    (a, b) => Math.abs(b.pts) - Math.abs(a.pts),
  )[0]
  if (top && Math.abs(top.pts) > 0.005) {
    const share = Math.round((Math.abs(top.pts) / Math.abs(sim.gain)) * 100)
    lines.push(
      `${top.def.label} drives ${share}% of the change (${top.pts >= 0 ? '+' : ''}${top.pts.toFixed(2)} pts).`,
    )
  }

  lines.push(
    sim.cost > 0
      ? `Estimated spend $${sim.cost.toLocaleString('en-US')}K at ${sim.confidence}% model confidence.`
      : `No spend required, model confidence ${sim.confidence}%.`,
  )
  return lines
}

/* -------------------------------------------------------------------------- */
/* Production volume                                                           */
/* -------------------------------------------------------------------------- */

const SEASONAL = [0.86, 0.88, 0.94, 0.97, 1, 1.02, 1.04, 1.06, 1.08, 1.1, 1.16, 1.22]

const VOLUME_BASE: Record<ItemKey, number> = {
  memory: 940,
  battery: 915,
  adapter: 610,
  pba: 960,
  mainBoard: 925,
}

/** Local share per item: [January, October, forecast months]. */
const LOCAL_SHARE: Record<ItemKey, [number, number, number]> = {
  memory: [0.36, 0.3, 0.29],
  battery: [0.42, 0.39, 0.38],
  adapter: [0.88, 0.86, 0.86],
  pba: [0.96, 0.95, 0.95],
  mainBoard: [0.56, 0.53, 0.52],
}

/** Points of local share gained per 1% of SM-S938 volume reallocated. */
const MIX_SHARE_PP: Partial<Record<ItemKey, number>> = {
  memory: 0.08,
  battery: 0.08,
  pba: 0.02,
  mainBoard: 0.06,
}

export type VolumeMode = 'monthly' | 'accumulated'

export type VolumeRow = {
  month: Month
  projected: boolean
  total: number
  local: number
  share: number
} & Record<ItemKey, number>

function itemMonthly(item: ItemKey, index: number, levers: Levers) {
  const itemIndex = ITEMS.findIndex((i) => i.key === item)
  const wiggle = 1 + 0.018 * Math.sin((index + 1) * (itemIndex + 2))
  const volume = Math.round(VOLUME_BASE[item] * SEASONAL[index] * wiggle)

  const [start, october, tail] = LOCAL_SHARE[item]
  let share =
    index <= LAST_ACTUAL
      ? start + ((october - start) * index) / LAST_ACTUAL
      : tail

  if (index > LAST_ACTUAL) {
    const real = index === LAST_ACTUAL + 1 ? REALISATION.Nov : REALISATION.Dec
    const leverPp =
      item === 'memory' || item === 'battery' || item === 'mainBoard'
        ? levers[item]
        : 0
    const mixPp = levers.mix * (MIX_SHARE_PP[item] ?? 0)
    share = Math.min(0.99, Math.max(0.05, share + ((leverPp + mixPp) / 100) * real))
  }

  return { volume, local: volume * share }
}

/** Builds the per-month series, either as-is or with each month absorbing every prior month. */
export function volumeSeries(levers: Levers, mode: VolumeMode): VolumeRow[] {
  const run = { total: 0, local: 0 } as { total: number; local: number } & Record<
    ItemKey,
    number
  >
  ITEMS.forEach((i) => (run[i.key] = 0))

  return MONTHS.map((month, index) => {
    const row = { month, projected: index > LAST_ACTUAL } as VolumeRow
    let total = 0
    let local = 0
    ITEMS.forEach((item) => {
      const m = itemMonthly(item.key, index, levers)
      row[item.key] = m.volume
      total += m.volume
      local += m.local
    })

    if (mode === 'accumulated') {
      ITEMS.forEach((item) => {
        run[item.key] += row[item.key]
        row[item.key] = run[item.key]
      })
      run.total += total
      run.local += local
      row.total = run.total
      row.local = run.local
    } else {
      row.total = total
      row.local = local
    }
    row.share = row.local / row.total
    return row
  })
}

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

export const fmt = (n: number, digits = 2) => n.toFixed(digits)

export const fmtSigned = (n: number, digits = 2) =>
  `${n >= 0 ? '+' : '\u2212'}${Math.abs(n).toFixed(digits)}`

export function fmtVolume(thousands: number) {
  return thousands >= 1000
    ? `${(thousands / 1000).toFixed(1)}M`
    : `${Math.round(thousands)}K`
}

export const fmtPercent = (ratio: number, digits = 1) =>
  `${(ratio * 100).toFixed(digits)}%`

export const fmtCost = (thousandsUsd: number) =>
  thousandsUsd >= 1000
    ? `$${(thousandsUsd / 1000).toFixed(2)}M`
    : `$${Math.round(thousandsUsd)}K`
