import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { Button } from '@/components/ui/button'

const METRICS = [
  { value: '668.3', label: 'PPB score' },
  { value: '+6.3', label: 'Safety margin' },
  { value: '14', label: 'Material changes' },
  { value: '3', label: 'Supplier adjustments' },
]

export function OptimizationStrip() {
  return (
    <section
      aria-labelledby="plan-heading"
      className="flex flex-col gap-6 rounded-xl border border-white/5 bg-graphite-raised px-8 py-6 text-white xl:flex-row xl:items-center"
    >
      <div className="xl:w-[300px] xl:shrink-0">
        <h2
          id="plan-heading"
          className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/60"
        >
          Optimized sourcing plan
        </h2>
        <p className="num-mono mt-2 text-[40px] leading-none font-medium">
          R$ 3.47M
        </p>
        <p className="mt-2 text-[13px] text-white/60">
          Projected savings versus current strategy
        </p>
      </div>

      <dl className="grid flex-1 grid-cols-2 gap-y-5 sm:grid-cols-4">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="border-white/10 px-6 sm:border-l"
          >
            <dd className="num-mono text-[26px] leading-8 font-medium">{m.value}</dd>
            <dt className="mt-0.5 text-[12px] text-white/60">{m.label}</dt>
          </div>
        ))}
      </dl>

      <Button size="lg" className="h-10 gap-2 rounded-lg px-4 text-[13px] font-medium">
        View optimized plan
        <ArrowRight size={15} weight="bold" aria-hidden="true" />
      </Button>
    </section>
  )
}
