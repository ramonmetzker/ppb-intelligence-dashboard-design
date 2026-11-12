import { ITEMS, OPEN_MONTHS, type ItemKey } from '@/lib/ppb-model'
import { directiveId, directiveLabel, type Directive, type DirectiveKind } from '@/lib/planner-agent'

export type ParsedRequest = {
  /** Instructions found in the message, one per item and month. */
  directives: Directive[]
  /** Short labels shown back to the user. */
  notes: string[]
  reset: boolean
  wantsRun: boolean
  asksWhy: boolean
}

const ITEM_ALIASES: Record<ItemKey, RegExp> = {
  memory: /\bmemory\b|\bmemories\b|\bram\b/,
  battery: /\bbatter(?:y|ies)\b/,
  adapter: /\badapters?\b|\bchargers?\b/,
  pba: /\bpba\b|\bpba\s*assy\b/,
  mainBoard: /\bmain\s*boards?\b|\bmainboards?\b|\bmotherboards?\b|\bmain\b/,
  inspProcess: /\binsp(?:ection)?\.?\s*process(?:es)?\b|\bprocess\s*inspection\b/,
  rfid: /\brfid\b/,
}

const MONTH_ALIASES: Record<0 | 1, RegExp> = {
  0: /\bnov(?:ember)?\b/,
  1: /\bdec(?:ember)?\b/,
}

/** Checked in this order, so "minimize" never reads as "max". */
const VERBS: [DirectiveKind, RegExp][] = [
  ['hold', /\b(keep|hold|freeze|lock|untouched|unchanged|leave|as is|stay)\b|\bdo(?: not|n'?t) touch\b/],
  ['min', /\b(min(?:imi[sz]e)?|lowest|eliminate|zero|import only|all imported|fully imported)\b/],
  ['max', /\b(max(?:imi[sz]e)?|highest|as much as possible|all[- ]in|full|ceiling)\b/],
  ['lower', /\b(decrease|reduce|lower|less|cut|shrink|fewer|pull back|scale back|down)\b/],
  ['raise', /\b(increase|raise|more|boost|push|grow|higher|add|expand|lift|up)\b/],
]

const REASON = /\b(?:due to|because(?: of)?|since|given|thanks to)\b\s*(.+)$/
const PRICE_NOTE = /\b(?:better|cheaper|lower|good|great|attractive|improved|worse|higher|rising)\s+pric(?:e|es|ing)\b/
const RESET = /\b(reset|clear|start over|forget (?:it|that|everything)|remove (?:all|everything)|no instructions)\b/
const WHY = /\b(why|explain|how come|what changed|justify|reasoning)\b/
const RUN = /\b(run|go|start|simulate|optimi[sz]e|again|redo|rerun|find|build|plan|try|cheapest|reach|do it)\b/

type Clause = { kind?: DirectiveKind; items: ItemKey[]; months: (0 | 1)[]; amount?: number }

function readClause(text: string): Clause {
  const kind = VERBS.find(([, re]) => re.test(text))?.[0]
  const items = ITEMS.filter((i) => ITEM_ALIASES[i.key].test(text)).map((i) => i.key)
  const months = ([0, 1] as const).filter((m) => MONTH_ALIASES[m].test(text))
  const amount = text.match(/(\d+(?:\.\d+)?)\s*(?:pp|pts?|points?|percent|%)/)
  return { kind, items, months, amount: amount ? Math.min(20, Number(amount[1])) : undefined }
}

export function parseRequest(text: string): ParsedRequest {
  const lower = text.toLowerCase().replace(/\s+/g, ' ').trim()
  const reasonMatch = lower.match(REASON)
  const priceMatch = lower.match(PRICE_NOTE)
  const reason = reasonMatch
    ? reasonMatch[1].replace(/[.!?]+$/, '').slice(0, 60)
    : priceMatch
      ? priceMatch[0]
      : undefined
  // The reason is kept for the reply, but its words ("lower pricing") must not read as instructions.
  const body = (reasonMatch ? lower.slice(0, reasonMatch.index) : lower).replace(PRICE_NOTE, ' ')

  const reset = RESET.test(lower)
  const clauses: Clause[] = []
  body
    .split(/[.;\n]/)
    .flatMap((sentence) => sentence.split(/,|\band\b|\bthen\b|\balso\b|\bplus\b|\bbut\b/))
    .map((c) => c.trim())
    .filter(Boolean)
    .forEach((chunk) => {
      const clause = readClause(chunk)
      const previous = clauses[clauses.length - 1]
      const monthOnly = !clause.kind && clause.items.length === 0 && clause.months.length > 0
      if (monthOnly && previous) {
        previous.months = Array.from(new Set([...previous.months, ...clause.months]))
        return
      }
      if (!clause.kind && clause.items.length > 0 && previous?.kind) {
        clause.kind = previous.kind
        clause.amount ??= previous.amount
        // "maximize battery and adapter in december": the month belongs to both items.
        if (previous.months.length === 0 && clause.months.length > 0) previous.months = clause.months
      }
      clauses.push(clause)
    })

  const directives = new Map<string, Directive>()
  const touched = new Set<ItemKey>()
  clauses.forEach((c) => {
    if (!c.kind || c.items.length === 0) return
    const months = c.months.length > 0 ? c.months : ([0, 1] as const)
    c.items.forEach((item) => {
      touched.add(item)
      months.forEach((open) => {
        directives.set(directiveId(item, open), {
          id: directiveId(item, open),
          kind: c.kind!,
          item,
          open,
          amount: c.kind === 'raise' || c.kind === 'lower' ? (c.amount ?? 3) : undefined,
          reason,
        })
      })
    })
  })

  // "keep everything else untouched" holds every item that was not named.
  const restClause = clauses.find((c) => c.kind === 'hold' && /\b(everything else|the rest|all others|other items|all else)\b/.test(body))
  if (restClause) {
    const months = restClause.months.length > 0 ? restClause.months : ([0, 1] as const)
    ITEMS.filter((i) => !touched.has(i.key)).forEach((i) =>
      months.forEach((open) =>
        directives.set(directiveId(i.key, open), {
          id: directiveId(i.key, open),
          kind: 'hold',
          item: i.key,
          open,
        }),
      ),
    )
  }

  const found = Array.from(directives.values())
  return {
    directives: found,
    notes: found.map(directiveLabel),
    reset,
    wantsRun: found.length > 0 || RUN.test(lower) || reset,
    asksWhy: WHY.test(lower) && found.length === 0,
  }
}

/** Newer instructions replace older ones for the same item and month. */
export function mergeDirectives(current: Directive[], incoming: Directive[], reset: boolean) {
  const map = new Map<string, Directive>()
  if (!reset) current.forEach((d) => map.set(d.id, d))
  incoming.forEach((d) => map.set(d.id, d))
  return Array.from(map.values())
}

export const HELP_REPLY = `The goal is fixed: reach the target at the lowest spend. Tell me where to push or pull local share, for example "maximize local battery in December" or "increase local memory in ${OPEN_MONTHS[0]}, better pricing".`

export const QUICK_PROMPTS = [
  'Find the cheapest plan',
  'Maximize local battery in December',
  'Increase local memory in November, better pricing',
  'Keep adapter untouched, reduce main board in November',
]
