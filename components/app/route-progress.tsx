'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { ProgressProvider } from '@bprogress/next/app'

const NavigationTransitionContext = createContext(false)

export function useNavigationTransition() {
  return useContext(NavigationTransitionContext)
}

function NavigationTransitionState({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [isNavigating, setIsNavigating] = useState(false)
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setIsNavigating(false)
    if (resetRef.current) clearTimeout(resetRef.current)
  }, [pathname])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target instanceof Element ? event.target.closest('a') : null
      const href = target?.getAttribute('href')
      if (!href || target?.getAttribute('target') === '_blank' || href.startsWith('#')) return

      const nextUrl = new URL(href, window.location.href)
      if (nextUrl.origin !== window.location.origin || nextUrl.href === window.location.href) return

      setIsNavigating(true)
      if (resetRef.current) clearTimeout(resetRef.current)
      resetRef.current = setTimeout(() => setIsNavigating(false), 5000)
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
      if (resetRef.current) clearTimeout(resetRef.current)
    }
  }, [])

  return (
    <NavigationTransitionContext.Provider value={isNavigating}>
      {children}
    </NavigationTransitionContext.Provider>
  )
}

export function RouteProgress({ children }: { children: ReactNode }) {
  return (
    <ProgressProvider
      height="3px"
      color="var(--brand)"
      options={{ showSpinner: false, trickleSpeed: 160, minimum: 0.12 }}
      shallowRouting
    >
      <NavigationTransitionState>{children}</NavigationTransitionState>
    </ProgressProvider>
  )
}
