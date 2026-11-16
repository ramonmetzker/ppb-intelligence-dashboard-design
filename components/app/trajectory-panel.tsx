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
  usePlotArea,
  useXAxisScale,
  useYAxisScale,
} from 'recharts'
import {
  BASE_FORECAST,
  REQUIRED_SCORE,
  fmt,
  type Simulation,
} from '@/lib/ppb-model'
import { Panel } from '@/components/app/panel'

const INK = 'var(--ink)'
const BRAND = 'var(--brand)'
const MUTED = '#8c8e95'
const GRID = 'var(--grid)'
const AXIS = 'var(--muted-foreground)'
const FONT_NUM = 'var(--font-space-grotesk)'

const COLORS = { actual: INK, forecast: MUTED, scenario: BRAND }

const LAST_ACTUAL_MONTH = 'Oct'
const LAST_MONTH = 'Dec'
const MIN_LABEL_GAP = 16

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
    { key: 'forecast', label: 'SOP' },
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

type EndLabel = {
  key: string
  text: string
  color: string
  weight: number
  size: number
  y: number
}

/** Keeps labels at least MIN_LABEL_GAP apart, moving them symmetrically around their natural spot. */
function spreadLabels(labels: EndLabel[], top: number, bottom: number): EndLabel[] {
  const sorted = [...labels].sort((a, b) => a.y - b.y)
  for (let pass = 0; pass < 6; pass += 1) {
    for (let i = 1; i < sorted.length; i += 1) {
      const overlap = MIN_LABEL_GAP - (sorted[i].y - sorted[i - 1].y)
      if (overlap > 0) {
        sorted[i - 1] = { ...sorted[i - 1], y: sorted[i - 1].y - overlap / 2 }
        sorted[i] = { ...sorted[i], y: sorted[i].y + overlap / 2 }
      }
    }
  }
  return sorted.map((l) => ({ ...l, y: Math.min(bottom, Math.max(top, l.y)) }))
}

function Annotations({
  sim,
  isBaseline,
  scenarioName,
}: {
  sim: Simulation
  isBaseline: boolean
  scenarioName: string
}) {
  const xScale = useXAxisScale()
  const yScale = useYAxisScale()
  const plot = usePlotArea()
  if (!xScale || !yScale || !plot) return null

  const xEnd = xScale(LAST_MONTH)
  const xActual = xScale(LAST_ACTUAL_MONTH)
  const yRequired = yScale(REQUIRED_SCORE)
  const yActual = yScale(sim.trajectory.find((p) => p.month === LAST_ACTUAL_MONTH)?.actual ?? 0)
  const yForecast = yScale(BASE_FORECAST)
  const yScenario = yScale(sim.yearEnd)
  if ([xEnd, xActual, yRequired, yActual, yForecast, yScenario].some((v) => v === undefined || Number.isNaN(v))) {
    return null
  }

  const endLabels: EndLabel[] = [
    ...(isBaseline
      ? []
      : [
          {
            key: 'forecast',
            text: fmt(BASE_FORECAST),
            color: MUTED,
            weight: 500,
            size: 12,
            y: yForecast as number,
          },
        ]),
    {
      key: 'scenario',
      text: fmt(sim.yearEnd),
      color: isBaseline ? MUTED : BRAND,
      weight: 600,
      size: 13,
      y: yScenario as number,
    },
  ]
  const placed = spreadLabels(endLabels, plot.y + 8, plot.y + plot.height - 4)
  const labelX = plot.x + plot.width + 10

  return (
    <g aria-hidden="true">
      <text
        x={plot.x + 8}
        y={(yRequired as number) - 7}
        fill={INK}
        fontSize={10.5}
        fontWeight={600}
        letterSpacing="0.04em"
      >
        {`REQUIRED ${REQUIRED_SCORE}`}
      </text>

      <text
        x={(xActual as number) + 10}
        y={plot.y + 12}
        fill={AXIS}
        fontSize={10}
        fontWeight={600}
        letterSpacing="0.08em"
      >
        PROJECTED
      </text>

      <text
        x={(xActual as number) - 10}
        y={(yActual as number) - 10}
        textAnchor="end"
        fill={INK}
        fontSize={12}
        fontWeight={600}
        fontFamily={FONT_NUM}
      >
        {fmt(sim.trajectory.find((p) => p.month === LAST_ACTUAL_MONTH)?.actual ?? 0)}
      </text>

      {placed.map((label) => (
        <text
          key={label.key}
          x={labelX}
          y={label.y}
          dominantBaseline="central"
          fill={label.color}
          fontSize={label.size}
          fontWeight={label.weight}
          fontFamily={FONT_NUM}
        >
          {label.text}
        </text>
      ))}
      <title>{`${scenarioName} ends at ${sim.yearEnd}`}</title>
    </g>
  )
}

