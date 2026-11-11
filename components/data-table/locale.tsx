'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { DATA_TABLE_LOCALES, type DataTableLabels, type DataTableLocaleId } from '@/lib/data-table/locales'

/** A built-in locale id, or a (partial) set of labels merged over English. */
export type DataTableLocale = DataTableLocaleId | Partial<DataTableLabels>

const DataTableLocaleContext = createContext<DataTableLocale | null>(null)

function resolve(locale: DataTableLocale | null | undefined): DataTableLabels {
  if (!locale) return DATA_TABLE_LOCALES.en
  if (typeof locale === 'string') return DATA_TABLE_LOCALES[locale] ?? DATA_TABLE_LOCALES.en
  return { ...DATA_TABLE_LOCALES.en, ...locale }
}

/**
 * Sets the locale for every DataTable below it. Mount it once near the root of the app
 * (or around a feature) so individual tables don't need a `locale` prop.
 */
export function DataTableLocaleProvider({ locale, children }: { locale: DataTableLocale; children: ReactNode }) {
  return <DataTableLocaleContext.Provider value={locale}>{children}</DataTableLocaleContext.Provider>
}

/**
 * Precedence, highest first: `overrides` (per-table label tweaks), the table's own `locale` prop,
 * the nearest DataTableLocaleProvider, then English.
 */
export function useDataTableLabels(locale?: DataTableLocale, overrides?: Partial<DataTableLabels>): DataTableLabels {
  const inherited = useContext(DataTableLocaleContext)
  return useMemo(() => {
    const base = resolve(locale ?? inherited)
    return overrides ? { ...base, ...overrides } : base
  }, [locale, inherited, overrides])
}
