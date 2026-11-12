'use client'

import { X } from '@phosphor-icons/react'
import { DataTable } from '@/components/data-table/data-table'
import { PageHeader } from '@/components/app/page-header'
import { useMaterials } from '@/components/materials/material-provider'
import { MaterialPricesImportDialog } from '@/components/materials/material-prices-import-dialog'
import { ITEMS } from '@/lib/ppb-model'
import { OPEN_ENDED_DATE, ppbItemLabel, type MaterialPrice } from '@/lib/material-price-data'
import type { DataTableColumnDefinition } from '@/lib/data-table/types'
import { cn } from '@/lib/utils'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 })
const percent = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 })

const currencyCell = ({ value }: { value: unknown }) => money.format(Number(value))
const percentCell = ({ value }: { value: unknown }) => percent.format(Number(value))
const costCell = ({ value }: { value: unknown }) => {
  const amount = Number(value)
  return `${amount < 0 ? '-' : ''}$${Math.abs(amount).toFixed(4)}`
}

const todayIso = () => {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}

const columns: DataTableColumnDefinition<MaterialPrice>[] = [
  {
    id: 'partNumber',
    header: 'Part Number',
    accessor: 'partNumber',
    kind: 'text',
    width: 156,
    minWidth: 140,
    pin: 'left',
  },
  {
    id: 'description',
    header: 'Description',
    accessor: 'description',
    kind: 'text',
    width: 180,
    minWidth: 150,
    grow: true,
  },
  {
    id: 'spec',
    header: 'Spec',
    accessor: 'spec',
    kind: 'text',
    width: 190,
    minWidth: 150,
  },
  {
    id: 'ppbItem',
    header: 'PPB Item',
    accessor: 'ppbItem',
    kind: 'select',
    options: ITEMS.map((item) => ({ value: item.key, label: item.name })),
    width: 140,
    minWidth: 120,
    cell: ({ value }: { value: unknown }) => ppbItemLabel(value as MaterialPrice['ppbItem']),
  },
  {
    id: 'imported',
    header: 'Imported',
    description: 'Imported price build-up from FOB through landed price.',
    children: [
      { id: 'importedFob', header: 'FOB', accessor: 'importedFob', kind: 'number', width: 112, align: 'right', cell: currencyCell },
      { id: 'importedFreight', header: 'Freight', accessor: 'importedFreight', kind: 'number', width: 112, align: 'right', cell: currencyCell },
      { id: 'importedCif', header: 'CIF', accessor: 'importedCif', kind: 'number', width: 112, align: 'right', cell: currencyCell },
      { id: 'importedIi', header: 'II', accessor: 'importedIi', kind: 'number', width: 100, align: 'right', cell: currencyCell },
      { id: 'importedLandedPrice', header: 'Landed Price', accessor: 'importedLandedPrice', kind: 'number', width: 130, align: 'right', cell: currencyCell },
      { id: 'importedLandedVsFob', header: 'Landed vs FOB', accessor: 'importedLandedVsFob', kind: 'number', width: 130, align: 'right', cell: percentCell },
    ],
  },
  { id: 'localPrice', header: 'Local Price', accessor: 'localPrice', kind: 'number', width: 122, align: 'right', cell: currencyCell },
  { id: 'diff', header: 'Diff', accessor: 'diff', kind: 'number', width: 112, align: 'right', cell: currencyCell },
  {
    id: 'validity',
    header: 'Validity',
    description: 'Effective date range for this price version.',
    children: [
      { id: 'validFrom', header: 'Valid From', accessor: 'validFrom', kind: 'date', width: 120, minWidth: 112 },
      { id: 'validTo', header: 'Valid To', accessor: 'validTo', kind: 'date', width: 120, minWidth: 112 },
    ],
  },
  { id: 'costPerPoint', header: 'Cost / Point', accessor: 'costPerPoint', kind: 'number', width: 124, align: 'right', pin: 'right', cell: costCell },
]

export function MaterialPricesView() {
  const { priceRows, lastPriceImport, dismissPriceImport, applyPriceImport } = useMaterials()
  const defaultQuery = {
    filters: [{ id: 'validTo', op: 'between' as const, value: [todayIso(), ''] }],
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Material Prices"
        description="Current and historical raw material prices by Part Number, with imported cost build-up, local price, validity, and cost per point."
      >
        <MaterialPricesImportDialog currentRows={priceRows} onImport={applyPriceImport} />
      </PageHeader>

      {lastPriceImport && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-[12.5px] text-success">
          <p>
            <span className="font-medium">Prices imported.</span>{' '}
            {lastPriceImport.added} new, {lastPriceImport.replaced} previous version{lastPriceImport.replaced === 1 ? '' : 's'} closed, and {lastPriceImport.unchanged} unchanged.
          </p>
          <button type="button" onClick={dismissPriceImport} aria-label="Dismiss price import message" className="rounded-sm p-0.5 hover:bg-success/10 focus-visible:outline-2 focus-visible:outline-ring">
            <X aria-hidden="true" />
          </button>
        </div>
      )}

      <DataTable<MaterialPrice>
        caption="Material prices by Part Number"
        persistenceKey="material-prices-raw-data"
        columns={columns}
        data={priceRows}
        getRowId={(row) => row.id}
        defaultQuery={defaultQuery}
        bordered
        stickyHeader
        maxHeight="min(72dvh, 760px)"
        defaultDensity="comfortable"
        getRowClassName={(row) => cn(row.validTo !== OPEN_ENDED_DATE && 'bg-muted/30 text-muted-foreground')}
        exporter={{ fileName: 'material-prices' }}
      />
    </div>
  )
}
