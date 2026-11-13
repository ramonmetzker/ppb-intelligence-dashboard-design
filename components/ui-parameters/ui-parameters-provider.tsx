'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { UI_PARAMETER_SEED, type UiParameter, type UiParameterFormValues } from '@/lib/ui-parameters/data'

type UiParametersContextValue = {
  parameters: readonly UiParameter[]
  addParameter: (values: UiParameterFormValues) => void
  updateParameter: (id: string, values: UiParameterFormValues) => void
  updateParameterOrders: (updates: readonly { id: string; order: number }[]) => void
  removeParameters: (ids: string[]) => void
  updateParameters: (ids: string[], values: Partial<Pick<UiParameter, 'display' | 'collapse'>>) => void
}

const UiParametersContext = createContext<UiParametersContextValue | null>(null)

export function UiParametersProvider({ children }: { children: ReactNode }) {
  const [parameters, setParameters] = useState<readonly UiParameter[]>(UI_PARAMETER_SEED)

  const addParameter = useCallback((values: UiParameterFormValues) => {
    setParameters((current) => [
      ...current,
      { ...values, id: `${values.itemId}-${values.year}-${Date.now()}` },
    ])
  }, [])

  const updateParameter = useCallback((id: string, values: UiParameterFormValues) => {
    setParameters((current) => current.map((parameter) => parameter.id === id ? { ...parameter, ...values } : parameter))
  }, [])

  const updateParameterOrders = useCallback((updates: readonly { id: string; order: number }[]) => {
    const orders = new Map(updates.map(({ id, order }) => [id, order]))
    setParameters((current) => current.map((parameter) => {
      const order = orders.get(parameter.id)
      return order === undefined ? parameter : { ...parameter, order }
    }))
  }, [])

  const removeParameters = useCallback((ids: string[]) => {
    const removedIds = new Set(ids)
    setParameters((current) => current.filter((parameter) => !removedIds.has(parameter.id)))
  }, [])

  const updateParameters = useCallback((ids: string[], values: Partial<Pick<UiParameter, 'display' | 'collapse'>>) => {
    const updatedIds = new Set(ids)
    setParameters((current) => current.map((parameter) => updatedIds.has(parameter.id) ? { ...parameter, ...values } : parameter))
  }, [])

  const value = useMemo(
    () => ({ parameters, addParameter, updateParameter, updateParameterOrders, removeParameters, updateParameters }),
    [parameters, addParameter, updateParameter, updateParameterOrders, removeParameters, updateParameters],
  )

  return <UiParametersContext.Provider value={value}>{children}</UiParametersContext.Provider>
}

export function useUiParameters() {
  const context = useContext(UiParametersContext)
  if (!context) throw new Error('useUiParameters must be used inside UiParametersProvider')
  return context
}