export function TrajectoryPanel({
  sim,
  scenarioName,
}: {
  sim: Simulation
  scenarioName: string
}) {
  const isBaseline = sim.gain === 0

  const peak = Math.max(
    BASE_FORECAST,
    REQUIRED_SCORE,
    sim.yearEnd,
    ...sim.trajectory.flatMap((p) => [p.actual ?? 0, p.forecast ?? 0, p.scenario ?? 0]),
  )
  const top = Math.max(700, Math.ceil((peak + 12) / 20) * 20)
  const ticks = Array.from({ length: 8 }, (_, i) => 440 + i * 60).filter((t) => t <= top - 12)

  const markerAt = (month: string, fill: string, size: number, stroke = 'var(--card)') =>
    function Marker({ cx, cy, index }: DotProps) {
      const point = index === undefined ? undefined : sim.trajectory[index]
      if (!point || point.month !== month || cx === undefined || cy === undefined) {
        return <g key={index} />
      }
      return (
        <rect
          key={index}
          x={cx - size / 2}
          y={cy - size / 2}
          width={size}
          height={size}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.5}
        />
      )
    }

  return (
    <Panel
      id="trajectory"
      title="Annual PPB trajectory"
      description="Accumulated score. Actual through October, then the SOP baseline against your plan."
      className="h-full"
      action={
        <ul className="flex items-center gap-4 text-[11.5px] text-muted-foreground">
          <Legend color={INK} label="Actual" />
          <Legend color={MUTED} label="SOP" dashed />
          <Legend color={BRAND} label="Simulation" />
        </ul>
      }
      bodyClassName="flex px-3 pt-4 pb-3"
    >
      <div
        role="img"
        aria-label={`Line chart of accumulated PPB score. Actual reaches 573.74 in October. SOP baseline ends at ${BASE_FORECAST}. ${scenarioName} ends at ${sim.yearEnd} against a target of ${REQUIRED_SCORE}.`}
        className="min-h-[320px] w-full flex-1"
      >
        <ResponsiveContainer width="100%" height="100%" debounce={240}>
          <LineChart data={sim.trajectory} margin={{ top: 8, right: 56, bottom: 4, left: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <ReferenceArea
              x1={LAST_ACTUAL_MONTH}
              x2={LAST_MONTH}
              fill="var(--muted)"
              fillOpacity={0.7}
              ifOverflow="visible"
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={{ stroke: GRID }}
              tick={{ fill: AXIS, fontSize: 11.5 }}
              tickMargin={10}
              padding={{ left: 14, right: 14 }}
            />
            <YAxis
              domain={[420, top]}
              ticks={ticks}
              tickLine={false}
              axisLine={false}
              width={44}
              tickMargin={6}
              tick={{ fill: AXIS, fontSize: 11, fontFamily: FONT_NUM }}
            />
            <ReferenceLine y={REQUIRED_SCORE} stroke={INK} strokeWidth={1} />
            <Tooltip
              content={<ChartTooltip scenarioName={scenarioName} />}
              cursor={{ stroke: 'var(--input)', strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke={MUTED}
              strokeWidth={1.75}
              strokeDasharray="5 4"
              dot={isBaseline ? markerAt(LAST_MONTH, MUTED, 8) : markerAt(LAST_MONTH, 'var(--card)', 6, MUTED)}
              activeDot={{ r: 3.5 }}
              isAnimationActive={false}
              animationBegin={200}
              animationDuration={1000}
            />
            <Line
              type="monotone"
              dataKey="scenario"
              stroke={BRAND}
              strokeWidth={2.5}
              dot={markerAt(LAST_MONTH, BRAND, 8)}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
              animationBegin={500}
              animationDuration={900}
              hide={isBaseline}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke={INK}
              strokeWidth={2.5}
              dot={markerAt(LAST_ACTUAL_MONTH, INK, 8)}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
              animationDuration={1100}
            />
            <Annotations sim={sim} isBaseline={isBaseline} scenarioName={scenarioName} />
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
