/* -------------------------------------------------------------------------- */
/* Constants                                                                   */
/* -------------------------------------------------------------------------- */

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

/** Index of the last closed month (October). Everything after it is open for planning. */
export const LAST_ACTUAL = 9
export const OPEN_MONTHS = ['Nov', 'Dec'] as const

/* -------------------------------------------------------------------------- */
/* PPB items                                                                   */
/* -------------------------------------------------------------------------- */

export type ItemKey = 'memory' | 'battery' | 'adapter' | 'pba' | 'mainBoard'

export type ItemDef = {
  key: ItemKey
  name: string
  detail: string
  color: string
  /** Accumulated points at the October close. */
  current: number
  /** Accumulated points the AI forecast reaches in December. */
  forecast: number
  /** Monthly local share (ratio) in January and October, used to shape the actuals. */
  jan: number
  oct: number
  /** Percentage points above the forecast that suppliers can realistically deliver. */
  headroom: number
  /** Spend in $K for each percentage point of extra local share, per month. */
  costPerPp: number
}

export const ITEMS: ItemDef[] = [
  {
    key: 'memory',
    name: 'Memory',
    detail: 'GH82 and GH96 modules',
    color: '#14308f',
    current: 41.55,
    forecast: 60.95,
    jan: 0.1,
    oct: 0.24,
    headroom: 25,
    costPerPp: 70,
  },
  {
    key: 'battery',
    name: 'Battery',
    detail: 'EB-BS938 cells',
    color: '#2457e6',
    current: 142.3,
    forecast: 156.5,
    jan: 0.22,
    oct: 0.36,
    headroom: 16,
    costPerPp: 45,
  },
  {
    key: 'adapter',
    name: 'Adapter',
    detail: 'Wall charger units',
    color: '#5b8bff',
    current: 71.8,
    forecast: 76.7,
    jan: 0.4,
    oct: 0.52,
    headroom: 10,
    costPerPp: 30,
  },
  {
    key: 'pba',
    name: 'PBA Assembly',
    detail: 'Populated board assemblies',
    color: '#9dbcff',
    current: 198.45,
    forecast: 213.05,
    jan: 0.46,
    oct: 0.6,
    headroom: 10,
    costPerPp: 40,
  },
  {
    key: 'mainBoard',
    name: 'Main Board',
    detail: 'GH82-MB boards on local SMT',
    color: '#cfdcff',
    current: 119.64,
    forecast: 134.0,
    jan: 0.26,
    oct: 0.4,
    headroom: 14,
    costPerPp: 47.5,
  },
]

export const ITEM_BY_KEY = Object.fromEntries(ITEMS.map((i) => [i.key, i])) as Record<
  ItemKey,
  ItemDef
>

/* -------------------------------------------------------------------------- */
/* Calibration: volumes, weights and forecast shares                           */
/* -------------------------------------------------------------------------- */

const SEASONAL = [0.86, 0.88, 0.94, 0.97, 1, 1.02, 1.04, 1.06, 1.08, 1.1, 1.16, 1.22]

const VOLUME_BASE: Record<ItemKey, number> = {
  memory: 940,
  battery: 915,
  adapter: 610,
  pba: 960,
  mainBoard: 925,
}

/** Share of the Oct-to-Dec move that has already landed by November. */
const RAMP = 0.5

type Calibrated = {
  weight: number
  volume: number[]
  actual: number[]
  basePlan: [number, number]
}

/**
 * Points are the item weight times the volume-weighted local share. The weight is
 * solved so October matches the closed accumulated score, and the forecast shares are
 * solved so December matches the AI forecast. Everything else follows from share and volume.
 */
