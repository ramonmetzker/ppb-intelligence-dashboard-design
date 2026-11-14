'use client'

import { SidebarProvider, useSidebar } from '@/components/ui/sidebar'

type ShellContextValue = {
  collapsed: boolean
  toggleSidebar: () => void
}

export function ShellProvider({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      defaultOpen
      style={{
        '--sidebar-width': '16rem',
        '--sidebar-width-icon': '4.75rem',
      } as React.CSSProperties}
    >
      {children}
    </SidebarProvider>
  )
}

export function useShell(): ShellContextValue {
  const { state, toggleSidebar } = useSidebar()
  return {
    collapsed: state === 'collapsed',
    toggleSidebar,
  }
}
