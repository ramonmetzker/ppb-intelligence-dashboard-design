'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { planToSuggestion } from '@/lib/ppb-model'
import {
  DEFAULT_PARAMS,
  appNowIso,
  runAgent,
  type AgentParams,
  type AgentRun,
} from '@/lib/planner-agent'
import { HELP_REPLY, parseRequest } from '@/lib/agent-chat'
import { usePlan } from '@/components/app/plan-provider'

export type ChatMessage = {
  id: string
  role: 'user' | 'agent'
  text: string
  notes?: string[]
  /** Set on the message the agent posts when it delivers a plan. */
  planId?: string
  summary?: string[]
  satisfied?: boolean
}

export type RunState = {
  id: number
  data: AgentRun
  stepIndex: number
  /** How many lines of the current step have been typed out. */
  lineCount: number
  status: 'running' | 'done' | 'stopped'
  planId?: string
}

type AgentState = {
  open: boolean
  setOpen: (open: boolean) => void
  params: AgentParams
  patchParams: (patch: Partial<AgentParams>) => void
  messages: ChatMessage[]
  thinking: boolean
  run: RunState | null
  speed: 1 | 3
  setSpeed: (speed: 1 | 3) => void
  start: (params?: AgentParams) => void
  stop: () => void
  send: (text: string) => void
  /** Plans delivered while the dialog was closed. */
  unseen: number
}

const AgentContext = createContext<AgentState | null>(null)

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'agent',
  text: 'I optimize the Nov and Dec local share with a MILP solver. Set the brief on the left or tell me what you need, and I will run it, check it and deliver a new plan.',
}

let messageCounter = 0
const nextId = (prefix: string) => `${prefix}-${++messageCounter}`

export function AgentProvider({ children }: { children: ReactNode }) {
  const { plans, addPlan } = usePlan()
  const [open, setOpenState] = useState(false)
  const [params, setParams] = useState<AgentParams>(DEFAULT_PARAMS)
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [thinking, setThinking] = useState(false)
  const [run, setRun] = useState<RunState | null>(null)
  const [speed, setSpeed] = useState<1 | 3>(1)
  const [unseen, setUnseen] = useState(0)

  const paramsRef = useRef(params)
  paramsRef.current = params
  const openRef = useRef(open)
  openRef.current = open
  const plansRef = useRef(plans)
  plansRef.current = plans
  const runCounter = useRef(0)
  const delivered = useRef(new Set<number>())

  const push = useCallback((message: Omit<ChatMessage, 'id'>) => {
    setMessages((prev) => [...prev, { ...message, id: nextId(message.role) }])
  }, [])

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next)
    if (next) setUnseen(0)
  }, [])

  const patchParams = useCallback((patch: Partial<AgentParams>) => {
    setParams((prev) => ({ ...prev, ...patch }))
  }, [])

  const start = useCallback((override?: AgentParams) => {
    const used = override ?? paramsRef.current
    if (override) setParams(override)
    runCounter.current += 1
    setRun({
      id: runCounter.current,
      data: runAgent(used),
      stepIndex: 0,
      lineCount: 0,
      status: 'running',
    })
  }, [])

  const stop = useCallback(() => {
    setRun((prev) => (prev && prev.status === 'running' ? { ...prev, status: 'stopped' } : prev))
    push({ role: 'agent', text: 'Stopped. Nothing was added to your plans.' })
  }, [push])

  const deliver = useCallback(
    (finished: RunState) => {
      if (delivered.current.has(finished.id)) return
      delivered.current.add(finished.id)

      const base = finished.data.name
      const taken = plansRef.current.filter((p) => p.suggestion.name.startsWith(base)).length
      const name = taken > 0 ? `${base} (${taken + 1})` : base
      const planId = `agent-${finished.id}-${Date.now().toString(36)}`

      addPlan(
        planToSuggestion(
          { id: planId, name, tag: 'Planner agent', blurb: finished.data.blurb, createdAt: appNowIso() },
          finished.data.final.plan,
        ),
      )
      setRun((prev) => (prev && prev.id === finished.id ? { ...prev, status: 'done', planId } : prev))
      push({
        role: 'agent',
        text: finished.data.satisfied
          ? `Done. "${name}" is ready and saved in your plans.`
          : `"${name}" is the closest feasible plan. It is saved in your plans and flagged as short of the target.`,
        planId,
        summary: finished.data.summary,
        satisfied: finished.data.satisfied,
      })
      if (!openRef.current) setUnseen((n) => n + 1)
    },
    [addPlan, push],
  )

  /* Playback: one timer at a time reveals the next line, then the next step. */
  useEffect(() => {
    if (!run || run.status !== 'running') return
    const step = run.data.steps[run.stepIndex]
    if (!step) return

    const total = step.lines.length
    let delay: number
    let advance: () => void

    if (run.lineCount < total) {
      const perLine = (step.duration * 0.7) / Math.max(total, 1)
      delay = (run.lineCount === 0 ? 220 : perLine) / speed
      advance = () =>
        setRun((prev) =>
          prev && prev.id === run.id && prev.status === 'running'
            ? { ...prev, lineCount: prev.lineCount + 1 }
            : prev,
        )
    } else {
      delay = Math.max(380, step.duration * 0.3) / speed
      advance = () => {
        if (run.stepIndex >= run.data.steps.length - 1) {
          deliver(run)
          return
        }
        setRun((prev) =>
          prev && prev.id === run.id && prev.status === 'running'
            ? { ...prev, stepIndex: prev.stepIndex + 1, lineCount: 0 }
            : prev,
        )
      }
    }

    const timer = setTimeout(advance, delay)
    return () => clearTimeout(timer)
  }, [run, speed, deliver])

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      push({ role: 'user', text: trimmed })
      const parsed = parseRequest(trimmed, paramsRef.current)
      setThinking(true)
      window.setTimeout(() => {
        setThinking(false)
        if (!parsed.wantsRun) {
          push({ role: 'agent', text: HELP_REPLY })
          return
        }
        push({
          role: 'agent',
          text: parsed.changed
            ? 'Understood. I updated the brief and I am running a new simulation.'
            : 'Running the current brief again.',
          notes: parsed.notes,
        })
        start(parsed.params)
      }, 650)
    },
    [push, start],
  )

  const value = useMemo<AgentState>(
    () => ({
      open,
      setOpen,
      params,
      patchParams,
      messages,
      thinking,
      run,
      speed,
      setSpeed,
      start,
      stop,
      send,
      unseen,
    }),
    [open, setOpen, params, patchParams, messages, thinking, run, speed, start, stop, send, unseen],
  )

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
}

export function useAgent() {
  const ctx = useContext(AgentContext)
  if (!ctx) throw new Error('useAgent must be used inside AgentProvider')
  return ctx
}
