'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { PpbLoadingMark } from '@/components/brand/ppb-mark'
import { cn } from '@/lib/utils'

type BootPhase = 'splash' | 'leaving' | 'done'

const BootContext = createContext(true)

/** True once the splash starts lifting. Entrance animations wait for this. */
export function useBooted() {
  return useContext(BootContext)
}

const MESSAGES = ['Loading the October close', 'Calibrating the SOP', 'Preparing simulations']

export function BootProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<BootPhase>('splash')

  useEffect(() => {
    document.body.style.overflow = phase === 'done' ? '' : 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [phase])

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const lift = setTimeout(() => setPhase('leaving'), reduce ? 200 : 2200)
    const remove = setTimeout(() => setPhase('done'), reduce ? 400 : 2850)
    return () => {
      clearTimeout(lift)
      clearTimeout(remove)
    }
  }, [])

  return (
    <BootContext.Provider value={phase !== 'splash'}>
      {children}
      {phase !== 'done' && <Splash leaving={phase === 'leaving'} />}
    </BootContext.Provider>
  )
}

function Splash({ leaving }: { leaving: boolean }) {
  return (
    <div
      role="status"
      aria-label="Loading PPB"
      className={cn(
        'splash fixed inset-0 z-[100] flex items-center justify-center bg-sidebar/45 p-4 text-sidebar-foreground backdrop-blur-xl backdrop-saturate-50',
        leaving && 'splash-leaving',
      )}
    >
      <div className="splash-content relative flex w-full max-w-[380px] flex-col overflow-hidden rounded-2xl border border-sidebar-border bg-sidebar/95 shadow-2xl">
        <div className="splash-scan absolute inset-x-0 top-0 h-px bg-brand" aria-hidden="true" />
        <div className="flex items-center gap-3.5 px-5 pt-5 pb-4">
          <span className="splash-mark flex size-12 items-center justify-center rounded-xl border border-sidebar-border bg-sidebar-accent">
            <PpbLoadingMark size={34} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[20px] leading-6 font-semibold tracking-tight text-white">
              PPB
            </p>
            <p className="mt-0.5 text-[9.5px] font-medium tracking-[0.14em] text-sidebar-foreground/55 uppercase">
              MX 2026 compliance workspace
            </p>
          </div>
          <span className="splash-pulse size-2 rounded-full bg-success" aria-hidden="true" />
        </div>

        <div className="border-t border-sidebar-border bg-sidebar-accent/35 px-5 py-4">
          <div className="flex items-center justify-between text-[10px] font-medium tracking-[0.1em] text-sidebar-foreground/45 uppercase">
            <span>Preparing workspace</span>
            <span className="tnum">03 / 03</span>
          </div>
          <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-sidebar-border" aria-hidden="true">
            <div className="splash-fill absolute inset-y-0 left-0 rounded-full bg-brand" />
          </div>
          <div className="relative mt-3 h-4 text-[11.5px] text-sidebar-foreground/70">
            {MESSAGES.map((message, index) => (
              <span
                key={message}
                className="splash-msg"
                style={{ '--d': `${index * 0.65}s` } as React.CSSProperties}
              >
                {message}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
