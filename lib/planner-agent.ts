import {
  BASELINE,
  BASE_CONFIDENCE,
  BASE_PLAN,
  ITEMS,
  ITEM_BY_KEY,
  OPEN_MONTHS,
  REQUIRED_SCORE,
  ceilingFor,
  clonePlan,
  fmtCost,
  simulate,
  type ItemDef,
  type ItemKey,
  type Plan,
  type Simulation,
} from '@/lib/ppb-model'
import { premium, priceIndex } from '@/lib/material-prices'

/* -------------------------------------------------------------------------- */
/* The fixed brief: reach the target at the lowest spend, rest of the year     */
/* -------------------------------------------------------------------------- */

export const SAFETY_BUFFER = 2
export const TARGET_SCORE = REQUIRED_SCORE + SAFETY_BUFFER
export const CONFIDENCE_FLOOR = 70

/** Percentage points the optimizer may pull local share back on its own where imports are cheaper. */
const AUTO_DOWN = 3
/** Deepest pull back a user instruction can ask for. */
const USER_DOWN = 8
const DEFAULT_AMOUNT = 3

/* -------------------------------------------------------------------------- */
/* Instructions from the chat                                                  */
/* -------------------------------------------------------------------------- */

export type DirectiveKind = 'max' | 'min' | 'raise' | 'lower' | 'hold'

export type Directive = {
  /** One instruction per item and month, so a newer one replaces an older one. */
  id: string
  kind: DirectiveKind
  item: ItemKey
  open: 0 | 1
  /** Percentage points, for raise and lower. */
  amount?: number
  /** Why the user asked, quoted back in the trace. */
  reason?: string
}

export const directiveId = (item: ItemKey, open: 0 | 1) => `${item}-${open}`

export function directiveLabel(d: Directive) {
  const name = ITEM_BY_KEY[d.item].name
  const month = OPEN_MONTHS[d.open]
  switch (d.kind) {
    case 'max':
      return `Max ${name} ${month}`
    case 'min':
      return `Min ${name} ${month}`
    case 'hold':
      return `Hold ${name} ${month}`
    case 'raise':
      return `${name} ${month} up ${d.amount ?? DEFAULT_AMOUNT} pp`
    case 'lower':
      return `${name} ${month} down ${d.amount ?? DEFAULT_AMOUNT} pp`
  }
}

/* -------------------------------------------------------------------------- */
/* App clock: the app lives on November 6, so plans are stamped on that clock   */
/* -------------------------------------------------------------------------- */

const CLOCK_START = Date.parse('2026-11-06T08:47:00Z')
const loadedAt = Date.now()

export function appNowIso() {
  return new Date(CLOCK_START + (Date.now() - loadedAt)).toISOString().slice(0, 19)
}

/* -------------------------------------------------------------------------- */
/* Optimizer                                                                   */
/* -------------------------------------------------------------------------- */

const STEP = 0.5
const floorStep = (n: number) => Math.floor(n / STEP + 1e-9) * STEP
const ceilStep = (n: number) => Math.ceil(n / STEP - 1e-9) * STEP

/** Confidence drops 3 per 10 pp of retreat and 4 per unit of effort, so a retreat pp costs this much effort. */
const DOWN_EFFORT = 0.075

const effortAt = (headroom: number, x: number) =>
  x > 0 ? Math.min(1.5, x / headroom) : -x * DOWN_EFFORT

/** Confidence is BASE_CONFIDENCE minus 4 per unit of effort, so this is the effort budget. */
const effortLimit = (BASE_CONFIDENCE - CONFIDENCE_FLOOR) / 4

type Entry = {
  key: ItemKey
  open: 0 | 1
  /** Lowest and highest move from the forecast share, in percentage points. */
  lo: number
  hi: number
  /** Points of year-end score earned per percentage point of local share. */
  gain: number
  /** Spend in $K per percentage point, at this month's material prices. */
  cost: number
  headroom: number
  directive?: Directive
}

