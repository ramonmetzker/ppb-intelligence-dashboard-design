'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { SopDemand } from '@/lib/sop-demand/data'
import { StatusBadge } from './sop-demand-view'

const number = new Intl.NumberFormat('en-US')

export function SopDemandDetails({ row, onClose }: { row: SopDemand | null; onClose: () => void }) {
  const fields = row
    ? [
        ['Family', row.family],
        ['Product', row.product],
        ['Region', row.region],
        ['Plant', row.plant],
        ['Owner', row.owner],
        ['Need date', row.needDate],
        ['Demand', number.format(row.demand)],
        ['Supply', number.format(row.supply)],
        ['Gap', number.format(row.gap)],
        ['Forecast accuracy', `${row.accuracy.toFixed(1)}%`],
        ['Unit price', `$${row.unitPrice.toFixed(2)}`],
        ['Revenue', `$${number.format(row.revenue)}`],
      ]
    : []

  return (
    <Dialog open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-mono">{row?.itemCode}</span>
            {row && <StatusBadge status={row.status} />}
          </DialogTitle>
          <DialogDescription>{row?.description}</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="tnum font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  )
}
