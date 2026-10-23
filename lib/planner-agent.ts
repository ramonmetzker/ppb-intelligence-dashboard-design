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
  type ItemKey,
  type Plan,
  type Simulation,
} from '@/lib/ppb-model'

/* -------------------------------------------------------------------------- */
/* Parameters                                                                  */
/* -------------------------------------------------------------------------- */

export type Objective = 'min-cost' | 'max-score'

export type AgentParams = {
  objective: Objective
  /** Points the plan must clear above the required score. */
  margin: number
  /** Spend cap in $K. */
  budget: number
  /** Lowest acceptable model confidence, percent. */
  confidenceFloor: number
  locked: ItemKey[]
  months: 'both' | 'dec'
}

export const DEFAULT_PARAMS: AgentParams = {
  objective: 'min-cost',
  margin: 4,
  budget: 3000,
  confidenceFloor: 70,
  locked: [],
  months: 'both',
}

export const LIMITS = {
  margin: [0, 18],
  budget: [300, 6000],
  confidenceFloor: [60, 85],
} as const

export const targetScore = (p: AgentParams) => REQUIRED_SCORE + p.margin

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

type Entry = {
  key: ItemKey
  open: 0 | 1
  /** Points of year-end score earned per percentage point of local share. */
  gain: number
  /** Spend in $K per percentage point. */
  cost: number
  /** Confidence effort per percentage point. */
  inv: number
  /** Largest increase suppliers can deliver, in percentage points. */
  cap: number
}

const STEP = 0.5
const floorStep = (n: number) => Math.floor(n / STEP + 1e-9) * STEP
const ceilStep = (n: number) => Math.ceil(n / STEP - 1e-9) * STEP

/** Confidence is BASE_CONFIDENCE minus 4 per unit of effort, so this is the effort budget. */
const effortLimit = (floor: number) => Math.max(0, (BASE_CONFIDENCE - floor) / 4)

function buildEntries(params: AgentParams): Entry[] {
  const entries: Entry[] = []
  ITEMS.forEach((item) => {
    if (params.locked.includes(item.key)) return
    ;([0, 1] as const).forEach((open) => {
      if (params.months === 'dec' && open === 0) return
      const probe = clonePlan(BASE_PLAN)
      probe[item.key][open] += 5
      const gain = (simulate(probe).yearEnd - BASELINE.yearEnd) / 5
      entries.push({
        key: item.key,
        open,
        gain,
        cost: item.costPerPp,
        inv: 1 / item.headroom,
        cap: floorStep(ceilingFor(item.key, open) - BASE_PLAN[item.key][open]),
      })
    })
  })
  return entries
}

type FillOptions = {
  objective: Objective
  lambda: number
  integer: boolean
  effortCap: number
  need: number
  budget: number
}

function fill(entries: Entry[], o: FillOptions) {
  const rank = (e: Entry) => e.gain / (e.cost + o.lambda * e.inv)
  const sorted = [...entries].sort((a, b) => rank(b) - rank(a))
  const plan = clonePlan(BASE_PLAN)
  // The simulation rounds to two decimals, so aim a hair past the target.
  let remaining = o.need + 0.006
  let budgetLeft = o.budget
  let effortLeft = o.effortCap

  for (const e of sorted) {
    let pp: number
    if (o.objective === 'min-cost') {
      const wanted = remaining / e.gain
      const limit = Math.min(e.cap, effortLeft / e.inv)
      pp = o.integer ? Math.min(ceilStep(wanted), floorStep(limit)) : Math.min(wanted, limit)
    } else {
      const limit = Math.min(e.cap, budgetLeft / e.cost, effortLeft / e.inv)
      pp = o.integer ? floorStep(limit) : limit
    }
    if (!(pp > 1e-6)) continue
    plan[e.key][e.open] += pp
    effortLeft -= pp * e.inv
    budgetLeft -= pp * e.cost
    remaining -= pp * e.gain
    if (o.objective === 'min-cost' && remaining <= 1e-6) break
  }
  return plan
}

const effortOf = (plan: Plan) =>
  ITEMS.reduce(
    (sum, i) =>
      sum +
      ([0, 1] as const).reduce<number>(
        (s, m) => s + Math.min(1.5, Math.max(0, plan[i.key][m] - BASE_PLAN[i.key][m]) / i.headroom),
        0,
      ),
    0,
  )

export type Probe = {
  lambda: number
  score: number
  cost: number
  effort: number
  feasible: boolean
}

const LAMBDA_GRID = [0, 150, 300, 600, 1200, 2400, 4800, 9600, 19200, 60000]

type RoundSolution = {
  plan: Plan
  sim: Simulation
  probes: Probe[]
  chosen: number
  /** True when no probe could reach the target inside the constraints. */
  unreachable: boolean
}

