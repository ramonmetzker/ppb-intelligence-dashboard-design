'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, PaperPlaneRight, Sparkle } from '@phosphor-icons/react'
import { fmt, fmtCost, fmtCreated, fmtSigned } from '@/lib/ppb-model'
import { QUICK_PROMPTS } from '@/lib/agent-chat'
import { usePlan } from '@/components/app/plan-provider'
import { statusText } from '@/components/app/status-chip'
import { useAgent, type ChatMessage } from '@/components/agent/agent-provider'
import { cn } from '@/lib/utils'

function DeliveredCard({ planId }: { planId: string }) {
  const router = useRouter()
  const { setOpen } = useAgent()
  const { plans, active, applySuggestion } = usePlan()
  const option = plans.find((p) => p.suggestion.id === planId)
  if (!option) return null
  const { suggestion, sim } = option
  const applied = active?.id === planId

  return (
    <div className="mt-2 overflow-hidden rounded-md border border-border bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border px-3 py-2">
        <div className="min-w-0">
          <p className="eyebrow">New plan, {fmtCreated(suggestion.createdAt)}</p>
          <p className="font-display truncate text-[13px] leading-5 font-semibold tracking-tight">
            {suggestion.name}
          </p>
        </div>
        <div className="text-right">
          <p className={cn('num text-[17px] leading-5 font-semibold', statusText(sim.status))}>
            {fmt(sim.yearEnd)}
          </p>
          <p className={cn('num text-[11px] leading-4', statusText(sim.status))}>{fmtSigned(sim.gap)}</p>
        </div>
      </div>
      <div className="tnum flex items-center justify-between px-3 py-1.5 text-[11px] text-muted-foreground">
        <span>{sim.cost > 0 ? fmtCost(sim.cost) : 'No spend'}</span>
        <span>{sim.confidence}% confidence</span>
      </div>
      <div className="flex gap-1.5 border-t border-border p-1.5">
        <button
          type="button"
          disabled={applied}
          onClick={() => applySuggestion(planId)}
          className={cn(
            'flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[4px] text-[11.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring',
            applied
              ? 'bg-brand-soft text-brand-deep'
              : 'bg-brand text-white hover:brightness-110',
          )}
        >
          {applied ? (
            <>
              <Check size={12} weight="bold" aria-hidden="true" />
              Applied to the app
            </>
          ) : (
            'Apply to the app'
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            router.push('/simulation')
          }}
          className="flex h-7 items-center gap-1 rounded-[4px] border border-input px-2 text-[11.5px] font-medium transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
        >
          Fine tune
          <ArrowRight size={12} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

function Message({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-1 flex justify-end duration-200">
        <p className="max-w-[88%] rounded-md bg-brand px-3 py-2 text-[12.5px] leading-[18px] text-white">
          {message.text}
        </p>
      </div>
    )
  }
  return (
    <div className="animate-in fade-in slide-in-from-bottom-1 flex gap-2 duration-200">
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-[4px] bg-ink text-brand-soft"
      >
        <Sparkle size={12} weight="fill" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] leading-[18px] text-foreground">{message.text}</p>
        {message.notes && message.notes.length > 0 && (
          <ul className="mt-1.5 flex flex-wrap gap-1">
            {message.notes.map((note) => (
              <li
                key={note}
                className="rounded-[3px] bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-brand-deep"
              >
                {note}
              </li>
            ))}
          </ul>
        )}
        {message.summary && (
          <ul className="mt-2 flex flex-col gap-1 border-l-2 border-border pl-2.5">
            {message.summary.map((line) => (
              <li key={line} className="text-[11.5px] leading-4 text-muted-foreground">
                {line}
              </li>
            ))}
          </ul>
        )}
        {message.planId && <DeliveredCard planId={message.planId} />}
      </div>
    </div>
  )
}

export function ChatPanel() {
  const { messages, thinking, send, run } = useAgent()
  const [draft, setDraft] = useState('')
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, thinking])

  const submit = () => {
    if (!draft.trim()) return
    send(draft)
    setDraft('')
  }

  return (
    <section aria-label="Chat with the planner agent" className="flex min-h-0 flex-col bg-card">
      <div className="border-b border-border px-4 py-3">
        <p className="eyebrow">Ask the agent</p>
        <p className="font-display mt-0.5 text-[14px] leading-5 font-semibold tracking-tight">
          Describe what you need
        </p>
      </div>

      <div
        ref={scroller}
        role="log"
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-4 py-4"
      >
        {messages.map((m) => (
          <Message key={m.id} message={m} />
        ))}
        {thinking && (
          <div className="flex items-center gap-2" role="status" aria-label="The agent is reading your request">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-[4px] bg-ink text-brand-soft"
            >
              <Sparkle size={12} weight="fill" />
            </span>
            <span className="flex gap-1" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-1.5 rounded-full bg-brand motion-safe:animate-bounce"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        <div className="mb-2 flex flex-wrap gap-1">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={run?.status === 'running'}
              onClick={() => send(prompt)}
              className="rounded-[4px] border border-border bg-secondary/60 px-2 py-1 text-left text-[11px] leading-4 text-muted-foreground transition-colors hover:border-input hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2 rounded-md border border-input bg-background p-1.5 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
          <label htmlFor="agent-draft" className="sr-only">
            Message to the planner agent
          </label>
          <textarea
            id="agent-draft"
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                if (e.nativeEvent.isComposing || e.keyCode === 229) return
                e.preventDefault()
                submit()
              }
            }}
            placeholder="Reach 672 under $2M, lock Memory..."
            className="max-h-24 min-h-9 flex-1 resize-none bg-transparent px-1.5 py-1 text-[12.5px] leading-[18px] outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim()}
            aria-label="Send message"
            className="flex size-8 shrink-0 items-center justify-center rounded-[4px] bg-brand text-white transition-[filter,opacity] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40"
          >
            <PaperPlaneRight size={14} weight="fill" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}