function calibrate(): Record<ItemKey, Calibrated> {
  const out = {} as Record<ItemKey, Calibrated>
  ITEMS.forEach((item, idx) => {
    const volume = SEASONAL.map((s, m) =>
      Math.round(VOLUME_BASE[item.key] * s * (1 + 0.018 * Math.sin((m + 1) * (idx + 2)))),
    )
    const actual = Array.from(
      { length: LAST_ACTUAL + 1 },
      (_, m) => item.jan + ((item.oct - item.jan) * m) / LAST_ACTUAL,
    )

    let local = 0
    let vol = 0
    actual.forEach((share, m) => {
      local += volume[m] * share
      vol += volume[m]
    })

    const weight = item.current / (local / vol)
    const annual = volume.reduce((a, b) => a + b, 0)
    const needed = (item.forecast / weight) * annual - local
    const octShare = actual[LAST_ACTUAL]
    const dec =
      (needed - volume[10] * octShare * (1 - RAMP)) / (volume[10] * RAMP + volume[11])
    const nov = octShare + RAMP * (dec - octShare)

    out[item.key] = { weight, volume, actual, basePlan: [nov * 100, dec * 100] }
  })
  return out
}

const CAL = calibrate()

export const WEIGHT = Object.fromEntries(
  ITEMS.map((i) => [i.key, CAL[i.key].weight]),
) as Record<ItemKey, number>

/** Local share (percent) the AI forecast assumes for November and December. */
export type Plan = Record<ItemKey, [number, number]>

export const BASE_PLAN = Object.fromEntries(
  ITEMS.map((i) => [i.key, [...CAL[i.key].basePlan]]),
) as Plan

export const clonePlan = (plan: Plan): Plan =>
  Object.fromEntries(ITEMS.map((i) => [i.key, [...plan[i.key]]])) as Plan

/** Highest local share suppliers can credibly deliver for an open month. */
export function ceilingFor(key: ItemKey, openIndex: 0 | 1) {
  return Math.min(100, BASE_PLAN[key][openIndex] + ITEM_BY_KEY[key].headroom)
}

/* -------------------------------------------------------------------------- */
/* Monthly series                                                              */
/* -------------------------------------------------------------------------- */

export type VolumeMode = 'monthly' | 'accumulated'

export type MonthCell = {
  /** Thousands of units. */
  volume: number
  local: number
  /** Ratio, 0 to 1. */
  share: number
  points: number
}

export type SeriesRow = {
  month: Month
  index: number
  projected: boolean
  cells: Record<ItemKey, MonthCell>
  total: MonthCell
}

/**
 * Monthly mode: each month on its own. Points are what that month would score if it were the whole year.
 * Accumulated mode: every month absorbs the ones before it. December equals the year-end score.
 */
export function buildSeries(plan: Plan, mode: VolumeMode): SeriesRow[] {
  const runVolume = {} as Record<ItemKey, number>
  const runLocal = {} as Record<ItemKey, number>
  ITEMS.forEach((i) => {
    runVolume[i.key] = 0
    runLocal[i.key] = 0
  })

  return MONTHS.map((month, index) => {
    const cells = {} as Record<ItemKey, MonthCell>
    const total: MonthCell = { volume: 0, local: 0, share: 0, points: 0 }

    ITEMS.forEach(({ key }) => {
      const cal = CAL[key]
      const volume = cal.volume[index]
      const share = index <= LAST_ACTUAL ? cal.actual[index] : plan[key][index - LAST_ACTUAL - 1] / 100
      const local = volume * share

      let cell: MonthCell
      if (mode === 'monthly') {
        cell = { volume, local, share, points: cal.weight * share }
      } else {
        runVolume[key] += volume
        runLocal[key] += local
        const running = runLocal[key] / runVolume[key]
        cell = {
          volume: runVolume[key],
          local: runLocal[key],
          share: running,
          points: cal.weight * running,
        }
      }
      cells[key] = cell
      total.volume += cell.volume
      total.local += cell.local
      total.points += cell.points
    })

    total.share = total.local / total.volume
    return { month, index, projected: index > LAST_ACTUAL, cells, total }
  })
}

const BASE_SERIES: Record<VolumeMode, SeriesRow[]> = {
  monthly: buildSeries(BASE_PLAN, 'monthly'),
  accumulated: buildSeries(BASE_PLAN, 'accumulated'),
}

export const baselineSeries = (mode: VolumeMode) => BASE_SERIES[mode]

