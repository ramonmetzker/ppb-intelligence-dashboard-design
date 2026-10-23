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
  clonePlan,
  matchSuggestion,
  simulate,
  type ItemKey,
  type Plan,
  type Simulation,
  type Suggestion,
} from '@/lib/ppb-model'

type PlanState = {
  plan: Plan
  sim: Simulation
  /** The suggestion the plan currently equals, or undefined once the user edits it. */
  active: Suggestion | undefined
  planName: string
  /** The suggestion the plan started from, used for the reset action. */
  origin: Suggestion
  setShare: (key: ItemKey, open: 0 | 1, value: number) => void
  applySuggestion: (id: string) => void
  resetItem: (key: ItemKey) => void
  resetToOrigin: () => void
  resetToForecast: () => void
}

const PlanContext = createContext<PlanState | null>(null)

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<Plan>(() => clonePlan(DEFAULT_SUGGESTION.plan))
  const [origin, setOrigin] = useState<Suggestion>(DEFAULT_SUGGESTION)

  const sim = useMemo(() => simulate(plan), [plan])
  const active = useMemo(() => matchSuggestion(plan), [plan])

  const setShare = useCallback((key: ItemKey, open: 0 | 1, value: number) => {
    const clamped = Math.min(100, Math.max(0, value))
    setPlan((prev) => {
      const next = clonePlan(prev)
      next[key][open] = clamped
      return next
    })
  }, [])

  const applySuggestion = useCallback((id: string) => {
    const found = SUGGESTIONS.find((s) => s.id === id)
    if (!found) return
    setOrigin(found)
    setPlan(clonePlan(found.plan))
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
      setShare,
      applySuggestion,
      resetItem,
      resetToOrigin,
      resetToForecast,
    }),
    [plan, sim, active, origin, setShare, applySuggestion, resetItem, resetToOrigin, resetToForecast],
  )

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}

export function usePlan() {
  const ctx = useContext(PlanContext)
  if (!ctx) throw new Error('usePlan must be used inside PlanProvider')
  return ctx
}
