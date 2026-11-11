'use client'

import type { ReactNode } from 'react'
import { DataTableLocaleProvider } from '@/components/data-table/locale'
import { DataTablePersistenceProvider } from '@/components/data-table/persistence'
import { usePreferences } from '@/components/shell/preferences-provider'

/** Every DataTable follows the current user's language and persistence scope. */
export function AppDataTableLocale({ children }: { children: ReactNode }) {
  const { language, user } = usePreferences()
  return (
    <DataTablePersistenceProvider userId={user.knoxId}>
      <DataTableLocaleProvider locale={language}>{children}</DataTableLocaleProvider>
    </DataTablePersistenceProvider>
  )
}