/** Monthly local share (percent) for one item: actuals, the forecast and the plan. */
export function itemShareTrend(plan: Plan, key: ItemKey) {
  return MONTHS.map((month, index) => {
    if (index < LAST_ACTUAL) return { month, actual: CAL[key].actual[index] * 100 }
    if (index === LAST_ACTUAL) {
      const v = CAL[key].actual[index] * 100
      return { month, actual: v, forecast: v, plan: v }
    }
    const open = index - LAST_ACTUAL - 1
    return { month, forecast: BASE_PLAN[key][open], plan: plan[key][open] }
  })
}

/* -------------------------------------------------------------------------- */
/* AI suggestions: starting points for the plan                                */
/* -------------------------------------------------------------------------- */

export type Suggestion = {
  id: string
  name: string
  tag: string
  blurb: string
  /** Percentage points added to the forecast share, per open month. */
  delta: Record<ItemKey, [number, number]>
  plan: Plan
}

const zero: [number, number] = [0, 0]

function planFromDelta(delta: Record<ItemKey, [number, number]>): Plan {
  return Object.fromEntries(
    ITEMS.map((i) => [
      i.key,
      [
        Math.min(100, Math.max(0, BASE_PLAN[i.key][0] + delta[i.key][0])),
        Math.min(100, Math.max(0, BASE_PLAN[i.key][1] + delta[i.key][1])),
      ],
    ]),
  ) as Plan
}

function suggestion(
  meta: Omit<Suggestion, 'delta' | 'plan'>,
  delta: Partial<Record<ItemKey, [number, number]>>,
): Suggestion {
  const full = Object.fromEntries(
    ITEMS.map((i) => [i.key, delta[i.key] ?? zero]),
  ) as Record<ItemKey, [number, number]>
  return { ...meta, delta: full, plan: planFromDelta(full) }
}

export const SUGGESTIONS: Suggestion[] = [
  suggestion(
    {
      id: 'forecast',
      name: 'Follow the forecast',
      tag: 'Baseline',
      blurb: 'No intervention. Suppliers deliver the share the AI already expects.',
    },
    {},
  ),
  suggestion(
    {
      id: 'balanced',
      name: 'Balanced plan',
      tag: 'Recommended',
      blurb: 'Raises every item a little. Clears the target with room to spare.',
    },
    {
      memory: [10, 12],
      battery: [10, 12],
      adapter: [2, 3],
      pba: [5, 6],
      mainBoard: [5, 7],
    },
  ),
  suggestion(
    {
      id: 'lowest-cost',
      name: 'Lowest-cost compliance',
      tag: 'Lowest cost',
      blurb: 'Pushes battery and PBA, where each point of share earns the most.',
    },
    {
      battery: [14, 16],
      pba: [8, 10],
      mainBoard: [2, 2],
    },
  ),
  suggestion(
    {
      id: 'memory-sprint',
      name: 'Memory sprint',
      tag: 'Single item',
      blurb: 'Only memory changes. Simple to run, but memory earns the least per point.',
    },
    { memory: [20, 24] },
  ),
  suggestion(
    {
      id: 'battery-hedge',
      name: 'Battery import hedge',
      tag: 'Partial',
      blurb: 'Localize EB-BS938 cells at the supplier ceiling. Helps, does not close alone.',
    },
    { battery: [16, 16] },
  ),
  suggestion(
    {
      id: 'max-headroom',
      name: 'Maximum headroom',
      tag: 'Aggressive',
      blurb: 'Every item at the supplier ceiling. Highest score, spend and risk.',
    },
    {
      memory: [25, 25],
      battery: [16, 16],
      adapter: [10, 10],
      pba: [10, 10],
      mainBoard: [14, 14],
    },
  ),
  suggestion(
    {
      id: 'supplier-shock',
      name: 'Supplier disruption',
      tag: 'Stress test',
      blurb: 'Two local suppliers lose capacity and imports fill the gap.',
    },
    {
      memory: [-10, -14],
      battery: [-8, -10],
      mainBoard: [-4, -4],
    },
  ),
]

export const DEFAULT_SUGGESTION = SUGGESTIONS[1]

export function samePlan(a: Plan, b: Plan) {
  return ITEMS.every((i) =>
    [0, 1].every((m) => Math.abs(a[i.key][m] - b[i.key][m]) < 0.05),
  )
}

export function matchSuggestion(plan: Plan) {
  return SUGGESTIONS.find((s) => samePlan(s.plan, plan))
}

