'use client'

import { Dialog } from '@base-ui/react/dialog'
import { Lightning, Sparkle, X } from '@phosphor-icons/react'
import { useAgent } from '@/components/agent/agent-provider'
import { ChatPanel } from '@/components/agent/chat-panel'
import { ProcessPanel } from '@/components/agent/process-panel'
import { cn } from '@/lib/utils'

function statusLine(run: ReturnType<typeof useAgent>['run']) {
  if (!run) return 'Ready, goal: reach the target at the lowest spend'
  if (run.status === 'running') {
    const step = run.data.steps[run.stepIndex]
    return `Running, ${step ? step.title.toLowerCase() : 'working'}`
  }
  if (run.status === 'done')
    return run.data.satisfied ? 'Simulation delivered' : 'Closest simulation delivered'
  return 'Stopped'
}

export function AgentDialog() {
  const { open, setOpen, run, speed, setSpeed } = useAgent()
  const running = run?.status === 'running'

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-[3px] transition-opacity duration-300 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed inset-2 z-50 flex flex-col overflow-hidden rounded-lg border border-border bg-background shadow-2xl outline-none transition-[opacity,scale,translate] duration-300 ease-out data-ending-style:translate-y-2 data-ending-style:scale-[0.985] data-ending-style:opacity-0 data-starting-style:translate-y-3 data-starting-style:scale-[0.98] data-starting-style:opacity-0 sm:inset-3">
          <header className="flex h-14 shrink-0 items-center justify-between gap-4 bg-ink px-4 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative flex size-8 shrink-0 items-center justify-center rounded-[5px] bg-brand">
                {running && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 rounded-[5px] bg-brand motion-safe:animate-ping"
                  />
                )}
                <Sparkle size={16} weight="fill" className="relative" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <Dialog.Title className="font-display text-[15px] leading-5 font-semibold tracking-tight">
                  Simulation optimizer
                </Dialog.Title>
                <Dialog.Description className="flex items-center gap-1.5 truncate text-[11.5px] leading-4 text-white/60">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'size-1.5 shrink-0 rounded-full',
                      running ? 'bg-success motion-safe:animate-pulse' : 'bg-white/30',
                    )}
                  />
                  <span aria-live="polite" className="truncate">
                    {statusLine(run)}
                  </span>
                </Dialog.Description>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                role="radiogroup"
                aria-label="Playback speed"
                className="hidden h-7 items-center rounded-md bg-white/10 p-0.5 sm:inline-flex"
              >
                {([1, 3] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={speed === s}
                    onClick={() => setSpeed(s)}
                    className={cn(
                      'flex h-6 items-center gap-1 rounded-[3px] px-2 text-[11.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-white',
                      speed === s ? 'bg-white text-ink' : 'text-white/70 hover:text-white',
                    )}
                  >
                    {s === 3 && <Lightning size={11} weight="fill" aria-hidden="true" />}
                    {s}x
                  </button>
                ))}
              </div>
              <Dialog.Close
                aria-label="Close the plan optimizer"
                className="flex size-8 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-white"
              >
                <X size={16} aria-hidden="true" />
              </Dialog.Close>
            </div>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_392px] lg:overflow-hidden [&>section]:min-h-[420px] lg:[&>section]:min-h-0">
            <ProcessPanel />
            <div className="flex min-h-0 flex-col border-border lg:border-l [&>section]:min-h-0 [&>section]:flex-1">
              <ChatPanel />
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
