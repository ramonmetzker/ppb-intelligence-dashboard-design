'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ItemKey } from '@/lib/ppb-model'
import { useNotifications } from '@/components/shell/notification-provider'
import {
  applyPreview,
  classifyMaterial,
  editEntry as editEntryInBook,
  seedBook,
  type Origin,
  type PriceBook,
  type UploadPreview,
} from '@/lib/material-store'

export type ImportSummary = { added: number; updated: number; fileName: string }

type MaterialsContext = {
  book: PriceBook
  lastImport: ImportSummary | null
  dismissImport: () => void
  applyUpload: (preview: UploadPreview) => ImportSummary
  editEntry: (id: string, price: number, origin: Origin) => void
  classify: (code: string, item: ItemKey | null) => void
}

const Context = createContext<MaterialsContext | null>(null)

export function MaterialProvider({ children }: { children: React.ReactNode }) {
  const { push } = useNotifications()
  const [book, setBook] = useState<PriceBook>(seedBook)
  const [lastImport, setLastImport] = useState<ImportSummary | null>(null)

  const applyUpload = useCallback((preview: UploadPreview) => {
    const summary: ImportSummary = {
      added: preview.rows.filter((r) => r.status === 'new').length,
      updated: preview.rows.filter((r) => r.status === 'update').length,
      fileName: preview.fileName,
    }
    setBook((current) => applyPreview(current, preview))
    setLastImport(summary)
    push({
  type: 'pricing',
  title: 'Price list imported',
      body: `${summary.fileName}: ${summary.added} new and ${summary.updated} updated prices.`,
      href: '/materials',
      hrefLabel: 'View material prices',
    })
    return summary
  }, [push])

  const editEntry = useCallback(
    (id: string, price: number, origin: Origin) =>
      setBook((current) => editEntryInBook(current, id, price, origin)),
    [],
  )

  const classify = useCallback(
    (code: string, item: ItemKey | null) => setBook((current) => classifyMaterial(current, code, item)),
    [],
  )

  const value = useMemo<MaterialsContext>(
    () => ({
      book,
      lastImport,
      dismissImport: () => setLastImport(null),
      applyUpload,
      editEntry,
      classify,
    }),
    [book, lastImport, applyUpload, editEntry, classify],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useMaterials() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useMaterials must be used inside MaterialProvider')
  return ctx
}
