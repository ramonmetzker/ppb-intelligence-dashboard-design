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

const COLORS = {
  actual: '#161a21',
  forecast: '#1687a7',
  optimized: '#0b4a5e',
  axis: '#5f6b7d',
  grid: '#e8ecf1',
}

const SERIES = [
  { key: 'actual', label: 'Actual', color: COLORS.actual },
  { key: 'forecast', label: 'Forecast', color: COLORS.forecast },
  { key: 'optimized', label: 'Optimized', color: COLORS.optimized },
] as const

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
    <div className="min-w-[168px] rounded-lg border border-border bg-card px-3 py-2.5 text-[12px] shadow-md">
      <p className="mb-1.5 font-medium">{label}</p>
      <ul className="flex flex-col gap-1">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="h-0.5 w-3 rounded-full"
                style={{ background: r.color }}
              />
              {r.label}
            </span>
            <span className="tnum font-medium">{r.value?.toFixed(2)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

type DotProps = { cx?: number; cy?: number; index?: number }

function lastActualDot({ cx, cy, index }: DotProps) {
  if (index !== 9 || cx === undefined || cy === undefined) return <g key={index} />
  return (
    <g key={index}>
      <circle cx={cx} cy={cy} r={7} fill={COLORS.forecast} opacity={0.15} />
      <circle cx={cx} cy={cy} r={4} fill={COLORS.actual} stroke="#fff" strokeWidth={2} />
    </g>
  )
}

function endDot(color: string, text: string, dy: number) {
  return function EndDot({ cx, cy, index }: DotProps) {
    if (index !== 11 || cx === undefined || cy === undefined) return <g key={index} />
    return (
      <g key={index}>
        <circle cx={cx} cy={cy} r={4} fill="#fff" stroke={color} strokeWidth={2} />
        <text
          x={cx + 10}
          y={cy + dy}
          fill={color}
          fontSize={12}
          fontWeight={600}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {text}
        </text>
      </g>
    )
  }
}

export function TrajectoryChart() {
  return (
    <div>
      <div
        className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-muted-foreground"
        aria-hidden="true"
      >
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-2">
            <svg width="22" height="6">
              <line
                x1="0"
                x2="22"
                y1="3"
                y2="3"
                stroke={s.color}
                strokeWidth="2"
                strokeDasharray={s.key === 'optimized' ? '5 3' : undefined}
              />
            </svg>
            {s.label}
          </span>
        ))}
        <span className="flex items-center gap-2">
          <svg width="22" height="6">
            <line x1="0" x2="22" y1="3" y2="3" stroke="#8b95a5" strokeWidth="1" strokeDasharray="2 2" />
          </svg>
          Required 662
        </span>
      </div>

      <div
        role="img"
        aria-label="Line chart of accumulated PPB score by month. Actual rises to 573.74 in October. Forecast reaches 641.2 and optimized reaches 668.3 in December against a required 662."
        className="h-[340px] w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trajectory}
            margin={{ top: 12, right: 64, bottom: 0, left: 0 }}
          >
            <CartesianGrid stroke={COLORS.grid} vertical={false} />
            <ReferenceArea
              x1="Oct"
              x2="Dec"
              fill="#eef1f5"
              fillOpacity={0.9}
              ifOverflow="visible"
              label={{
                value: 'Projected',
                position: 'insideTopRight',
                fill: COLORS.axis,
                fontSize: 11,
              }}
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={{ stroke: '#d3dae3' }}
              tick={{ fill: COLORS.axis, fontSize: 12 }}
              padding={{ left: 12, right: 12 }}
            />
            <YAxis
              domain={[400, 700]}
              ticks={[400, 480, 560, 640, 700]}
              tickLine={false}
              axisLine={false}
              width={44}
              tick={{ fill: COLORS.axis, fontSize: 12 }}
            />
            <ReferenceLine
              y={REQUIRED_SCORE}
              stroke="#8b95a5"
              strokeDasharray="2 3"
              label={{
                value: 'Required 662',
                position: 'insideTopLeft',
                fill: COLORS.axis,
                fontSize: 11,
                dy: -14,
              }}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: '#b9c2cf', strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke={COLORS.actual}
              strokeWidth={2.25}
              dot={lastActualDot}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="optimized"
              stroke={COLORS.optimized}
              strokeWidth={2}
              strokeDasharray="6 4"
              dot={endDot(COLORS.optimized, '668.3', -2)}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke={COLORS.forecast}
              strokeWidth={2.25}
              dot={endDot(COLORS.forecast, '641.2', 14)}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