/* -------------------------------------------------------------------------- */
/* Risk drivers                                                                */
/* -------------------------------------------------------------------------- */

const DRIVERS: {
  id: string
  name: string
  reason: string
  impact: number
  item: ItemKey | null
}[] = [
  {
    id: 'memory-localization',
    name: 'Memory localization',
    reason: 'Local share of GH82 volume below plan since Q2',
    impact: -14.3,
    item: 'memory',
  },
  {
    id: 'battery-import',
    name: 'Imported battery volume',
    reason: 'Higher import mix on EB-BS938 cells',
    impact: -4.1,
    item: 'battery',
  },
  {
    id: 'nov-mix',
    name: 'November production mix',
    reason: 'SM-S938 ramp shifts volume to import-heavy BOMs',
    impact: -2.8,
    item: 'mainBoard',
  },
  {
    id: 'bom',
    name: 'New model BOM uncertainty',
    reason: '3 models still without validated BOM mapping',
    impact: -1.7,
    item: null,
  },
  {
    id: 'supplier',
    name: 'Supplier availability',
    reason: 'Two local suppliers capped at current allocation',
    impact: -0.9,
    item: null,
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

export type TrajectoryPoint = {
  month: Month
  actual?: number
  forecast?: number
  scenario?: number
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
  detail: string
  color: string
  weight: number
  current: number
  forecast: number
  scenario: number
  delta: number
  /** Accumulated local share (ratio) at the October close. */
  shareNow: number
  /** Accumulated local share (ratio) in December for the forecast and the plan. */
  shareForecast: number
  shareScenario: number
}

export type DriverRow = {
  id: string
  name: string
  reason: string
  baseline: number
  residual: number
}

export type PlanChange = {
  key: ItemKey
  name: string
  open: 0 | 1
  month: Month
  from: number
  to: number
  delta: number
}

export type OpenMonthRow = {
  month: Month
  forecastShare: number
  planShare: number
  forecastPoints: number
  planPoints: number
}

export type Simulation = {
  plan: Plan
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
  changes: PlanChange[]
  overCeiling: PlanChange[]
  openMonths: OpenMonthRow[]
}

const round2 = (n: number) => Math.round(n * 100) / 100

export function simulate(plan: Plan): Simulation {
  const acc = buildSeries(plan, 'accumulated')
  const base = BASE_SERIES.accumulated
  const last = acc[acc.length - 1]
  const baseLast = base[base.length - 1]

  const items: ItemRow[] = ITEMS.map((item) => ({
    key: item.key,
    name: item.name,
    detail: item.detail,
    color: item.color,
    weight: WEIGHT[item.key],
    current: round2(acc[LAST_ACTUAL].cells[item.key].points),
    forecast: round2(baseLast.cells[item.key].points),
    scenario: round2(last.cells[item.key].points),
    delta: round2(last.cells[item.key].points - baseLast.cells[item.key].points),
    shareNow: acc[LAST_ACTUAL].cells[item.key].share,
    shareForecast: baseLast.cells[item.key].share,
    shareScenario: last.cells[item.key].share,
  }))

  const yearEnd = round2(last.total.points)
  const gain = round2(yearEnd - BASE_FORECAST)

  const changes: PlanChange[] = []
  const overCeiling: PlanChange[] = []
  let cost = 0
  let effort = 0
  let retreat = 0
  ITEMS.forEach((item) => {
    ;([0, 1] as const).forEach((open) => {
      const from = BASE_PLAN[item.key][open]
      const to = plan[item.key][open]
      const delta = to - from
      if (Math.abs(delta) < 0.05) return
      const change: PlanChange = {
        key: item.key,
        name: item.name,
        open,
        month: OPEN_MONTHS[open],
        from,
        to,
        delta,
      }
      changes.push(change)
      if (to > ceilingFor(item.key, open) + 0.05) overCeiling.push(change)
      cost += Math.max(0, delta) * item.costPerPp
      effort += Math.min(1.5, Math.max(0, delta) / item.headroom)
      retreat += Math.max(0, -delta) / 10
    })
  })

  const confidence = Math.round(
    Math.min(
      92,
      Math.max(50, BASE_CONFIDENCE - effort * 4 - retreat * 3 - overCeiling.length * 3),
    ),
  )

  const trajectory: TrajectoryPoint[] = MONTHS.map((month, i) => {
    const points = acc[i].total.points
    if (i < LAST_ACTUAL) return { month, actual: points }
    if (i === LAST_ACTUAL) {
      return { month, actual: points, forecast: points, scenario: points }
    }
    return { month, forecast: base[i].total.points, scenario: points }
  })

  const moving = items
    .filter((r) => Math.abs(r.delta) >= 0.005)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
  let running = BASE_FORECAST
  const steps: WaterfallStep[] = [
    { label: 'Forecast', start: 0, end: BASE_FORECAST, kind: 'total' },
    ...moving.map((r): WaterfallStep => {
      const start = running
      running = round2(running + r.delta)
      return { label: r.name, start, end: running, kind: r.delta >= 0 ? 'up' : 'down' }
    }),
    { label: 'Plan', start: 0, end: yearEnd, kind: 'total' },
  ]

  const drivers: DriverRow[] = DRIVERS.map((d) => {
    const lift = d.item ? (items.find((r) => r.key === d.item)?.delta ?? 0) : 0
    return {
      id: d.id,
      name: d.name,
      reason: d.reason,
      baseline: d.impact,
      residual: d.item ? Math.min(0, round2(d.impact + lift)) : d.impact,
    }
  })

  const openMonths: OpenMonthRow[] = ([10, 11] as const).map((index) => ({
    month: MONTHS[index],
    forecastShare: base[index].total.share,
    planShare: acc[index].total.share,
    forecastPoints: base[index].total.points,
    planPoints: acc[index].total.points,
  }))

  return {
    plan,
    gain,
    yearEnd,
    gap: round2(yearEnd - REQUIRED_SCORE),
    status: statusFor(yearEnd),
    cost: Math.round(cost),
    confidence,
    trajectory,
    steps,
    items,
    drivers,
    changes,
    overCeiling,
    openMonths,
  }
}

export const BASELINE = simulate(BASE_PLAN)

export const SUGGESTION_RESULTS = SUGGESTIONS.map((suggestion) => ({
  suggestion,
  sim: simulate(suggestion.plan),
}))

/** Plain-language read-out generated from the simulation, not hand-written per plan. */
export function buildReadout(sim: Simulation) {
  const lines: string[] = []
  const gap = Math.abs(sim.gap).toFixed(2)

  if (sim.changes.length === 0) {
    const worst = [...sim.drivers].sort((a, b) => a.residual - b.residual)[0]
    lines.push(
      `With no change the year closes at ${sim.yearEnd.toFixed(2)}, ${gap} pts short of ${REQUIRED_SCORE}.`,
    )
    lines.push(
      `${worst.name} is the largest drag at ${worst.residual.toFixed(1)} pts. Raise the local share of November and December to close the gap.`,
    )
    return lines
  }

  lines.push(
    sim.gap >= 0
      ? `Closes the year at ${sim.yearEnd.toFixed(2)}, ${gap} pts above the ${REQUIRED_SCORE} requirement.`
      : `Closes the year at ${sim.yearEnd.toFixed(2)}, still ${gap} pts short of ${REQUIRED_SCORE}.`,
  )

  const top = [...sim.items].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0]
  if (top && Math.abs(top.delta) > 0.005 && Math.abs(sim.gain) > 0.005) {
    const share = Math.round((Math.abs(top.delta) / Math.abs(sim.gain)) * 100)
    lines.push(
      `${top.name} drives ${share}% of the change (${top.delta >= 0 ? '+' : ''}${top.delta.toFixed(2)} pts).`,
    )
  }

  lines.push(
    sim.cost > 0
      ? `Estimated spend ${fmtCost(sim.cost)} at ${sim.confidence}% model confidence.`
      : `No spend required, model confidence ${sim.confidence}%.`,
  )

  if (sim.overCeiling.length > 0) {
    lines.push(
      `${sim.overCeiling.length} ${sim.overCeiling.length === 1 ? 'entry exceeds' : 'entries exceed'} what suppliers can deliver.`,
    )
  }
  return lines
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
