import { ITEMS, REQUIRED_SCORE, fmtCost, type ItemKey } from '@/lib/ppb-model'
import { DEFAULT_PARAMS, LIMITS, type AgentParams } from '@/lib/planner-agent'

export type ParsedRequest = {
  params: AgentParams
  /** Human readable list of what changed, shown back to the user. */
  notes: string[]
  changed: boolean
  wantsRun: boolean
}

const clamp = (n: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, n))

const ITEM_ALIASES: Record<ItemKey, RegExp> = {
  memory: /\bmemory|\bmemories|\bram\b/,
  battery: /\bbatter(?:y|ies)\b/,
  adapter: /\badapters?\b|\bchargers?\b/,
  pba: /\bpba\b/,
  mainBoard: /\bmain\s*boards?\b|\bmainboards?\b|\bmotherboards?\b/,
}

const LOCK_VERB = /\b(lock|locked|keep|freeze|frozen|protect|untouched|do not touch|don't touch|dont touch|leave|exclude|without)\b/
const RUN_WORDS = /\b(run|go|start|simulate|optimi[sz]e|try|again|plan|reach|find|build|give|make|redo|rerun)\b/

export function parseRequest(text: string, current: AgentParams): ParsedRequest {
  const t = text.toLowerCase()
  let params: AgentParams = { ...current, locked: [...current.locked] }
  const notes: string[] = []

  if (/\b(reset|defaults?|start over|from scratch)\b/.test(t)) {
    params = { ...DEFAULT_PARAMS, locked: [] }
    notes.push('Back to the default brief')
  }

  const target = t.match(/\b(?:reach|hit|target|get to|at least|above)\s+(\d{3}(?:\.\d+)?)/)
  const margin = t.match(/\b(?:margin|buffer|cushion)\D{0,10}(\d+(?:\.\d+)?)|\+\s*(\d+(?:\.\d+)?)\s*(?:pts?|points?)?/)
  if (target) {
    params.margin = clamp(Number(target[1]) - REQUIRED_SCORE, LIMITS.margin)
    notes.push(
      `Target ${(REQUIRED_SCORE + params.margin).toFixed(0)} (+${params.margin.toFixed(1)} over required)`,
    )
  } else if (margin) {
    params.margin = clamp(Number(margin[1] ?? margin[2]), LIMITS.margin)
    notes.push(`Margin +${params.margin.toFixed(1)} over required`)
  }

  const money = t.match(/\$\s*(\d+(?:\.\d+)?)\s*(m|k|million|thousand)?|\b(\d+(?:\.\d+)?)\s*(m|k|million|thousand)\b/)
  if (money) {
    const value = Number(money[1] ?? money[3])
    const unit = (money[2] ?? money[4] ?? (value < 100 ? 'm' : 'k')).charAt(0)
    params.budget = clamp(unit === 'm' ? value * 1000 : value, LIMITS.budget)
    notes.push(`Spend cap ${fmtCost(params.budget)}`)
  }

  const confidence = t.match(/confidence\D{0,14}(\d{2})|(\d{2})\s*%\s*confidence/)
  if (confidence) {
    params.confidenceFloor = clamp(Number(confidence[1] ?? confidence[2]), LIMITS.confidenceFloor)
    notes.push(`Confidence floor ${params.confidenceFloor}%`)
  }

  if (/\b(max(?:imi[sz]e)?(?: the)? score|best score|highest score|as high as)\b/.test(t)) {
    params.objective = 'max-score'
    notes.push('Maximize score inside the budget')
  } else if (/\b(min(?:imi[sz]e)?(?: the)? (?:cost|spend)|cheapest|lowest (?:cost|spend)|least)\b/.test(t)) {
    params.objective = 'min-cost'
    notes.push('Minimize spend')
  }

  if (/\b(dec(?:ember)? only|only dec(?:ember)?|just dec(?:ember)?)\b/.test(t)) {
    params.months = 'dec'
    notes.push('December only')
  } else if (/\b(both months|nov(?:ember)? (?:and|&|\+) dec(?:ember)?|november too)\b/.test(t)) {
    params.months = 'both'
    notes.push('November and December')
  }

  if (/\b(unlock (?:all|everything)|nothing locked|no locks)\b/.test(t)) {
    params.locked = []
    notes.push('Everything unlocked')
  } else {
    const added: ItemKey[] = []
    t.split(/[.;\n]/).forEach((segment) => {
      if (!LOCK_VERB.test(segment)) return
      ITEMS.forEach((item) => {
        if (ITEM_ALIASES[item.key].test(segment) && !added.includes(item.key)) added.push(item.key)
      })
    })
    if (added.length) {
      params.locked = Array.from(new Set([...params.locked, ...added]))
      notes.push(`Locked ${added.map((k) => ITEMS.find((i) => i.key === k)?.name).join(' and ')}`)
    }
  }

  const changed = notes.length > 0
  return { params, notes, changed, wantsRun: changed || RUN_WORDS.test(t) }
}

export const HELP_REPLY =
  'I can change the target, the spend cap, the confidence floor, which items to lock and which months to use. Try "reach 672 under $2M" or "lock Memory, December only".'

export const QUICK_PROMPTS = [
  'Reach 670 under $2M',
  'Maximize score, keep confidence above 75%',
  'Lock Memory, December only',
  'Run it again with a +10 margin',
]
