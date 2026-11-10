'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, CircleNotch, Sparkle } from '@phosphor-icons/react'
import { useAgent } from '@/components/agent/agent-provider'
import { useShell } from '@/components/shell/shell-provider'
import { useBooted } from '@/components/app/boot'
import { cn } from '@/lib/utils'

export function AgentLauncher() {
  const { open, setOpen, run, unseen } = useAgent()
  const { collapsed } = useShell()
  const booted = useBooted()
  const running = run?.status === 'running'
  const round = run ? run.data.steps[run.stepIndex]?.round : 0
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [dock, setDock] = useState<'left' | 'right'>('right')
  const [dragLeft, setDragLeft] = useState<number | null>(null)
  const dragStartX = useRef(0)
  const dragged = useRef(false)

  const dockPosition =
    dragLeft !== null
      ? { left: dragLeft }
      : dock === 'left'
        ? { left: collapsed ? 96 : 276 }
        : { right: 20 }

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    dragStartX.current = event.clientX
    dragged.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    if (Math.abs(event.clientX - dragStartX.current) < 6 && !dragged.current) return
    dragged.current = true
    setDragLeft(Math.max(20, Math.min(window.innerWidth - 64, event.clientX - 22)))
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
    event.currentTarget.releasePointerCapture(event.pointerId)
    if (dragged.current) setDock(event.clientX < window.innerWidth / 2 ? 'left' : 'right')
    setDragLeft(null)
  }

  const handleLauncherClick = () => {
    if (dragged.current) {
      dragged.current = false
      return
    }
    setOpen(true)
  }

  useEffect(() => {
    const updateVisibility = () => setShowBackToTop(window.scrollY > 280)
    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    return () => window.removeEventListener('scroll', updateVisibility)
  }, [])

  if (open) return null

  return (
    <>
      <button
        type="button"
        onClick={handleLauncherClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={dockPosition}
        aria-label={
          running
            ? 'Open the simulation optimizer, a run is in progress'
            : unseen > 0
              ? `Open the simulation optimizer, ${unseen} new ${unseen === 1 ? 'simulation' : 'simulations'}`
              : 'Open the simulation optimizer'
        }
        className={cn(
          'group fixed z-40 flex h-11 touch-none cursor-grab items-center overflow-hidden rounded-md bg-ink p-1.5 text-white shadow-lg ring-1 ring-white/10 transition-[bottom,left,right,box-shadow,opacity] hover:shadow-xl active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          dragLeft === null ? 'duration-500' : 'duration-0',
          showBackToTop ? 'bottom-20' : 'bottom-5',
          booted ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <span className="max-w-0 overflow-hidden text-right opacity-0 transition-[max-width,opacity,margin] duration-300 group-hover:mr-2.5 group-hover:max-w-48 group-hover:opacity-100 group-focus-visible:mr-2.5 group-focus-visible:max-w-48 group-focus-visible:opacity-100">
          <span className="font-display block whitespace-nowrap text-[13px] leading-4 font-semibold tracking-tight">
            Simulation optimizer
          </span>
          <span className="block whitespace-nowrap text-[11px] leading-3.5 text-white/60">
            {running
              ? `Solving, round ${round || 1}`
              : unseen > 0
                ? `${unseen} new ${unseen === 1 ? 'simulation' : 'simulations'} ready`
                : 'Ask the AI agent'}
          </span>
        </span>
        <span className="relative flex size-8 shrink-0 items-center justify-center rounded-[5px] bg-brand">
          {(running || unseen > 0) && (
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-[5px] bg-brand motion-safe:animate-ping"
            />
          )}
          {running ? (
            <CircleNotch
              size={16}
              className="relative motion-safe:animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Sparkle size={16} weight="fill" className="relative" aria-hidden="true" />
          )}
        </span>
        {unseen > 0 && !running && (
          <span
            aria-hidden="true"
            className="num absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-success text-[11px] font-semibold text-white"
          >
            {unseen}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={dock === 'left' ? { left: collapsed ? 96 : 276 } : { right: 20 }}
        aria-label="Back to top"
        className={cn(
          'fixed bottom-5 z-40 flex size-11 items-center justify-center rounded-md bg-ink text-white shadow-lg ring-1 ring-white/10 transition-[left,right,opacity,box-shadow] duration-300 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
          showBackToTop && booted ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <ArrowUp size={18} weight="bold" aria-hidden="true" />
      </button>
    </>
  )
}