const GAIN: Record<string, number> = {}
function gainOf(key: ItemKey, open: 0 | 1) {
  const id = `${key}-${open}`
  if (GAIN[id] === undefined) {
    const probe = clonePlan(BASE_PLAN)
    probe[key][open] += 5
    GAIN[id] = (simulate(probe).yearEnd - BASELINE.yearEnd) / 5
  }
  return GAIN[id]
}

function boundsFor(item: ItemDef, open: 0 | 1, scale: number, directive?: Directive) {
  const base = BASE_PLAN[item.key][open]
  const hiAuto = floorStep(ceilingFor(item.key, open) - base)
  const loAuto = -Math.min(floorStep(AUTO_DOWN * scale), floorStep(base))
  const loUser = -Math.min(USER_DOWN, floorStep(base))
  let lo = loAuto
  let hi = hiAuto

  switch (directive?.kind) {
    case 'max':
      lo = hi = hiAuto
      break
    case 'min':
      lo = hi = loUser
      break
    case 'hold':
      lo = hi = 0
      break
    case 'raise':
      lo = Math.min(hiAuto, ceilStep(directive.amount ?? DEFAULT_AMOUNT))
      break
    case 'lower':
      hi = Math.max(loUser, -ceilStep(directive.amount ?? DEFAULT_AMOUNT))
      lo = loUser
      break
  }
  return { lo: Math.min(lo, hi), hi }
}

function buildEntries(directives: Directive[], scale = 1): Entry[] {
  const entries: Entry[] = []
  ITEMS.forEach((item) => {
    ;([0, 1] as const).forEach((open) => {
      const directive = directives.find((d) => d.item === item.key && d.open === open)
      const { lo, hi } = boundsFor(item, open, scale, directive)
      entries.push({
        key: item.key,
        open,
        lo,
        hi,
        gain: gainOf(item.key, open),
        cost: item.costPerPp * priceIndex(item.key, open),
        headroom: item.headroom,
        directive,
      })
    })
  })
  return entries
}

type FillOptions = {
  objective: 'min-cost' | 'max-score'
  lambda: number
  integer: boolean
  effortCap: number
}

/** The most an entry can be raised from its lowest move before the effort budget runs out. */
function effortRoom(e: Entry, effortLeft: number) {
  if (e.lo < 0) {
    const freed = -e.lo * DOWN_EFFORT
    return -e.lo + Math.max(0, (effortLeft + freed) * e.headroom)
  }
  return Math.max(0, effortLeft * e.headroom)
}

/**
 * Every entry starts at its lowest move, where imports replace local. Points are then bought
 * back from the cheapest per point upward until the target is met, so shares fall only where
 * a point is not worth its price.
 */
function fill(entries: Entry[], o: FillOptions) {
  const plan = clonePlan(BASE_PLAN)
  entries.forEach((e) => {
    plan[e.key][e.open] += e.lo
  })
  let effortLeft = o.effortCap - entries.reduce((s, e) => s + effortAt(e.headroom, e.lo), 0)
  // The simulation rounds to two decimals, so aim a hair past the target.
  let remaining = TARGET_SCORE - simulate(plan).yearEnd + 0.006

  const sorted = [...entries].sort(
    (a, b) => b.gain / (b.cost + o.lambda / b.headroom) - a.gain / (a.cost + o.lambda / a.headroom),
  )

  for (const e of sorted) {
    const room = e.hi - e.lo
    if (room <= 1e-9) continue
    const limit = Math.min(room, effortRoom(e, effortLeft))
    let add: number
    if (o.objective === 'min-cost') {
      if (remaining <= 1e-6) break
      const wanted = remaining / e.gain
      add = o.integer ? Math.min(ceilStep(wanted), floorStep(limit)) : Math.min(wanted, limit)
    } else {
      add = o.integer ? floorStep(limit) : limit
    }
    if (!(add > 1e-6)) continue
    plan[e.key][e.open] += add
    effortLeft -= effortAt(e.headroom, e.lo + add) - effortAt(e.headroom, e.lo)
    remaining -= add * e.gain
  }
  return plan
}