function solveRound(
  entries: Entry[],
  params: AgentParams,
  opts: { objective: Objective; relaxed: boolean; integer: boolean; tighten: number },
): RoundSolution {
  const need = targetScore(params) - BASELINE.yearEnd
  const effortCap = opts.relaxed
    ? Number.POSITIVE_INFINITY
    : Math.max(0, effortLimit(params.confidenceFloor) - opts.tighten)
  const grid = opts.relaxed ? [0] : LAMBDA_GRID

  const probes: Probe[] = []
  const plans: Plan[] = []
  grid.forEach((lambda) => {
    const plan = fill(entries, {
      objective: opts.objective,
      lambda,
      integer: opts.integer,
      effortCap,
      need,
      budget: params.budget,
    })
    const sim = simulate(plan)
    plans.push(plan)
    probes.push({
      lambda,
      score: sim.yearEnd,
      cost: sim.cost,
      effort: effortOf(plan),
      feasible: sim.yearEnd + 0.004 >= targetScore(params),
    })
  })

  let chosen = 0
  if (opts.objective === 'min-cost') {
    const ok = probes.map((p, i) => ({ p, i })).filter(({ p }) => p.feasible)
    if (ok.length > 0) {
      chosen = ok.sort((a, b) => a.p.cost - b.p.cost || a.p.effort - b.p.effort)[0].i
    } else {
      chosen = probes.map((p, i) => ({ p, i })).sort((a, b) => b.p.score - a.p.score)[0].i
    }
  } else {
    chosen = probes
      .map((p, i) => ({ p, i }))
      .sort((a, b) => b.p.score - a.p.score || a.p.cost - b.p.cost)[0].i
  }

  return {
    plan: plans[chosen],
    sim: simulate(plans[chosen]),
    probes,
    chosen,
    unreachable: !probes.some((p) => p.feasible),
  }
}

/* -------------------------------------------------------------------------- */
/* Checks                                                                      */
/* -------------------------------------------------------------------------- */

export type CheckRow = {
  id: 'score' | 'budget' | 'confidence' | 'ceiling' | 'locked'
  label: string
  actual: string
  limit: string
  pass: boolean
}

