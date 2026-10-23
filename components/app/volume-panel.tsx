'use client'

import { useMemo, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ITEMS,
  ZERO_LEVERS,
  fmtPercent,
  fmtVolume,
  volumeSeries,
  type ItemKey,
  type Levers,
  type VolumeMode,
  type VolumeRow,
} from '@/lib/ppb-model'
import { Panel } from '@/components/app/panel'
import { cn } from '@/lib/utils'

const GRID = '#e6eaf4'
const AXIS = '#586380'
const SHARE = '#0a1128'

const MODES: { value: VolumeMode; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'accumulated', label: 'Accumulated' },
]

type ChartRow = VolumeRow & { baseShare: number }

type TooltipPayload = { payload?: ChartRow }

function VolumeTooltip({
  active,
  payload,
  label,
  mode,
}: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
  mode: VolumeMode
}) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  return (
    <div className="min-w-[210px] rounded-md border border-border bg-card px-3 py-2 text-[12px] shadow-sm">
      <p className="font-display mb-1.5 flex items-center justify-between font-semibold">
        <span>
          {label}
          {mode === 'accumulated' ? ' (Jan to ' + label + ')' : ''}
        </span>
        {row.projected && (
          <span className="text-[10px] font-medium text-muted-foreground uppercase">
            Projected
          </span>
        )}
      </p>
      <ul className="flex flex-col gap-1">
        {ITEMS.map((i) => (
          <li key={i.key} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                aria-hidden="true"
                className="size-2 rounded-[1px]"
                style={{ background: i.color }}
              />
              {i.name}
            </span>
            <span className="num font-medium">{fmtVolume(row[i.key])}</span>
          </li>
        ))}
        <li className="mt-1 flex items-center justify-between gap-6 border-t border-border pt-1.5">
          <span className="text-muted-foreground">Total</span>
          <span className="num font-semibold">{fmtVolume(row.total)}</span>
        </li>
        <li className="flex items-center justify-between gap-6">
          <span className="text-muted-foreground">Local share</span>
          <span className="num font-semibold">{fmtPercent(row.share)}</span>
        </li>
      </ul>
    </div>
  )
}

