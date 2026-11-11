'use client'

import type { ReactNode } from 'react'
import { DataTableLocaleProvider } from '@/components/data-table/locale'
import { usePreferences } from '@/components/shell/preferences-provider'

/** Every DataTable in the app follows the language chosen in the user preferences. */
export function AppDataTableLocale({ children }: { children: ReactNode }) {
  const { language } = usePreferences()
  return <DataTableLocaleProvider locale={language}>{children}</DataTableLocaleProvider>
}