const effortOf = (plan: Plan) =>
  ITEMS.reduce(
    (sum, i) =>
      sum +
      ([0, 1] as const).reduce<number>(
        (s, m) => s + effortAt(i.headroom, plan[i.key][m] - BASE_PLAN[i.key][m]),
        0,
      ),
    0,
  )

export type Probe = {
  lambda: number
  scale: number
  score: number
  cost: number
  effort: number
  feasible: boolean
}

const LAMBDA_GRID = [0, 150, 300, 600, 1200, 2400, 4800, 9600, 19200, 60000]
const SCALES = [1, 0.5, 0]

type RoundSolution = {
  plan: Plan
  sim: Simulation
  probes: Probe[]
  chosen: number
  /** True when no probe could reach the target inside the limits. */
  unreachable: boolean
}

function solveRound(
  directives: Directive[],
  opts: {
    objective: 'min-cost' | 'max-score'
    relaxed: boolean
    integer: boolean
    tighten: number
  },
): RoundSolution {
  const effortCap = opts.relaxed ? Number.POSITIVE_INFINITY : Math.max(0, effortLimit - opts.tighten)
  const combos = opts.relaxed
    ? [{ lambda: 0, scale: 1 }]
    : LAMBDA_GRID.flatMap((lambda) => SCALES.map((scale) => ({ lambda, scale })))

  const probes: Probe[] = []
  const plans: Plan[] = []
  const sims: Simulation[] = []
  combos.forEach(({ lambda, scale }) => {
    const plan = fill(buildEntries(directives, scale), {
      objective: opts.objective,
      lambda,
      integer: opts.integer,
      effortCap,
    })
    const sim = simulate(plan)
    plans.push(plan)
    sims.push(sim)
    probes.push({
      lambda,
      scale,
      score: sim.yearEnd,
      cost: sim.cost,
      effort: effortOf(plan),
      feasible:
        sim.yearEnd + 0.004 >= TARGET_SCORE &&
        (opts.relaxed || sim.confidence >= CONFIDENCE_FLOOR) &&
        sim.overCeiling.length === 0,
    })
  })

  const indexed = probes.map((p, i) => ({ p, i }))
  let chosen: number
  const ok = indexed.filter(({ p }) => p.feasible)
  if (opts.objective === 'min-cost' && ok.length > 0) {
    chosen = ok.sort((a, b) => a.p.cost - b.p.cost || a.p.effort - b.p.effort)[0].i
  } else {
    const confident = indexed.filter(({ i }) => opts.relaxed || sims[i].confidence >= CONFIDENCE_FLOOR)
    const pool = confident.length > 0 ? confident : indexed
    chosen = pool.sort((a, b) => b.p.score - a.p.score || a.p.cost - b.p.cost)[0].i
  }

  return {
    plan: plans[chosen],
    sim: sims[chosen],
    probes,
    chosen,
    unreachable: ok.length === 0,
  }
}

/* -------------------------------------------------------------------------- */
/* Checks                                                                      */
/* -------------------------------------------------------------------------- */

export type CheckRow = {
  id: 'score' | 'confidence' | 'ceiling' | 'instructions'
  label: string
  actual: string
  limit: string
  pass: boolean
}

function honored(d: Directive, plan: Plan) {
  const delta = plan[d.item][d.open] - BASE_PLAN[d.item][d.open]
  const ceiling = ceilingFor(d.item, d.open) - BASE_PLAN[d.item][d.open]
  switch (d.kind) {
    case 'max':
      return delta >= ceiling - 0.06
    case 'min':
      return delta <= -Math.min(USER_DOWN, floorStep(BASE_PLAN[d.item][d.open])) + 0.06
    case 'hold':
      return Math.abs(delta) < 0.06
    case 'raise':
      return delta >= Math.min(d.amount ?? DEFAULT_AMOUNT, ceiling) - 0.06
    case 'lower':
      return delta <= -(d.amount ?? DEFAULT_AMOUNT) + 0.06
  }
}

