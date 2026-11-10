'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

type ShellContextValue = {
  collapsed: boolean
  toggleSidebar: () => void
}

const ShellContext = createContext<ShellContextValue | null>(null)

export function ShellProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <ShellContext.Provider
      value={{ collapsed, toggleSidebar: () => setCollapsed((current) => !current) }}
    >
      {children}
    </ShellContext.Provider>
  )
}

export function useShell() {
  const context = useContext(ShellContext)
  if (!context) throw new Error('useShell must be used within ShellProvider')
  return context
}
