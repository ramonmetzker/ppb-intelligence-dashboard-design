'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { UI_PARAMETER_SEED, type UiParameter, type UiParameterFormValues } from '@/lib/ui-parameters/data'

type UiParametersContextValue = {
  parameters: readonly UiParameter[]
  addParameter: (values: UiParameterFormValues) => void
  updateParameter: (id: string, values: UiParameterFormValues) => void
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

  const value = useMemo(() => ({ parameters, addParameter, updateParameter }), [parameters, addParameter, updateParameter])

  return <UiParametersContext.Provider value={value}>{children}</UiParametersContext.Provider>
}

export function useUiParameters() {
  const context = useContext(UiParametersContext)
  if (!context) throw new Error('useUiParameters must be used inside UiParametersProvider')
  return context
}
