'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  SALES_ASSIGNMENT_ROWS,
  type SalesAssignmentRow,
} from '@/lib/reference-bom-data'

export type SalesSplitDraft = {
  id: string
  newModel: string
  division: number
}

type SalesDemandContextValue = {
  salesRows: SalesAssignmentRow[]
  saveSplit: (parentId: string, drafts: readonly SalesSplitDraft[]) => void
  removeSplit: (parentId: string) => void
}

const SalesDemandContext = createContext<SalesDemandContextValue | null>(null)

function initialSalesRows() {
  return SALES_ASSIGNMENT_ROWS.map((row) => ({ ...row }))
}

export function SalesDemandProvider({ children }: { children: ReactNode }) {
  const [salesRows, setSalesRows] = useState<SalesAssignmentRow[]>(initialSalesRows)

  const saveSplit = useCallback((parentId: string, drafts: readonly SalesSplitDraft[]) => {
    setSalesRows((current) => current.map((row) => {
      if (row.id !== parentId) return row

      const children = drafts.map((draft) => ({
        id: draft.id,
        parentId: row.id,
        originalModel: row.originalModel,
        newModel: draft.newModel.trim(),
        referenceBom: 'Unassigned',
        division: draft.division,
        totalVolume: Math.round(row.totalVolume * draft.division / 100),
      }))

      return {
        ...row,
        newModel: `${children.length} submodels`,
        referenceBom: 'Assign per child',
        division: 100,
        children,
      }
    }))
  }, [])

  const removeSplit = useCallback((parentId: string) => {
    setSalesRows((current) => current.map((row) => {
      if (row.id !== parentId) return row
      return {
        ...row,
        newModel: row.originalModel,
        referenceBom: 'Unassigned',
        division: 100,
        children: undefined,
      }
    }))
  }, [])

  const value = useMemo(() => ({ salesRows, saveSplit, removeSplit }), [removeSplit, salesRows, saveSplit])

  return <SalesDemandContext.Provider value={value}>{children}</SalesDemandContext.Provider>
}

export function useSalesDemand() {
  const context = useContext(SalesDemandContext)
  if (!context) throw new Error('useSalesDemand must be used within SalesDemandProvider')
  return context
}
