'use client'

import { useEffect, useRef, useState } from 'react'
import { fmtSigned } from '@/lib/ppb-model'
import { useBooted } from '@/components/app/boot'
import { cn } from '@/lib/utils'

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))

function useCountUp(target: number, duration: number, delay: number) {
  const ref = useRef<HTMLSpanElement>(null)
  const [value, setValue] = useState(0)
  const [seen, setSeen] = useState(false)
  const shown = useRef(0)
  const first = useRef(true)
  const booted = useBooted()

  useEffect(() => {
    if (!booted) return
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setSeen(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          io.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [booted])

  useEffect(() => {
    if (!seen) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shown.current = target
      setValue(target)
      return
    }
    const from = shown.current
    const wait = first.current ? delay : 0
    const t0 = performance.now() + wait
    let raf = 0
    const tick = (now: number) => {
      if (now >= t0) first.current = false
      const p = Math.min(1, Math.max(0, (now - t0) / duration))
      const v = from + (target - from) * easeOutExpo(p)
      shown.current = v
      setValue(v)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [seen, target, duration, delay])

  return { ref, value }
}

/**
 * A number that counts up when it first scrolls into view and glides to every
 * new value afterwards. The final value is always exposed to screen readers.
 */
export function CountUp({
  value,
  decimals = 2,
  duration = 1100,
  delay = 0,
  signed = false,
  prefix = '',
  suffix = '',
  className,
}: {
  value: number
  decimals?: number
  duration?: number
  delay?: number
  signed?: boolean
  prefix?: string
  suffix?: string
  className?: string
}) {
  const { ref, value: current } = useCountUp(value, duration, delay)

  const format = (n: number) => {
    const rounded = Number(n.toFixed(decimals))
    const body = signed && rounded !== 0 ? fmtSigned(rounded, decimals) : rounded.toFixed(decimals)
    return `${prefix}${body}${suffix}`
  }

  return (
    <span className={cn('tnum', className)}>
      <span ref={ref} aria-hidden="true">
        {format(current)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </span>
  )
}
