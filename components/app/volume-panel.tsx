'use client'

import { useMemo, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ITEMS,
  LAST_ACTUAL,
  baselineSeries,
  buildSeries,
  fmt,
  fmtPercent,
  fmtVolume,
  type SeriesRow,
  type VolumeMode,
} from '@/lib/ppb-model'
import { CountUp } from '@/components/app/count-up'
import { Panel } from '@/components/app/panel'
import { usePlan } from '@/components/app/plan-provider'
import { Segmented } from '@/components/app/segmented'
import { cn } from '@/lib/utils'

const INK = 'var(--ink)'
const BRAND = 'var(--brand)'
const MUTED = '#8793ad'
const GRID = 'var(--grid)'
const AXIS = 'var(--muted-foreground)'

type LineMetric = 'share' | 'points'
type MatrixMetric = 'sharePoints' | 'volume'

const MODE_OPTIONS = [
  { value: 'monthly' as const, label: 'Monthly' },
  { value: 'accumulated' as const, label: 'Accumulated' },
]

export function VolumePanel({ layout = 'overview' }: { layout?: 'overview' | 'full' }) {
  const { plan, planName } = usePlan()
  const [mode, setMode] = useState<VolumeMode>('monthly')
  const [lineMetric, setLineMetric] = useState<LineMetric>('share')
  const [matrixMetric, setMatrixMetric] = useState<MatrixMetric>('sharePoints')

  const series = useMemo(() => buildSeries(plan, mode), [plan, mode])
  const base = baselineSeries(mode)

  const data = useMemo(
    () =>
      series.map((row, i) => {
        const entry: Record<string, number | string | boolean | undefined> = {
          month: row.month,
          projected: row.projected,
          totalVolume: row.total.volume,
          share: row.total.share,
          points: row.total.points,
          baseShare: i >= LAST_ACTUAL ? base[i].total.share : undefined,
          basePoints: i >= LAST_ACTUAL ? base[i].total.points : undefined,
        }
        ITEMS.forEach((item) => {
          entry[`vol_${item.key}`] = row.cells[item.key].volume
        })
        return entry
      }),
    [series, base],
  )

  const rightDomain = useMemo<[number, number]>(() => {
    if (lineMetric === 'share') return [0, 0.8]
    const values = data.flatMap((d) => [d.points as number, d.basePoints as number | undefined])
    const nums = values.filter((v): v is number => typeof v === 'number')
    return [Math.floor((Math.min(...nums) - 40) / 50) * 50, Math.ceil((Math.max(...nums) + 40) / 50) * 50]
  }, [data, lineMetric])

  const lineKey = lineMetric === 'share' ? 'share' : 'points'
  const baseKey = lineMetric === 'share' ? 'baseShare' : 'basePoints'
  const rightFormat = (v: number) => (lineMetric === 'share' ? `${Math.round(v * 100)}%` : `${v}`)

  const modeNote =
    mode === 'monthly'
      ? 'Each month on its own. Points are what that month would score if it were the whole year.'
      : 'Each month absorbs the ones before it. Share and points use year-to-date volume, and December equals the year-end score.'

  return (
    <Panel
      id="volume"
      title="Production volume, local share and points"
      description="Volume by PPB item, with the local share and points each item earns, month by month."
      action={
        <Segmented label="View" value={mode} options={MODE_OPTIONS} onChange={setMode} />
      }
      bodyClassName="p-0"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 pt-3">
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
          {ITEMS.map((item) => (
            <li key={item.key} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="size-2 rounded-[1px]"
                style={{ background: item.color }}
              />
              {item.name}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <svg width="16" height="4" aria-hidden="true">
              <line x1="0" x2="16" y1="2" y2="2" stroke={INK} strokeWidth="2" />
            </svg>
            {planName}
          </li>
          <li className="flex items-center gap-1.5">
            <svg width="16" height="4" aria-hidden="true">
              <line x1="0" x2="16" y1="2" y2="2" stroke={MUTED} strokeWidth="2" strokeDasharray="4 2.5" />
            </svg>
            Forecast
          </li>
        </ul>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Line shows</span>
          <Segmented
            label="Line metric"
            value={lineMetric}
            options={[
              { value: 'share', label: 'Local share' },
              { value: 'points', label: 'Total points' },
            ]}
            onChange={setLineMetric}
          />
        </div>
      </div>

      <div
        role="img"
        aria-label={`Stacked bars of ${mode} production volume by PPB item with a line for total ${
          lineMetric === 'share' ? 'local share' : 'points'
        }. December total: ${fmt(series[11].total.points, 1)} points at ${fmtPercent(series[11].total.share)} local share.`}
        className="h-[250px] px-2 pt-2"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 6, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <ReferenceArea
              yAxisId="left"
              x1="Nov"
              x2="Dec"
              fill="var(--brand-soft)"
              fillOpacity={0.7}
              ifOverflow="visible"
              label={{ value: 'Open months', position: 'insideTop', fill: AXIS, fontSize: 10.5 }}
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={{ stroke: GRID }}
              tick={{ fill: AXIS, fontSize: 11.5 }}
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(v: number) => fmtVolume(v)}
              tick={{ fill: AXIS, fontSize: 11, fontFamily: 'var(--font-space-grotesk)' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={rightDomain}
              tickLine={false}
              axisLine={false}
              width={40}
              tickFormatter={rightFormat}
              tick={{ fill: AXIS, fontSize: 11, fontFamily: 'var(--font-space-grotesk)' }}
            />
            <Tooltip
              content={<VolumeTooltip rows={series} baseRows={base} mode={mode} />}
              cursor={{ fill: 'color-mix(in srgb, var(--brand) 5%, transparent)' }}
            />
            {ITEMS.map((item) => (
              <Bar
                key={item.key}
                yAxisId="left"
                dataKey={`vol_${item.key}`}
                stackId="volume"
                fill={item.color}
                maxBarSize={34}
                isAnimationActive
                animationDuration={900}
                animationEasing="ease-out"
              />
            ))}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey={baseKey}
              stroke={MUTED}
              strokeWidth={1.75}
              strokeDasharray="5 4"
              dot={false}
              connectNulls={false}
              isAnimationActive
              animationBegin={300}
              animationDuration={1000}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey={lineKey}
              stroke={INK}
              strokeWidth={2.25}
              dot={{ r: 2.5, fill: 'var(--card)', stroke: INK, strokeWidth: 1.5 }}
              activeDot={{ r: 4 }}
              isAnimationActive
              animationBegin={300}
              animationDuration={1100}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="border-t border-border">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
          <p className="max-w-[640px] text-[11.5px] leading-4 text-muted-foreground">{modeNote}</p>
          {layout === 'overview' && (
            <Segmented
              label="Table metric"
              value={matrixMetric}
              options={[
                { value: 'sharePoints', label: 'Share and points' },
                { value: 'volume', label: 'Volume' },
              ]}
              onChange={setMatrixMetric}
            />
          )}
        </div>

        {layout === 'full' ? (
          <div className="flex flex-col gap-4 pb-3">
            <Matrix series={series} base={base} metric="sharePoints" />
            <Matrix series={series} base={base} metric="volume" />
          </div>
        ) : (
          <Matrix series={series} base={base} metric={matrixMetric} />
        )}
      </div>
    </Panel>
  )
}

/* -------------------------------------------------------------------------- */

const heat = (share: number) =>
  `color-mix(in srgb, var(--brand) ${((0.04 + share * 0.3) * 100).toFixed(1)}%, transparent)`

function Matrix({
  series,
  base,
  metric,
}: {
  series: SeriesRow[]
  base: SeriesRow[]
  metric: MatrixMetric
}) {
  const isShare = metric === 'sharePoints'
  const openStart = (i: number) => i === LAST_ACTUAL + 1

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-[12px]">
        <caption className="sr-only">
          {isShare
            ? 'Local share and points by PPB item and month'
            : 'Production volume in thousands of units by PPB item and month'}
        </caption>
        <thead>
          <tr className="border-y border-border bg-secondary/50">
            <th
              scope="col"
              className="w-[150px] px-4 py-1.5 text-left text-[10px] font-medium tracking-[0.08em] text-muted-foreground uppercase"
            >
              {isShare ? 'Share over points' : 'Volume'}
            </th>
            {series.map((row) => (
              <th
                key={row.month}
                scope="col"
                className={cn(
                  'px-2 py-1.5 text-right text-[11px] font-medium',
                  row.projected && 'text-brand-deep',
                  openStart(row.index) && 'border-l border-dashed border-brand/60',
                )}
              >
                {row.month}
                {row.projected && (
                  <span className="block text-[9px] leading-3 font-medium tracking-[0.08em] uppercase">
                    Plan
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ITEMS.map((item, rowIndex) => (
            <tr key={item.key} className="border-b border-border/70">
              <th scope="row" className="px-4 py-1.5 text-left font-medium">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0 rounded-[1px]"
                    style={{ background: item.color }}
                  />
                  {item.name}
                </span>
              </th>
              {series.map((row) => {
                const cell = row.cells[item.key]
                const changed =
                  row.projected &&
                  Math.abs(cell.share - base[row.index].cells[item.key].share) > 0.0004
                return (
                  <td
                    key={row.month}
                    className={cn(
                      'cell-in px-2 py-1.5 text-right',
                      openStart(row.index) && 'border-l border-dashed border-brand/60',
                    )}
                    style={
                      {
                        ...(isShare ? { background: heat(cell.share) } : {}),
                        '--cell-delay': `${300 + row.index * 45 + rowIndex * 60}ms`,
                      } as React.CSSProperties
                    }
                  >
                    {isShare ? (
                      <>
                        <span
                          className={cn(
                            'num block text-[12.5px] leading-4 font-medium',
                            changed && 'text-brand-deep',
                          )}
                        >
                          {fmtPercent(cell.share)}
                        </span>
                        <span className="num block text-[10.5px] leading-4 text-muted-foreground">
                          {fmt(cell.points, 1)}
                        </span>
                      </>
                    ) : (
                      <span className="num text-[12.5px]">{fmtVolume(cell.volume)}</span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-foreground/80 bg-secondary/50">
            <th scope="row" className="px-4 py-1.5 text-left font-semibold">
              {isShare ? 'All items' : 'Total volume'}
            </th>
            {series.map((row) => (
              <td
                key={row.month}
                className={cn(
                  'px-2 py-1.5 text-right',
                  openStart(row.index) && 'border-l border-dashed border-brand/60',
                )}
              >
                {isShare ? (
                  <>
                    <CountUp
                      value={row.total.share * 100}
                      decimals={1}
                      suffix="%"
                      duration={900}
                      delay={row.index * 50}
                      className="num block text-[12.5px] leading-4 font-semibold"
                    />
                    <CountUp
                      value={row.total.points}
                      decimals={1}
                      duration={900}
                      delay={row.index * 50}
                      className="num block text-[11.5px] leading-4 font-semibold text-brand-deep"
                    />
                  </>
                ) : (
                  <span className="num text-[12.5px] font-semibold">
                    {fmtVolume(row.total.volume)}
                  </span>
                )}
              </td>
            ))}
          </tr>
          {isShare && (
            <tr className="border-t border-border/70">
              <th scope="row" className="px-4 py-1.5 text-left text-[11.5px] font-medium text-muted-foreground">
                Total volume
              </th>
              {series.map((row) => (
                <td
                  key={row.month}
                  className={cn(
                    'num px-2 py-1.5 text-right text-[11.5px] text-muted-foreground',
                    openStart(row.index) && 'border-l border-dashed border-brand/60',
                  )}
                >
                  {fmtVolume(row.total.volume)}
                </td>
              ))}
            </tr>
          )}
        </tfoot>
      </table>
    </div>
  )
}

/* -------------------------------------------------------------------------- */

type TipProps = {
  active?: boolean
  label?: string
  rows: SeriesRow[]
  baseRows: SeriesRow[]
  mode: VolumeMode
}

function VolumeTooltip({ active, label, rows, baseRows, mode }: TipProps) {
  if (!active || !label) return null
  const row = rows.find((r) => r.month === label)
  if (!row) return null
  const base = baseRows[row.index]
  const showBase = row.projected && Math.abs(base.total.points - row.total.points) > 0.005

  return (
    <div className="min-w-[210px] rounded-md border border-border bg-card px-3 py-2 text-[12px] shadow-sm">
      <p className="font-display mb-1.5 font-semibold">
        {label} <span className="font-normal text-muted-foreground">{mode}</span>
      </p>
      <ul className="flex flex-col gap-1">
        {ITEMS.map((item) => (
          <li key={item.key} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                aria-hidden="true"
                className="size-2 rounded-[1px]"
                style={{ background: item.color }}
              />
              {item.name}
            </span>
            <span className="num font-medium">
              {fmtVolume(row.cells[item.key].volume)}
              <span className="text-muted-foreground">
                {' '}
                {fmtPercent(row.cells[item.key].share, 0)}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-1.5 flex flex-col gap-0.5 border-t border-border pt-1.5">
        <p className="flex justify-between">
          <span className="text-muted-foreground">Local share</span>
          <span className="num font-semibold">{fmtPercent(row.total.share)}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-muted-foreground">Total points</span>
          <span className="num font-semibold" style={{ color: BRAND }}>
            {fmt(row.total.points, 1)}
          </span>
        </p>
        {showBase && (
          <p className="flex justify-between">
            <span className="text-muted-foreground">Forecast points</span>
            <span className="num">{fmt(base.total.points, 1)}</span>
          </p>
        )}
      </div>
    </div>
  )
}
