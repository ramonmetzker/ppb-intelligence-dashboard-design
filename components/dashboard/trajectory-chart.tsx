'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { REQUIRED_SCORE, trajectory } from '@/lib/ppb-data'
import { GRAMMAR } from '@/lib/ppb-grammar'

const SERIES = [
  { key: 'actual', label: 'Actual', color: GRAMMAR.actual, dashed: false },
  { key: 'forecast', label: 'Forecast', color: GRAMMAR.forecast, dashed: true },
  { key: 'optimized', label: 'Optimized', color: GRAMMAR.optimized, dashed: false },
] as const

const LAST_ACTUAL_INDEX = 9
const LAST_INDEX = 11

type TooltipEntry = { dataKey?: string | number; value?: number }

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const rows = SERIES.map((s) => ({
    ...s,
    value: payload.find((p) => p.dataKey === s.key)?.value,
  })).filter((r) => r.value !== undefined)

  return (
    <div className="min-w-[176px] rounded-lg border border-border bg-card px-3 py-2.5 text-[12px] shadow-md">
      <p className="mb-1.5 font-medium">{label}</p>
      <ul className="flex flex-col gap-1">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-muted-foreground">
              <svg width="16" height="4" aria-hidden="true">
                <line
                  x1="0"
                  x2="16"
                  y1="2"
                  y2="2"
                  stroke={r.color}
                  strokeWidth="2"
                  strokeDasharray={r.dashed ? '4 2.5' : undefined}
                />
              </svg>
              {r.label}
            </span>
            <span className="num-mono font-medium">{r.value?.toFixed(2)}</span>
          </li>
        ))}
        <li className="mt-1 flex items-center justify-between gap-6 border-t border-border pt-1.5">
          <span className="flex items-center gap-2 text-muted-foreground">
            <svg width="16" height="4" aria-hidden="true">
              <line x1="0" x2="16" y1="2" y2="2" stroke={GRAMMAR.target} strokeWidth="1" />
            </svg>
            Target
          </span>
          <span className="num-mono text-muted-foreground">{REQUIRED_SCORE}</span>
        </li>
      </ul>
    </div>
  )
}

type DotProps = { cx?: number; cy?: number; index?: number }

function transitionDot({ cx, cy, index }: DotProps) {
  if (index !== LAST_ACTUAL_INDEX || cx === undefined || cy === undefined) {
    return <g key={index} />
  }
  return (
    <g key={index}>
      <circle cx={cx} cy={cy} r={4.5} fill={GRAMMAR.actual} stroke="#fff" strokeWidth={2} />
      <text
        x={cx - 10}
        y={cy - 10}
        textAnchor="end"
        fill={GRAMMAR.actual}
        fontSize={12}
        fontWeight={600}
        fontFamily="var(--font-geist-mono)"
      >
        573.74
      </text>
    </g>
  )
}

function endLabel(color: string, value: string, name: string, dy: number) {
  return function EndLabel({ cx, cy, index }: DotProps) {
    if (index !== LAST_INDEX || cx === undefined || cy === undefined) {
      return <g key={index} />
    }
    return (
      <g key={index}>
        <circle cx={cx} cy={cy} r={4} fill="#fff" stroke={color} strokeWidth={2} />
        <text
          x={cx + 12}
          y={cy + dy}
          fill={color}
          fontSize={13}
          fontWeight={600}
          fontFamily="var(--font-geist-mono)"
        >
          {value}
        </text>
        <text x={cx + 12} y={cy + dy + 13} fill={GRAMMAR.axis} fontSize={11}>
          {name}
        </text>
      </g>
    )
  }
}

export function TrajectoryChart() {
  return (
    <div
      role="img"
      aria-label="Line chart of accumulated PPB score by month. Actual rises to 573.74 in October. Forecast, dashed, reaches 641.2 and optimized reaches 668.3 in December against a target of 662."
      className="h-[360px] w-full"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={trajectory}
          margin={{ top: 12, right: 92, bottom: 0, left: 0 }}
        >
          <CartesianGrid stroke={GRAMMAR.grid} vertical={false} />
          <ReferenceArea
            x1="Oct"
            x2="Dec"
            fill="#eef1f5"
            fillOpacity={0.8}
            ifOverflow="visible"
            label={{
              value: 'Projected',
              position: 'insideTopRight',
              fill: GRAMMAR.axis,
              fontSize: 11,
            }}
          />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={{ stroke: GRAMMAR.rule }}
            tick={{ fill: GRAMMAR.axis, fontSize: 12 }}
            padding={{ left: 12, right: 12 }}
          />
          <YAxis
            domain={[400, 700]}
            ticks={[400, 480, 560, 640, 700]}
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fill: GRAMMAR.axis, fontSize: 12, fontFamily: 'var(--font-geist-mono)' }}
          />
          <ReferenceLine
            x="Oct"
            stroke={GRAMMAR.actual}
            strokeOpacity={0.35}
            strokeWidth={1}
            label={{
              value: 'Oct close',
              position: 'insideTopLeft',
              fill: GRAMMAR.axis,
              fontSize: 11,
              dx: -64,
              dy: 2,
            }}
          />
          <ReferenceLine
            y={REQUIRED_SCORE}
            stroke={GRAMMAR.target}
            strokeWidth={1}
            label={{
              value: `Target ${REQUIRED_SCORE}`,
              position: 'insideTopLeft',
              fill: GRAMMAR.target,
              fontSize: 11,
              fontFamily: 'var(--font-geist-mono)',
              dy: -14,
            }}
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: GRAMMAR.rule, strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="optimized"
            stroke={GRAMMAR.optimized}
            strokeWidth={2.25}
            dot={endLabel(GRAMMAR.optimized, '668.3', 'Optimized', -6)}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke={GRAMMAR.forecast}
            strokeWidth={2.25}
            strokeDasharray="6 4"
            dot={endLabel(GRAMMAR.forecast, '641.2', 'Forecast', 8)}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke={GRAMMAR.actual}
            strokeWidth={2.25}
            dot={transitionDot}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
