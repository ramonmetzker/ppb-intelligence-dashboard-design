'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  BASE_PLAN,
  DEFAULT_SUGGESTION,
  SUGGESTIONS,
  SUGGESTION_RESULTS,
  clonePlan,
  matchSuggestion,
  simulate,
  type ItemKey,
  type Plan,
  type Simulation,
  type Suggestion,
} from '@/lib/ppb-model'

export type PlanOption = { suggestion: Suggestion; sim: Simulation }

type PlanState = {
  plan: Plan
  sim: Simulation
  /** The saved plan the shares currently equal, or undefined once the user edits them. */
  active: Suggestion | undefined
  planName: string
  /** The plan the shares started from, used for the reset action. */
  origin: Suggestion
  /** Every saved plan, newest first. Plans from the planner agent come before the built-in ones. */
  plans: PlanOption[]
  /** Ids of agent plans the user has not opened yet. */
  freshIds: string[]
  setShare: (key: ItemKey, open: 0 | 1, value: number) => void
  applySuggestion: (id: string) => void
  addPlan: (suggestion: Suggestion) => void
  resetItem: (key: ItemKey) => void
  resetToOrigin: () => void
  resetToForecast: () => void
}

const PlanContext = createContext<PlanState | null>(null)

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<Plan>(() => clonePlan(DEFAULT_SUGGESTION.plan))
  const [origin, setOrigin] = useState<Suggestion>(DEFAULT_SUGGESTION)
  const [agentPlans, setAgentPlans] = useState<PlanOption[]>([])
  const [freshIds, setFreshIds] = useState<string[]>([])

  const plans = useMemo(() => [...agentPlans, ...SUGGESTION_RESULTS], [agentPlans])
  const sim = useMemo(() => simulate(plan), [plan])
  const active = useMemo(
    () =>
      matchSuggestion(
        plan,
        plans.map((p) => p.suggestion),
      ),
    [plan, plans],
  )

  const setShare = useCallback((key: ItemKey, open: 0 | 1, value: number) => {
    const clamped = Math.min(100, Math.max(0, value))
    setPlan((prev) => {
      const next = clonePlan(prev)
      next[key][open] = clamped
      return next
    })
  }, [])

  const applySuggestion = useCallback(
    (id: string) => {
      const found = plans.find((p) => p.suggestion.id === id)?.suggestion
      if (!found) return
      setOrigin(found)
      setPlan(clonePlan(found.plan))
      setFreshIds((prev) => prev.filter((f) => f !== id))
    },
    [plans],
  )

  const addPlan = useCallback((suggestion: Suggestion) => {
    setAgentPlans((prev) => [{ suggestion, sim: simulate(suggestion.plan) }, ...prev])
    setFreshIds((prev) => [suggestion.id, ...prev])
  }, [])

  const resetItem = useCallback((key: ItemKey) => {
    setPlan((prev) => {
      const next = clonePlan(prev)
      next[key] = [...BASE_PLAN[key]]
      return next
    })
  }, [])

  const resetToOrigin = useCallback(() => setPlan(clonePlan(origin.plan)), [origin])
  const resetToForecast = useCallback(() => {
    setOrigin(SUGGESTIONS[0])
    setPlan(clonePlan(BASE_PLAN))
  }, [])

  const value = useMemo<PlanState>(
    () => ({
      plan,
      sim,
      active,
      planName: active?.name ?? 'Custom plan',
      origin,
      plans,
      freshIds,
      setShare,
      applySuggestion,
      addPlan,
      resetItem,
      resetToOrigin,
      resetToForecast,
    }),
    [
      plan,
      sim,
      active,
      origin,
      plans,
      freshIds,
      setShare,
      applySuggestion,
      addPlan,
      resetItem,
      resetToOrigin,
      resetToForecast,
    ],
  )

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}

export function usePlan() {
  const ctx = useContext(PlanContext)
  if (!ctx) throw new Error('usePlan must be used inside PlanProvider')
  return ctx
}