function runChecks(sim: Simulation, params: AgentParams): CheckRow[] {
  const target = targetScore(params)
  const rows: CheckRow[] = [
    {
      id: 'score',
      label: 'Year-end score',
      actual: sim.yearEnd.toFixed(2),
      limit: `\u2265 ${target.toFixed(2)}`,
      pass: sim.yearEnd + 0.004 >= target,
    },
    {
      id: 'budget',
      label: 'Spend',
      actual: fmtCost(sim.cost),
      limit: `\u2264 ${fmtCost(params.budget)}`,
      pass: sim.cost <= params.budget,
    },
    {
      id: 'confidence',
      label: 'Model confidence',
      actual: `${sim.confidence}%`,
      limit: `\u2265 ${params.confidenceFloor}%`,
      pass: sim.confidence >= params.confidenceFloor,
    },
    {
      id: 'ceiling',
      label: 'Supplier ceilings',
      actual: `${sim.overCeiling.length} above`,
      limit: '0 above',
      pass: sim.overCeiling.length === 0,
    },
  ]
  if (params.locked.length > 0) {
    const touched = sim.changes.filter((c) => params.locked.includes(c.key)).length
    rows.push({
      id: 'locked',
      label: 'Locked items',
      actual: touched === 0 ? 'untouched' : `${touched} changed`,
      limit: params.locked.map((k) => ITEM_BY_KEY[k].name).join(', '),
      pass: touched === 0,
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
  params: AgentParams
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

function convergence(from: number, to: number, count: number) {
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 1) / count
    return from + (to - from) * (1 - Math.pow(1 - t, 2.4))
  })
}

function lpLines(final: number, objective: Objective, rows: number, cols: number): string[] {
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

function mipLines(lp: number, final: number, objective: Objective, vars: number): string[] {
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

export function runAgent(params: AgentParams): AgentRun {
  const entries = buildEntries(params)
  const vars = entries.length
  const target = targetScore(params)
  const steps: AgentStep[] = []
  const candidates: Candidate[] = []
  const gapNow = BASELINE.yearEnd - REQUIRED_SCORE

  const lockedNames = params.locked.map((k) => ITEM_BY_KEY[k].name)
  const ranked = [...entries].sort((a, b) => b.gain / b.cost - a.gain / a.cost)

  /* ---- Round 0: read the scenario ---- */
  steps.push({
    id: 'analyze',
    phase: 'analyze',
    round: 0,
    title: 'Analyzing the current scenario',
    lines: [
      `Forecast closes at ${BASELINE.yearEnd.toFixed(2)}, ${Math.abs(gapNow).toFixed(2)} pts ${gapNow < 0 ? 'short of' : 'above'} the ${REQUIRED_SCORE} requirement`,
      `Target for this run: ${target.toFixed(2)} (${params.margin >= 0 ? '+' : ''}${params.margin.toFixed(1)} over required)`,
      `${vars} decision variables: ${params.months === 'dec' ? 'December only' : 'November and December'}${lockedNames.length ? `, ${lockedNames.join(' and ')} locked` : ''}`,
      `Objective: ${params.objective === 'min-cost' ? 'minimize spend while clearing the target' : 'maximize score inside the budget'}`,
      ...ranked
        .slice(0, 3)
        .map(
          (e) =>
            `${ITEM_BY_KEY[e.key].name} ${OPEN_MONTHS[e.open]}: ${e.gain.toFixed(3)} pts per pp at ${fmtCost(e.cost)} per pp`,
        ),
    ],
    outcome: `${vars} variables and 4 constraint families identified`,
    tone: 'neutral',
    duration: 2000,
  })

  /* ---- Rounds ---- */
  type Plannedround = {
    label: string
    relaxed: boolean
    integer: boolean
    objective: Objective
    tighten: number
  }

  let objective = params.objective
  let relaxed = true
  let integer = false
  let tighten = 0
  let round = 0
  let lastLpValue = 0
  let final: Candidate | null = null
  let satisfied = false
  let closest = false

  const valueOf = (sim: Simulation, obj: Objective) => (obj === 'min-cost' ? sim.cost : sim.yearEnd)

  for (round = 1; round <= 5; round++) {
    const plannedRound: Plannedround = {
      label: integer
        ? 'Integer rounding'
        : relaxed
          ? 'Relaxed solve'
          : closest
            ? 'Closest feasible'
            : 'Constrained solve',
      relaxed,
      integer,
      objective,
      tighten,
    }
    const solution = solveRound(entries, params, plannedRound)
    const sim = solution.sim
    const candidate: Candidate = {
      round,
      label: plannedRound.label,
      plan: solution.plan,
      sim,
      effort: effortOf(solution.plan),
    }
    candidates.push(candidate)

    const rows = 4 + vars
    const constraintCount = 1 + 1 + (plannedRound.relaxed ? 0 : 1) + vars
    const cols = vars

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
              `constraints: ${constraintCount} (score target, budget, ${vars} supplier ceilings)`,
              'confidence constraint left out so the first pass shows the unconstrained optimum',
              `objective: ${params.objective === 'min-cost' ? 'min spend' : 'max score'}`,
            ]
          : [
              `variables: ${vars}${plannedRound.integer ? ' (now integer, 0.5 pp steps)' : ''}`,
              `constraints: ${constraintCount}${plannedRound.relaxed ? '' : ' including the confidence limit'}`,
              plannedRound.relaxed
                ? 'no change to constraints'
                : `confidence floor ${params.confidenceFloor}% caps total effort at ${(effortLimit(params.confidenceFloor) - tighten).toFixed(2)}`,
              closest ? 'objective switched to max score inside the limits' : 'objective unchanged',
            ],
      outcome: `${constraintCount} constraints loaded`,
      tone: 'neutral',
      duration: round === 1 ? 1300 : 800,
    })

    /* solve */
    const finalValue = valueOf(sim, plannedRound.objective)
    const solveLines = plannedRound.integer
      ? mipLines(lastLpValue || finalValue, finalValue, plannedRound.objective, vars)
      : lpLines(finalValue, plannedRound.objective, rows, cols)
    if (!plannedRound.relaxed && !plannedRound.integer) {
      const shown = solution.probes.filter((_, i) => i % 3 === 0 || i === solution.chosen).slice(0, 4)
      solveLines.splice(
        1,
        0,
        ...shown.map(
          (p) =>
            `probe  confidence weight ${num(p.lambda, 0)}  effort ${p.effort.toFixed(2)}  score ${p.score.toFixed(2)}  spend ${fmtCost(p.cost)}`,
        ),
      )
    }
    steps.push({
      id: `solve-${round}`,
      phase: 'solve',
      round,
      title: plannedRound.integer ? 'Solving, branch and bound' : 'Solving the relaxation',
      lines: solveLines,
      outcome: `Candidate ${round}: ${sim.yearEnd.toFixed(2)} pts for ${fmtCost(sim.cost)}`,
      tone: 'neutral',
      duration: plannedRound.integer ? 1900 : 1700,
      candidate,
    })
    if (!plannedRound.integer) lastLpValue = finalValue

    /* check */
    const checks = runChecks(sim, params)
    const failed = checks.filter((c) => !c.pass)
    // The score is a hard limit only while minimizing spend. When maximizing, or once the
    // agent falls back to the closest plan, it is the goal and cannot block delivery.
    const scoreIsHard = params.objective === 'min-cost' && !closest
    const blocking = failed.filter((c) => c.id !== 'score' || scoreIsHard)
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
    if (blocking.length === 0 && integer) {
      final = candidate
      satisfied = failed.length === 0
      break
    }
    if (round === 5) {
      final = candidate
      satisfied = failed.length === 0
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

    const onlyRounding = integer
    if (onlyRounding) {
      tighten += 0.08
      steps.push({
        id: `reopt-${round}`,
        phase: 'reoptimize',
        round,
        title: 'Re-optimizing, tightening the limits',
        lines: [
          `Rounding pushed ${failedIds.join(' and ')} outside the limit`,
          `Lowering the effort cap by 0.08 to leave room for the integer steps`,
        ],
        outcome: 'Re-solving with a safety margin',
        tone: 'warn',
        duration: 1500,
      })
      continue
    }

    const needsFallback =
      scoreIsHard &&
      (failedIds.includes('budget') ||
        (failedIds.includes('score') && !failedIds.includes('confidence')))
    if (needsFallback) {
      closest = true
      objective = 'max-score'
      relaxed = false
      steps.push({
        id: `reopt-${round}`,
        phase: 'reoptimize',
        round,
        title: 'Re-optimizing, looking for the closest feasible plan',
        lines: [
          failedIds.includes('budget')
            ? `${target.toFixed(2)} costs ${fmtCost(sim.cost)}, above the ${fmtCost(params.budget)} cap`
            : `${target.toFixed(2)} cannot be reached inside the confidence and supplier limits`,
          'Switching the objective to maximize score inside every limit',
          'The result will be flagged as short of the target',
        ],
        outcome: 'Searching for the highest feasible score',
        tone: 'warn',
        duration: 1700,
      })
      integer = false
      continue
    }

    /* confidence failed: add the constraint */
    relaxed = false
    steps.push({
      id: `reopt-${round}`,
      phase: 'reoptimize',
      round,
      title: 'Re-optimizing, adding the confidence limit',
      lines: [
        `Confidence ${sim.confidence}% is below the ${params.confidenceFloor}% floor`,
        `The cheapest plan leans hard on a few items (effort ${candidate.effort.toFixed(2)}), which lowers confidence`,
        `Spreading the increase across more items to stay under effort ${effortLimit(params.confidenceFloor).toFixed(2)}`,
        'Sweeping the confidence weight to find the lowest-cost plan that clears the limit',
      ],
      outcome: 'Re-solving with the confidence constraint',
      tone: 'warn',
      duration: 1800,
    })
  }

  const finalCandidate = final ?? candidates[candidates.length - 1]
  const finalSim = finalCandidate.sim
  const finalChecks = runChecks(finalSim, params)
  const allPass = finalChecks.every((c) => c.pass)
  satisfied = allPass

  const headline = satisfied
    ? `Delivered a plan at ${finalSim.yearEnd.toFixed(2)} pts, ${Math.abs(finalSim.yearEnd - target).toFixed(2)} above your ${target.toFixed(2)} target`
    : `Closest feasible plan reaches ${finalSim.yearEnd.toFixed(2)} pts, ${Math.abs(target - finalSim.yearEnd).toFixed(2)} short of ${target.toFixed(2)}`

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

  const biggest = [...finalSim.changes].sort((a, b) => b.delta - a.delta).slice(0, 3)
  const summary = [
    headline + '.',
    ...(biggest.length
      ? [
          `Biggest moves: ${biggest
            .map((c) => `${c.name} ${c.month} ${c.delta >= 0 ? '+' : ''}${c.delta.toFixed(1)} pp`)
            .join(', ')}.`,
        ]
      : []),
    `Spend ${fmtCost(finalSim.cost)} against a ${fmtCost(params.budget)} cap, confidence ${finalSim.confidence}%.`,
  ]

  const nameBase = params.objective === 'min-cost' ? 'Lowest spend' : 'Best score'
  const blurbParts = [
    params.objective === 'min-cost'
      ? `Cheapest way to reach ${target.toFixed(1)}`
      : `Highest score inside ${fmtCost(params.budget)}`,
    lockedNames.length ? `${lockedNames.join(', ')} locked` : null,
    params.months === 'dec' ? 'December only' : null,
    satisfied ? null : 'Short of target',
  ].filter(Boolean)

  return {
    params,
    steps,
    totalMs: steps.reduce((s, st) => s + st.duration, 0),
    candidates,
    final: finalCandidate,
    satisfied,
    name: `${nameBase}, +${params.margin.toFixed(0)}`,
    blurb: `${blurbParts.join('. ')}.`,
    summary,
  }
}
