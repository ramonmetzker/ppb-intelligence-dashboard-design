'use client'

import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { RPA_SEED, type Rpa } from '@/lib/rpa/data'

type RpaContextValue = {
  rows: Rpa[]
  setRows: Dispatch<SetStateAction<Rpa[]>>
  errorCount: number
}

const RpaContext = createContext<RpaContextValue | null>(null)

/** Shared RPA monitor state so the table and its sidebar counter stay in sync. */
export function RpaProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<Rpa[]>(() => [...RPA_SEED])
  const errorCount = rows.filter((row) => row.status === 'failed').length
  const value = useMemo(() => ({ rows, setRows, errorCount }), [rows, errorCount])

  return <RpaContext.Provider value={value}>{children}</RpaContext.Provider>
}

export function useRpas() {
  const context = useContext(RpaContext)
  if (!context) throw new Error('useRpas must be used within RpaProvider')
  return context
}
