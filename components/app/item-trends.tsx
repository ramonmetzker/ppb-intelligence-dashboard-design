'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { ITEMS, fmt, fmtPercent, fmtSigned, itemShareTrend } from '@/lib/ppb-model'
import { usePlan } from '@/components/app/plan-provider'
import { cn } from '@/lib/utils'

const INK = 'var(--ink)'
const BRAND = 'var(--brand)'
const MUTED = '#8c8e95'
const GRID = 'var(--grid)'
const AXIS = 'var(--muted-foreground)'

export function ItemTrends() {
  const { plan, sim } = usePlan()

  return (
    <section aria-label="Local share trend by item">
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[14px] leading-5 font-semibold tracking-tight">
            Local share trend by item
          </h2>
          <p className="text-[12px] text-muted-foreground">
            Monthly local share. Dashed grey is the forecast, blue is your plan.
          </p>
        </div>
      </div>
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {ITEMS.map((item) => {
          const row = sim.items.find((r) => r.key === item.key)!
          const data = itemShareTrend(plan, item.key)
          return (
            <li
              key={item.key}
              className="flex flex-col rounded-lg border border-border bg-card"
            >
              <div className="flex items-start justify-between gap-3 px-4 pt-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[13px] font-semibold">
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-[1px]"
                      style={{ background: item.color }}
                    />
                    <span className="font-display truncate">{item.name}</span>
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">{item.detail}</p>
                </div>
                <div className="text-right">
                  <p className="num text-[18px] leading-5 font-semibold">{fmt(row.scenario)}</p>
                  <p
                    className={cn(
                      'num text-[11px] font-medium',
                      Math.abs(row.delta) < 0.005
                        ? 'text-muted-foreground'
                        : row.delta > 0
                          ? 'text-success'
                          : 'text-critical',
                    )}
                  >
                    {Math.abs(row.delta) < 0.005 ? 'on forecast' : `${fmtSigned(row.delta)} pts`}
                  </p>
                </div>
              </div>

              <div
                role="img"
                aria-label={`${item.name} monthly local share. October ${fmtPercent(row.shareNow)} accumulated. December plan ${fmtPercent(row.shareScenario)} accumulated.`}
                className="h-[132px] px-2 pt-1"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <ReferenceArea
                      x1="Nov"
                      x2="Dec"
                      fill="var(--brand-soft)"
                      fillOpacity={0.7}
                      ifOverflow="visible"
                    />
                    <XAxis
                      dataKey="month"
                      interval={1}
                      tickLine={false}
                      axisLine={{ stroke: GRID }}
                      tick={{ fill: AXIS, fontSize: 10.5 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      ticks={[0, 50, 100]}
                      tickFormatter={(v: number) => `${v}%`}
                      tickLine={false}
                      axisLine={false}
                      width={34}
                      tick={{ fill: AXIS, fontSize: 10.5, fontFamily: 'var(--font-space-grotesk)' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke={INK}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="forecast"
                      stroke={MUTED}
                      strokeWidth={1.5}
                      strokeDasharray="4 3"
                      dot={false}
                      isAnimationActive={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="plan"
                      stroke={BRAND}
                      strokeWidth={2.25}
                      dot={{ r: 2.5, fill: BRAND, stroke: 'var(--card)', strokeWidth: 1 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <dl className="grid grid-cols-3 divide-x divide-border border-t border-border">
                <Stat label="Share to Oct" value={fmtPercent(row.shareNow)} />
                <Stat label="Dec forecast" value={fmtPercent(row.shareForecast)} muted />
                <Stat label="Dec plan" value={fmtPercent(row.shareScenario)} strong />
              </dl>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Stat({
  label,
  value,
  muted,
  strong,
}: {
  label: string
  value: string
  muted?: boolean
  strong?: boolean
}) {
  return (
    <div className="flex flex-col px-3 py-1.5">
      <dt className="text-[10.5px] text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          'num text-[13px]',
          muted && 'text-muted-foreground',
          strong && 'font-semibold text-brand-deep',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
