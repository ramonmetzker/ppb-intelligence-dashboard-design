'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUp, CircleNotch, Sparkle } from '@phosphor-icons/react'

import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupButton, InputGroupTextarea } from '@/components/ui/input-group'
import { Message, MessageAvatar, MessageContent, MessageGroup } from '@/components/ui/message'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { MessageScroller, MessageScrollerContent, MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport } from '@/components/ui/message-scroller'
import { getMockAnalysisReply, type SimulationScenario } from '@/lib/simulation-report'
import { cn } from '@/lib/utils'

type MessageItem = { id: number; role: 'assistant' | 'user'; content: string }

type AnalysisChatProps = { scenario: SimulationScenario }

const quickPrompts = ['Score gap', 'Cost drivers', 'December variance']

function openingMessage(scenario: SimulationScenario) {
  const savings = scenario.knownCostDelta === null ? 'cost not reconstructed' : `US$ ${Math.abs(scenario.knownCostDelta).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} known savings`
  return `${scenario.name}: ${scenario.score.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} score · ${savings} · ${scenario.unknownOriginLines} origin gaps.`
}

export function MockAnalysisChat({ scenario }: AnalysisChatProps) {
  const [messages, setMessages] = useState<MessageItem[]>([{ id: 1, role: 'assistant', content: openingMessage(scenario) }])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const nextId = useRef(2)

  useEffect(() => {
    setMessages([{ id: 1, role: 'assistant', content: openingMessage(scenario) }])
    setInput('')
  }, [scenario])

  function submit(prompt: string) {
    const trimmed = prompt.trim()
    if (!trimmed || thinking) return
    setMessages((current) => [...current, { id: nextId.current++, role: 'user', content: trimmed }])
    setInput('')
    setThinking(true)
    window.setTimeout(() => {
      setMessages((current) => [...current, { id: nextId.current++, role: 'assistant', content: getMockAnalysisReply(trimmed, scenario) }])
      setThinking(false)
    }, 500)
  }

  return (
    <section className="flex h-[560px] min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm xl:h-[calc(100vh-96px)] xl:max-h-[720px]">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-[4px] bg-ink text-brand-soft"><Sparkle size={14} weight="fill" /></span>
          <div className="min-w-0"><p className="eyebrow">Analysis assistant</p><h2 className="font-display truncate text-[14px] leading-5 font-semibold tracking-tight">PPB analysis</h2></div>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-success"><span className="size-1.5 rounded-full bg-success" /> Ready</span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col bg-background/20">
        <MessageScrollerProvider>
          <MessageScroller className="min-h-0 flex-1">
            <MessageScrollerViewport>
              <MessageScrollerContent className="gap-3.5 px-4 py-4">
                {messages.map((message) => (
                  <MessageScrollerItem key={message.id}>
                    <Message align={message.role === 'user' ? 'end' : 'start'}>
                      {message.role === 'assistant' ? <MessageAvatar className="size-6 rounded-[4px] bg-ink text-brand-soft"><Sparkle size={12} weight="fill" /></MessageAvatar> : null}
                      <MessageContent className={cn('max-w-[88%]', message.role === 'user' && 'max-w-[82%]')}>
                        <MessageGroup>
                          <Bubble align={message.role === 'user' ? 'end' : 'start'} variant={message.role === 'user' ? 'default' : 'muted'}>
                            <BubbleContent className="rounded-[4px] px-3 py-2 text-[12px] leading-[18px]">{message.content}</BubbleContent>
                          </Bubble>
                        </MessageGroup>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                ))}
                {thinking ? <MessageScrollerItem><Message><MessageAvatar className="size-6 bg-brand-soft text-brand"><CircleNotch className="animate-spin" size={13} /></MessageAvatar><MessageContent><Bubble variant="muted"><BubbleContent className="rounded-[4px] px-3 py-2 text-[12px] leading-[18px] text-muted-foreground">Reviewing run...</BubbleContent></Bubble></MessageContent></Message></MessageScrollerItem> : null}
              </MessageScrollerContent>
            </MessageScrollerViewport>
          </MessageScroller>
        </MessageScrollerProvider>

        <div className="shrink-0 border-t border-border bg-card p-3">
          <div className="mb-2 flex flex-wrap gap-1">
            {quickPrompts.map((prompt) => <Button key={prompt} type="button" variant="outline" size="sm" className="h-7 rounded-[4px] bg-secondary/60 px-2 text-[11px] text-muted-foreground hover:text-foreground" onClick={() => submit(prompt)} disabled={thinking}>{prompt}</Button>)}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); submit(input) }}>
            <InputGroup className="h-9 rounded-[4px] bg-background shadow-none">
              <InputGroupTextarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about score or cost..." rows={1} aria-label="Ask the PPB analysis" onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); submit(input) } }} />
              <InputGroupButton type="submit" size="icon-sm" variant="default" aria-label="Send question" disabled={!input.trim() || thinking} className="mr-0.5 rounded-[2px]"><ArrowUp size={15} weight="bold" /></InputGroupButton>
            </InputGroup>
          </form>
        </div>
      </div>
    </section>
  )
}
