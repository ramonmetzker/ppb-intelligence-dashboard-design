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
import {
  BASE_FORECAST,
  REQUIRED_SCORE,
  fmt,
  type Simulation,
} from '@/lib/ppb-model'
import { Panel } from '@/components/app/panel'

const INK = '#0a1128'
const BRAND = '#2457e6'
const MUTED = '#8793ad'
const GRID = '#e6eaf4'
const AXIS = '#586380'

const COLORS = { actual: INK, forecast: MUTED, scenario: BRAND }

type TooltipEntry = { dataKey?: string | number; value?: number }

function ChartTooltip({
  active,
  payload,
  label,
  scenarioName,
}: {
  active?: boolean
  payload?: TooltipEntry[]
  label?: string
  scenarioName: string
}) {
  if (!active || !payload?.length) return null
  const rows = [
    { key: 'actual', label: 'Actual' },
    { key: 'forecast', label: 'Forecast' },
    { key: 'scenario', label: scenarioName },
  ]
    .map((r) => ({ ...r, value: payload.find((p) => p.dataKey === r.key)?.value }))
    .filter((r) => r.value !== undefined)

  return (
    <div className="min-w-[180px] rounded-md border border-border bg-card px-3 py-2 text-[12px] shadow-sm">
      <p className="font-display mb-1.5 font-semibold">{label}</p>
      <ul className="flex flex-col gap-1">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                aria-hidden="true"
                className="size-2 rounded-[1px]"
                style={{ background: COLORS[r.key as keyof typeof COLORS] }}
              />
              <span className="max-w-[110px] truncate">{r.label}</span>
            </span>
            <span className="num font-medium">{fmt(r.value as number)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

type DotProps = { cx?: number; cy?: number; index?: number }

export function TrajectoryPanel({
  sim,
  scenarioName,
}: {
  sim: Simulation
  scenarioName: string
}) {
  const isBaseline = sim.gain === 0
  const scenarioAbove = sim.yearEnd >= BASE_FORECAST
  const scenarioLabelOffset = isBaseline ? 4 : scenarioAbove ? -2 : 12
  const forecastLabelOffset = scenarioAbove ? 12 : -2

  const scenarioDot = ({ cx, cy, index }: DotProps) => {
    if (index !== 11 || cx === undefined || cy === undefined) return <g key={index} />
    return (
      <g key={index}>
        <rect x={cx - 4} y={cy - 4} width={8} height={8} fill={BRAND} stroke="#fff" strokeWidth={1.5} />
        <text
          x={cx + 10}
          y={cy + scenarioLabelOffset}
          fill={BRAND}
          fontSize={13}
          fontWeight={600}
          fontFamily="var(--font-space-grotesk)"
        >
          {fmt(sim.yearEnd)}
        </text>
      </g>
    )
  }

  const forecastDot = ({ cx, cy, index }: DotProps) => {
    if (index !== 11 || cx === undefined || cy === undefined || isBaseline)
      return <g key={index} />
    return (
      <g key={index}>
        <rect x={cx - 3} y={cy - 3} width={6} height={6} fill="#fff" stroke={MUTED} strokeWidth={1.5} />
        <text
          x={cx + 10}
          y={cy + forecastLabelOffset}
          fill={MUTED}
          fontSize={12}
          fontWeight={500}
          fontFamily="var(--font-space-grotesk)"
        >
          {fmt(BASE_FORECAST)}
        </text>
      </g>
    )
  }

  const actualDot = ({ cx, cy, index }: DotProps) => {
    if (index !== 9 || cx === undefined || cy === undefined) return <g key={index} />
    return (
      <g key={index}>
        <rect x={cx - 4} y={cy - 4} width={8} height={8} fill={INK} stroke="#fff" strokeWidth={1.5} />
        <text
          x={cx - 10}
          y={cy - 8}
          textAnchor="end"
          fill={INK}
          fontSize={12}
          fontWeight={600}
          fontFamily="var(--font-space-grotesk)"
        >
          573.74
        </text>
      </g>
    )
  }

  return (
    <Panel
      id="trajectory"
      title="Annual PPB trajectory"
      description="Accumulated score. Actual through October, then the AI forecast against your plan."
      className="h-full"
      action={
        <ul className="flex items-center gap-3 text-[11.5px] text-muted-foreground">
          <Legend color={INK} label="Actual" />
          <Legend color={MUTED} label="Forecast" dashed />
          <Legend color={BRAND} label="Plan" />
        </ul>
      }
      bodyClassName="flex p-3"
    >
      <div
        role="img"
        aria-label={`Line chart of accumulated PPB score. Actual reaches 573.74 in October. Baseline forecast ends at ${BASE_FORECAST}. ${scenarioName} ends at ${sim.yearEnd} against a target of ${REQUIRED_SCORE}.`}
        className="min-h-[300px] w-full flex-1"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sim.trajectory} margin={{ top: 12, right: 64, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <ReferenceArea
              x1="Oct"
              x2="Dec"
              fill="#edf0f8"
              fillOpacity={0.7}
              ifOverflow="visible"
              label={{ value: 'Projected', position: 'insideTopRight', fill: AXIS, fontSize: 10.5 }}
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={{ stroke: GRID }}
              tick={{ fill: AXIS, fontSize: 11.5 }}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              domain={[420, 700]}
              ticks={[440, 520, 600, 660, 700]}
              tickLine={false}
              axisLine={false}
              width={36}
              tick={{ fill: AXIS, fontSize: 11, fontFamily: 'var(--font-space-grotesk)' }}
            />
            <ReferenceLine
              y={REQUIRED_SCORE}
              stroke={INK}
              strokeWidth={1}
              label={{
                value: `Required ${REQUIRED_SCORE}`,
                position: 'insideTopLeft',
                fill: INK,
                fontSize: 10.5,
                dy: -13,
              }}
            />
            <Tooltip
              content={<ChartTooltip scenarioName={scenarioName} />}
              cursor={{ stroke: '#c9d2e6', strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke={MUTED}
              strokeWidth={1.75}
              strokeDasharray="5 4"
              dot={forecastDot}
              activeDot={{ r: 3.5 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="scenario"
              stroke={BRAND}
              strokeWidth={2.5}
              dot={scenarioDot}
              activeDot={{ r: 4 }}
              isAnimationActive
              animationDuration={450}
              hide={isBaseline}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke={INK}
              strokeWidth={2.5}
              dot={actualDot}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  )
}

function Legend({
  color,
  label,
  dashed,
}: {
  color: string
  label: string
  dashed?: boolean
}) {
  return (
    <li className="flex items-center gap-1.5">
      <svg width="16" height="4" aria-hidden="true">
        <line
          x1="0"
          x2="16"
          y1="2"
          y2="2"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={dashed ? '4 2.5' : undefined}
        />
      </svg>
      {label}
    </li>
  )
}