function runChecks(sim: Simulation, directives: Directive[]): CheckRow[] {
  const rows: CheckRow[] = [
    {
      id: 'score',
      label: 'Year-end score',
      actual: sim.yearEnd.toFixed(2),
      limit: `\u2265 ${TARGET_SCORE.toFixed(2)}`,
      pass: sim.yearEnd + 0.004 >= TARGET_SCORE,
    },
    {
      id: 'confidence',
      label: 'Model confidence',
      actual: `${sim.confidence}%`,
      limit: `\u2265 ${CONFIDENCE_FLOOR}%`,
      pass: sim.confidence >= CONFIDENCE_FLOOR,
    },
    {
      id: 'ceiling',
      label: 'Supplier ceilings',
      actual: `${sim.overCeiling.length} above`,
      limit: '0 above',
      pass: sim.overCeiling.length === 0,
    },
  ]
  if (directives.length > 0) {
    const met = directives.filter((d) => honored(d, sim.plan)).length
    rows.push({
      id: 'instructions',
      label: 'Your instructions',
      actual: `${met} of ${directives.length}`,
      limit: 'all met',
      pass: met === directives.length,
    })
  }
  return rows
}

/* -------------------------------------------------------------------------- */
/* The run: a scripted trace the UI plays back                                 */
/* -------------------------------------------------------------------------- */

export type Phase = 'analyze' | 'model' | 'solve' | 'check' | 'reoptimize' | 'deliver'

export type Candidate = {
  round: number
  label: string
  plan: Plan
  sim: Simulation
  effort: number
}

export type AgentStep = {
  id: string
  phase: Phase
  round: number
  title: string
  lines: string[]
  outcome: string
  tone: 'neutral' | 'ok' | 'warn' | 'bad'
  duration: number
  candidate?: Candidate
  checks?: CheckRow[]
}

export type AgentRun = {
  directives: Directive[]
  steps: AgentStep[]
  totalMs: number
  candidates: Candidate[]
  final: Candidate
  satisfied: boolean
  name: string
  blurb: string
  summary: string[]
}

const num = (n: number, d = 1) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
const pad = (n: number, w: number) => String(n).padStart(w, '0')
const pp = (n: number) => `${n >= 0 ? '+' : '\u2212'}${Math.abs(n).toFixed(1)} pp`
const pct = (n: number) => `${(n * 100).toFixed(1)}%`

function convergence(from: number, to: number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 1) / count
    return from + (to - from) * (1 - Math.pow(1 - t, 2.4))
  })
}

function lpLines(final: number, objective: 'min-cost' | 'max-score', rows: number, cols: number): string[] {
  const unit = objective === 'min-cost' ? '$K' : 'pts'
  const start = objective === 'min-cost' ? final * 1.9 : final * 0.93
  const path = convergence(start, final, 4)
  return [
    `presolve: ${Math.max(0, rows - 4)} rows and ${Math.max(0, cols - 2)} columns kept of ${rows} x ${cols}`,
    ...path.map(
      (v, i) => `simplex  iter ${pad((i + 1) * 3 + 1, 3)}  obj ${num(v, objective === 'min-cost' ? 1 : 2)} ${unit}`,
    ),
    `optimal  obj ${num(final, objective === 'min-cost' ? 1 : 2)} ${unit}  gap 0.00%`,
  ]
}

function mipLines(lp: number, final: number, objective: 'min-cost' | 'max-score', vars: number): string[] {
  const unit = objective === 'min-cost' ? '$K' : 'pts'
  const d = objective === 'min-cost' ? 1 : 2
  const worse = objective === 'min-cost' ? lp * 1.12 : lp * 0.97
  const path = convergence(worse, final, 3)
  const gaps = [3.8, 1.1, 0.2]
  return [
    `root relaxation  obj ${num(lp, d)} ${unit}  (${vars} integer variables, 0.5 pp steps)`,
    ...path.map(
      (v, i) => `branch  node ${pad((i + 1) * 5 + 2, 3)}  incumbent ${num(v, d)} ${unit}  gap ${gaps[i].toFixed(1)}%`,
    ),
    `optimal  obj ${num(final, d)} ${unit}  gap 0.00%`,
  ]
}

const valueOf = (sim: Simulation, objective: 'min-cost' | 'max-score') =>
  objective === 'min-cost' ? sim.cost : sim.yearEnd