export function VolumePanel({ levers }: { levers: Levers }) {
  const [mode, setMode] = useState<VolumeMode>('monthly')
  const [hidden, setHidden] = useState<Set<ItemKey>>(new Set())

  const data: ChartRow[] = useMemo(() => {
    const scenario = volumeSeries(levers, mode)
    const baseline = volumeSeries(ZERO_LEVERS, mode)
    return scenario.map((row, i) => ({ ...row, baseShare: baseline[i].share }))
  }, [levers, mode])

  const last = data[data.length - 1]
  const shareDelta = last.share - last.baseShare
  const toggle = (key: ItemKey) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  return (
    <Panel
      id="volume"
      title="Production volume by PPB item"
      description={
        mode === 'monthly'
          ? 'Units built each month. Local share is calculated on that month alone.'
          : 'Each month absorbs every prior month. Local share is recalculated on the running total.'
      }
      action={
        <div
          role="radiogroup"
          aria-label="Volume view"
          className="flex rounded-md border border-input p-0.5"
        >
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={mode === m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                'h-6 rounded-[3px] px-2.5 text-[12px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring',
                mode === m.value
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      }
      bodyClassName="p-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-3">
        <ul className="flex flex-wrap items-center gap-1.5" aria-label="Toggle items">
          {ITEMS.map((i) => {
            const off = hidden.has(i.key)
            return (
              <li key={i.key}>
                <button
                  type="button"
                  aria-pressed={!off}
                  onClick={() => toggle(i.key)}
                  className={cn(
                    'flex h-6 items-center gap-1.5 rounded-md border px-2 text-[11.5px] font-medium transition-colors',
                    off
                      ? 'border-border text-muted-foreground/70'
                      : 'border-input bg-card hover:bg-secondary',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="size-2 rounded-[1px]"
                    style={{ background: off ? '#c9d2e6' : i.color }}
                  />
                  {i.name}
                </button>
              </li>
            )
          })}
        </ul>
        <p className="flex items-center gap-4 text-[11.5px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <svg width="16" height="4" aria-hidden="true">
              <line x1="0" x2="16" y1="2" y2="2" stroke={SHARE} strokeWidth="2" />
            </svg>
            Local share, scenario
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="16" height="4" aria-hidden="true">
              <line x1="0" x2="16" y1="2" y2="2" stroke="#8793ad" strokeWidth="1.5" strokeDasharray="3 2" />
            </svg>
            Baseline
          </span>
        </p>
      </div>

      <div
        role="img"
        aria-label={`Stacked bar chart of ${mode} production volume for ${ITEMS.length} PPB items from January to December, with local share overlaid. December ${mode === 'accumulated' ? 'accumulated' : ''} total ${fmtVolume(last.total)}, local share ${fmtPercent(last.share)}.`}
        className="h-[290px] w-full px-2 pt-2"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={{ stroke: GRID }}
              tick={{ fill: AXIS, fontSize: 11.5 }}
            />
            <YAxis
              yAxisId="vol"
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(v: number) => fmtVolume(v)}
              tick={{ fill: AXIS, fontSize: 11, fontFamily: 'var(--font-space-grotesk)' }}
            />
            <YAxis
              yAxisId="share"
              orientation="right"
              domain={[
                (min: number) => Math.floor((min - 0.03) * 100) / 100,
                (max: number) => Math.ceil((max + 0.03) * 100) / 100,
              ]}
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
              tick={{ fill: AXIS, fontSize: 11, fontFamily: 'var(--font-space-grotesk)' }}
            />
            <Tooltip
              content={<VolumeTooltip mode={mode} />}
              cursor={{ fill: '#edf0f8', fillOpacity: 0.7 }}
            />
            {ITEMS.map((item) =>
              hidden.has(item.key) ? null : (
                <Bar
                  key={item.key}
                  yAxisId="vol"
                  dataKey={item.key}
                  stackId="volume"
                  fill={item.color}
                  maxBarSize={34}
                  isAnimationActive={false}
                >
                  {data.map((row) => (
                    <Cell key={row.month} fillOpacity={row.projected ? 0.55 : 1} />
                  ))}
                </Bar>
              ),
            )}
            <Line
              yAxisId="share"
              dataKey="baseShare"
              stroke="#8793ad"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
              isAnimationActive={false}
              activeDot={false}
            />
            <Line
              yAxisId="share"
              dataKey="share"
              stroke={SHARE}
              strokeWidth={2}
              dot={{ r: 2.5, fill: '#fff', stroke: SHARE, strokeWidth: 1.5 }}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto border-t border-border">
        <table className="w-full min-w-[820px] text-[11.5px]">
          <caption className="sr-only">
            {mode === 'monthly' ? 'Monthly' : 'Accumulated'} production volume in thousands of units
          </caption>
          <thead>
            <tr className="text-left text-[10px] tracking-[0.06em] text-muted-foreground uppercase">
              <th scope="col" className="px-4 py-1.5 font-medium">
                Item
              </th>
              {data.map((row) => (
                <th
                  key={row.month}
                  scope="col"
                  className={cn(
                    'px-1.5 py-1.5 text-right font-medium',
                    row.projected && 'bg-secondary/70',
                  )}
                >
                  {row.month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ITEMS.map((item) => (
              <tr key={item.key} className="border-t border-border/70">
                <th scope="row" className="px-4 py-1.5 text-left font-medium">
                  <span
                    aria-hidden="true"
                    className="mr-2 inline-block size-2 rounded-[1px] align-middle"
                    style={{ background: item.color }}
                  />
                  {item.name}
                </th>
                {data.map((row) => (
                  <td
                    key={row.month}
                    className={cn(
                      'num px-1.5 py-1.5 text-right text-muted-foreground',
                      row.projected && 'bg-secondary/70',
                    )}
                  >
                    {fmtVolume(row[item.key])}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-border bg-secondary/40 font-medium">
              <th scope="row" className="px-4 py-1.5 text-left">
                Total volume
              </th>
              {data.map((row) => (
                <td
                  key={row.month}
                  className={cn('num px-1.5 py-1.5 text-right', row.projected && 'bg-secondary/70')}
                >
                  {fmtVolume(row.total)}
                </td>
              ))}
            </tr>
            <tr className="border-t border-border/70 font-medium">
              <th scope="row" className="px-4 py-1.5 text-left">
                Local share
              </th>
              {data.map((row, i) => {
                const lift = row.share - row.baseShare
                return (
                  <td
                    key={row.month}
                    className={cn(
                      'num px-1.5 py-1.5 text-right',
                      row.projected && 'bg-secondary/70',
                      i > 9 && lift > 0.0005 && 'text-brand',
                    )}
                  >
                    {fmtPercent(row.share)}
                  </td>
                )
              })}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="border-t border-border px-4 py-2 text-[11.5px] text-muted-foreground">
        {shareDelta > 0.0005 ? (
          <>
            This scenario lifts December {mode === 'accumulated' ? 'year-to-date ' : ''}local share by{' '}
            <span className="num font-medium text-brand">
              {(shareDelta * 100).toFixed(2)} pts
            </span>{' '}
            versus the baseline. Only November and December change, because October is closed.
          </>
        ) : shareDelta < -0.0005 ? (
          <>
            This scenario lowers December {mode === 'accumulated' ? 'year-to-date ' : ''}local share by{' '}
            <span className="num font-medium text-critical">
              {(Math.abs(shareDelta) * 100).toFixed(2)} pts
            </span>{' '}
            versus the baseline.
          </>
        ) : (
          'Baseline volumes. Select a scenario to see how local share changes in November and December.'
        )}
      </p>
    </Panel>
  )
}
