'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { PpbMark } from '@/components/brand/ppb-mark'
import { cn } from '@/lib/utils'

type BootPhase = 'splash' | 'leaving' | 'done'

const BootContext = createContext(true)

/** True once the splash starts lifting. Entrance animations wait for this. */
export function useBooted() {
  return useContext(BootContext)
}

const MESSAGES = ['Loading the October close', 'Calibrating the forecast', 'Preparing plans and scenarios']

export function BootProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<BootPhase>('splash')

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const lift = setTimeout(() => setPhase('leaving'), reduce ? 200 : 1600)
    const remove = setTimeout(() => setPhase('done'), reduce ? 400 : 2250)
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
      aria-label="Loading PPB Intelligence"
      className={cn(
        'splash fixed inset-0 z-[100] flex items-center justify-center bg-sidebar text-sidebar-foreground',
        leaving && 'splash-leaving',
      )}
    >
      <div className="splash-content flex w-[300px] flex-col gap-6">
        <div className="flex items-center gap-3">
          <PpbMark size={40} />
          <div>
            <p className="font-display text-[22px] leading-6 font-semibold tracking-tight text-white">
              PPB Intelligence
            </p>
            <p className="mt-0.5 text-[10px] font-medium tracking-[0.12em] text-sidebar-foreground/60 uppercase">
              GBM 2026 compliance
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="relative h-px w-full bg-sidebar-border" aria-hidden="true">
            <div className="splash-fill absolute inset-y-[-1px] left-0 h-[3px] bg-brand">
              <span className="absolute top-1/2 right-0 size-[7px] -translate-y-1/2 translate-x-1/2 rounded-[1px] bg-white" />
            </div>
          </div>
          <div className="relative h-4 text-[11.5px] text-sidebar-foreground/70">
            {MESSAGES.map((message, index) => (
              <span
                key={message}
                className="splash-msg"
                style={{ '--d': `${index * 0.55}s` } as React.CSSProperties}
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
