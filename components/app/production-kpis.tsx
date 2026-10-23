'use client'

import { useMemo } from 'react'
import {
  LAST_ACTUAL,
  baselineSeries,
  buildSeries,
  fmtPercent,
  fmtVolume,
} from '@/lib/ppb-model'
import { usePlan } from '@/components/app/plan-provider'

export function ProductionKpis() {
  const { plan, planName } = usePlan()
  const acc = useMemo(() => buildSeries(plan, 'accumulated'), [plan])
  const base = baselineSeries('accumulated')
  const oct = acc[LAST_ACTUAL].total
  const dec = acc[11].total
  const baseDec = base[11].total

  const items = [
    { label: 'Produced through Oct', value: fmtVolume(oct.volume), note: 'Units across all PPB items' },
    { label: 'Local share through Oct', value: fmtPercent(oct.share), note: 'Volume-weighted' },
    { label: 'Projected year volume', value: fmtVolume(dec.volume), note: 'Plan holds volume fixed' },
    {
      label: 'Year-end local share',
      value: fmtPercent(dec.share),
      note: `Forecast ${fmtPercent(baseDec.share)}. ${planName}`,
    },
  ]

  return (
    <dl className="grid grid-cols-2 divide-x divide-y divide-border rounded-lg border border-border bg-card md:grid-cols-4 md:divide-y-0">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-0.5 px-4 py-2.5">
          <dt className="eyebrow">{item.label}</dt>
          <dd className="num text-[22px] leading-7 font-semibold">{item.value}</dd>
          <p className="truncate text-[11.5px] text-muted-foreground">{item.note}</p>
        </div>
      ))}
    </dl>
  )
}
