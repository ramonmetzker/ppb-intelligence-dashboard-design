'use client'

import { CircleNotch, Sparkle } from '@phosphor-icons/react'
import { useAgent } from '@/components/agent/agent-provider'
import { useBooted } from '@/components/app/boot'
import { cn } from '@/lib/utils'

export function AgentLauncher() {
  const { open, setOpen, run, unseen } = useAgent()
  const booted = useBooted()
  const running = run?.status === 'running'
  const round = run ? run.data.steps[run.stepIndex]?.round : 0

  if (open) return null

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={
        running
          ? 'Open the simulation optimizer, a run is in progress'
          : unseen > 0
            ? `Open the simulation optimizer, ${unseen} new ${unseen === 1 ? 'simulation' : 'simulations'}`
            : 'Open the simulation optimizer'
      }
      className={cn(
        'group fixed right-5 bottom-5 z-40 flex h-11 items-center gap-2.5 rounded-md bg-ink pr-4 pl-1.5 text-white shadow-lg ring-1 ring-white/10 transition-[transform,box-shadow,opacity] duration-500 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        booted ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
      )}
    >
      <span className="relative flex size-8 items-center justify-center rounded-[5px] bg-brand">
        {(running || unseen > 0) && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-[5px] bg-brand motion-safe:animate-ping"
          />
        )}
        {running ? (
          <CircleNotch size={16} className="relative motion-safe:animate-spin" aria-hidden="true" />
        ) : (
          <Sparkle size={16} weight="fill" className="relative" aria-hidden="true" />
        )}
      </span>
      <span className="text-left">
        <span className="font-display block text-[13px] leading-4 font-semibold tracking-tight">
          Simulation optimizer
        </span>
        <span className="block text-[11px] leading-3.5 text-white/60">
          {running
            ? `Solving, round ${round || 1}`
            : unseen > 0
              ? `${unseen} new ${unseen === 1 ? 'simulation' : 'simulations'} ready`
              : 'Ask the AI agent'}
        </span>
      </span>
      {unseen > 0 && !running && (
        <span
          aria-hidden="true"
          className="num absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-success text-[11px] font-semibold text-white"
        >
          {unseen}
        </span>
      )}
    </button>
  )
}
