'use client'

import type { ReactNode } from 'react'
import { ProgressProvider } from '@bprogress/next/app'

export function RouteProgress({ children }: { children: ReactNode }) {
  return (
    <ProgressProvider
      height="3px"
      color="var(--brand)"
      options={{ showSpinner: false, trickleSpeed: 160, minimum: 0.12 }}
      shallowRouting
    >
      {children}
    </ProgressProvider>
  )
}