/** Why each move was made, in the agent's own words, from the material prices. */
export function explainPlan(plan: Plan): string[] {
  const sim = simulate(plan)
  return [...sim.changes]
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 4)
    .map((c) => {
      const p = premium(c.key, c.open)
      const perPoint = ITEM_BY_KEY[c.key].costPerPp * priceIndex(c.key, c.open)
      const why =
        c.delta >= 0
          ? `local costs ${pct(p)} over import and a point of share costs ${fmtCost(perPoint)}, among the cheapest ways to earn score`
          : `a point of share costs ${fmtCost(perPoint)}, more than it earns, so imports take the volume`
      return `${c.name} ${c.month} ${pp(c.delta)}: ${why}.`
    })
}

export function runAgent(directives: Directive[]): AgentRun {
  const entries = buildEntries(directives)
  const vars = entries.length
  const steps: AgentStep[] = []
  const candidates: Candidate[] = []
  const gapNow = BASELINE.yearEnd - REQUIRED_SCORE

  const byValue = [...entries].sort((a, b) => b.gain / b.cost - a.gain / a.cost)
  const cheapest = byValue.filter((e) => !e.directive).slice(0, 3)
  const priciest = byValue.filter((e) => !e.directive).slice(-1)[0]

  /* ---- Round 0: read the scenario ---- */
  steps.push({
    id: 'analyze',
    phase: 'analyze',
    round: 0,
    title: 'Analyzing the current scenario',
    lines: [
      `Forecast closes at ${BASELINE.yearEnd.toFixed(2)}, ${Math.abs(gapNow).toFixed(2)} pts ${gapNow < 0 ? 'short of' : 'above'} the ${REQUIRED_SCORE} requirement`,
      `Target ${TARGET_SCORE.toFixed(2)}: the requirement plus a ${SAFETY_BUFFER.toFixed(1)} pt safety buffer`,
      `Scope: local share for Nov and Dec on ${ITEMS.length} items, ${vars} decision variables, moving up or down`,
      'Objective: reach the target at the lowest spend',
      ...directives.map((d) => `Instruction: ${directiveLabel(d)}${d.reason ? ` (${d.reason})` : ''}`),
      ...cheapest.map(
        (e) =>
          `${ITEM_BY_KEY[e.key].name} ${OPEN_MONTHS[e.open]}: ${e.gain.toFixed(3)} pts per pp at ${fmtCost(e.cost)} per pp, local premium ${pct(premium(e.key, e.open))}`,
      ),
      ...(priciest
        ? [
            `${ITEM_BY_KEY[priciest.key].name} ${OPEN_MONTHS[priciest.open]} is the dearest point at ${fmtCost(priciest.cost)} per pp, first to pull back`,
          ]
        : []),
    ],
    outcome: `${vars} variables priced from the material feed`,
    tone: 'neutral',
    duration: 2200,
  })

  /* ---- Rounds ---- */
  let objective: 'min-cost' | 'max-score' = 'min-cost'
  let relaxed = true
  let integer = false
  let tighten = 0
  let lastLpValue = 0
  let final: Candidate | null = null
  let closest = false

  for (let round = 1; round <= 5; round++) {
    const label = integer
      ? 'Integer rounding'
      : relaxed
        ? 'Relaxed solve'
        : closest
          ? 'Closest feasible'
          : 'Constrained solve'
    const solution = solveRound(directives, { objective, relaxed, integer, tighten })
    const sim = solution.sim
    const candidate: Candidate = { round, label, plan: solution.plan, sim, effort: effortOf(solution.plan) }
    candidates.push(candidate)

    const rows = 4 + vars
    const constraintCount = 1 + (relaxed ? 0 : 1) + vars + directives.length

    /* model */
    steps.push({
      id: `model-${round}`,
      phase: 'model',
      round,
      title: round === 1 ? 'Building the MILP model' : `Updating the model, round ${round}`,
      lines:
        round === 1
          ? [
              `variables: ${vars} (local share per item and open month)`,
              `bounds: up to the supplier ceiling, down at most ${AUTO_DOWN} pp where imports are cheaper`,
              `constraints: ${constraintCount} (score target, ${vars} bounds${directives.length ? `, ${directives.length} instruction${directives.length === 1 ? '' : 's'}` : ''})`,
              'confidence left out so the first pass shows the unconstrained optimum',
              'objective: min spend at this month\u2019s material prices',
            ]
          : [
              `variables: ${vars}${integer ? ' (now integer, 0.5 pp steps)' : ''}`,
              `constraints: ${constraintCount}${relaxed ? '' : ' including the confidence limit'}`,
              relaxed
                ? 'no change to constraints'
                : `confidence floor ${CONFIDENCE_FLOOR}% caps total effort at ${(effortLimit - tighten).toFixed(2)}`,
              closest ? 'objective switched to max score inside the limits' : 'objective unchanged',
            ],
      outcome: `${constraintCount} constraints loaded`,
      tone: 'neutral',
      duration: round === 1 ? 1400 : 800,
    })

    /* solve */
    const finalValue = valueOf(sim, objective)
    const solveLines = integer
      ? mipLines(lastLpValue || finalValue, finalValue, objective, vars)
      : lpLines(finalValue, objective, rows, vars)
    if (!relaxed && !integer) {
      const shown = solution.probes.filter((_, i) => i % 7 === 0 || i === solution.chosen).slice(0, 4)
      solveLines.splice(
        1,
        0,
        ...shown.map(
          (p) =>
            `probe  confidence weight ${num(p.lambda, 0)}  pull back ${num(AUTO_DOWN * p.scale, 1)} pp  score ${p.score.toFixed(2)}  spend ${fmtCost(p.cost)}`,
        ),
      )
    }
    steps.push({
      id: `solve-${round}`,
      phase: 'solve',
      round,
      title: integer ? 'Solving, branch and bound' : 'Solving the relaxation',
      lines: solveLines,
      outcome: `Candidate ${round}: ${sim.yearEnd.toFixed(2)} pts for ${fmtCost(sim.cost)}`,
      tone: 'neutral',
      duration: integer ? 1900 : 1700,
      candidate,
    })
    if (!integer) lastLpValue = finalValue

    /* check */
    const checks = runChecks(sim, directives)
    const failed = checks.filter((c) => !c.pass)
    // The score is a hard limit until the agent falls back to the closest feasible plan.
    const blocking = failed.filter((c) => c.id !== 'score' || !closest)
    const failedIds = blocking.map((c) => c.id)
    steps.push({
      id: `check-${round}`,
      phase: 'check',
      round,
      title: 'Checking the result',
      lines: checks.map((c) => `${c.pass ? 'pass' : 'FAIL'}  ${c.label}  ${c.actual}  (${c.limit})`),
      outcome:
        failed.length === 0
          ? 'All constraints satisfied'
          : blocking.length === 0
            ? 'Limits satisfied, target not reached'
            : `${blocking.length} ${blocking.length === 1 ? 'constraint' : 'constraints'} failed`,
      tone: failed.length === 0 ? 'ok' : blocking.length === 0 ? 'warn' : 'bad',
      duration: 1700,
      checks,
    })

    /* decide */
    if ((blocking.length === 0 && integer) || round === 5) {
      final = candidate
      break
    }

    if (blocking.length === 0 && !integer) {
      integer = true
      relaxed = false
      steps.push({
        id: `reopt-${round}`,
        phase: 'reoptimize',
        round,
        title: 'Re-optimizing, snapping to integer steps',
        lines: [
          'The continuous solution clears every constraint',
          'Supplier plans move in 0.5 pp steps, so rounding to integers next',
          'Rounding goes up for the target and down for the limits, then re-checks',
        ],
        outcome: 'Re-solving as an integer program',
        tone: 'neutral',
        duration: 1500,
      })
      continue
    }

    if (integer) {
      tighten += 0.08
      steps.push({
        id: `reopt-${round}`,
        phase: 'reoptimize',
        round,
        title: 'Re-optimizing, tightening the limits',
        lines: [
          `Rounding pushed ${failedIds.join(' and ')} outside the limit`,
          'Lowering the effort cap by 0.08 to leave room for the integer steps',
        ],
        outcome: 'Re-solving with a safety margin',
        tone: 'warn',
        duration: 1500,
      })
      continue
    }

    if (!relaxed && !closest && failedIds.includes('score')) {
      closest = true
      objective = 'max-score'
      steps.push({
        id: `reopt-${round}`,
        phase: 'reoptimize',
        round,
        title: 'Re-optimizing, looking for the closest feasible plan',
        lines: [
          `${TARGET_SCORE.toFixed(2)} cannot be reached inside the confidence, ceiling and instruction limits`,
          'Switching the objective to maximize score inside every limit',
          'The result will be flagged as short of the target',
        ],
        outcome: 'Searching for the highest feasible score',
        tone: 'warn',
        duration: 1700,
      })
      continue
    }

    relaxed = false
    steps.push({
      id: `reopt-${round}`,
      phase: 'reoptimize',
      round,
      title: 'Re-optimizing, adding the confidence limit',
      lines: [
        `Confidence ${sim.confidence}% is below the ${CONFIDENCE_FLOOR}% floor`,
        `The cheapest plan leans hard on a few items (effort ${candidate.effort.toFixed(2)}), which lowers confidence`,
        `Spreading the increase across more items to stay under effort ${effortLimit.toFixed(2)}`,
        'Sweeping the confidence weight and the pull back depth for the lowest spend that clears the limit',
      ],
      outcome: 'Re-solving with the confidence constraint',
      tone: 'warn',
      duration: 1800,
    })
  }

  const finalCandidate = final ?? candidates[candidates.length - 1]
  const finalSim = finalCandidate.sim
  const satisfied = runChecks(finalSim, directives).every((c) => c.pass)

  const headline = satisfied
    ? `Delivered a plan at ${finalSim.yearEnd.toFixed(2)} pts, ${Math.abs(finalSim.yearEnd - TARGET_SCORE).toFixed(2)} above the ${TARGET_SCORE.toFixed(2)} target`
    : `Closest feasible plan reaches ${finalSim.yearEnd.toFixed(2)} pts, ${Math.abs(TARGET_SCORE - finalSim.yearEnd).toFixed(2)} short of ${TARGET_SCORE.toFixed(2)}`

  steps.push({
    id: 'deliver',
    phase: 'deliver',
    round: candidates.length,
    title: satisfied ? 'Satisfied, delivering the plan' : 'Delivering the closest feasible plan',
    lines: [
      headline,
      `Spend ${fmtCost(finalSim.cost)} at ${finalSim.confidence}% confidence`,
      'Registering the plan in the plan selector',
    ],
    outcome: satisfied ? 'Plan added to your plans' : 'Plan added, flagged as short of target',
    tone: satisfied ? 'ok' : 'warn',
    duration: 1400,
    candidate: finalCandidate,
  })

  const moves = [...finalSim.changes].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 3)
  const summary = [
    `${headline}.`,
    ...(moves.length
      ? [`Biggest moves: ${moves.map((c) => `${c.name} ${c.month} ${pp(c.delta)}`).join(', ')}.`]
      : []),
    `Spend ${fmtCost(finalSim.cost)}, the lowest the model found, at ${finalSim.confidence}% confidence.`,
  ]

  const shortNames = directives.slice(0, 2).map(directiveLabel)
  const name = directives.length
    ? `Least spend, ${shortNames.join(' and ')}${directives.length > 2 ? ` +${directives.length - 2}` : ''}`
    : 'Least spend to target'
  const blurb = [
    `Cheapest way to reach ${TARGET_SCORE.toFixed(0)}`,
    directives.length ? `${directives.length} instruction${directives.length === 1 ? '' : 's'} applied` : null,
    satisfied ? null : 'Short of target',
  ]
    .filter(Boolean)
    .join('. ')

  return {
    directives,
    steps,
    totalMs: steps.reduce((s, st) => s + st.duration, 0),
    candidates,
    final: finalCandidate,
    satisfied,
    name,
    blurb: `${blurb}.`,
    summary,
  }
}
