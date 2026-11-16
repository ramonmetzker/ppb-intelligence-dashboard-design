import type { YesNo } from '@/lib/ppb-items/data'
import { MATERIAL_PRICE_ROWS } from '@/lib/material-price-data'
import type { Gbm } from '@/lib/products/data'

export const CONSTRAINT_YEARS = ['2027', '2026', '2025'] as const
export type ConstraintYear = (typeof CONSTRAINT_YEARS)[number]

export const VOLUME_CONSTRAINT_TYPES = ['No limit', 'Maximum', 'Minimum'] as const
export type VolumeConstraintType = (typeof VOLUME_CONSTRAINT_TYPES)[number]

export const VOLUME_UNITS = ['Units', 'Percentage'] as const
export type VolumeUnit = (typeof VOLUME_UNITS)[number]

export const DATE_CONSTRAINT_TYPES = ['No limit', 'Until date', 'From date', 'Between dates'] as const
export type DateConstraintType = (typeof DATE_CONSTRAINT_TYPES)[number]

export type MaterialConstraint = {
  id: string
  partNumber: string
  year: ConstraintYear
  volumeType: VolumeConstraintType
  volumeValue: number | null
  volumeUnit: VolumeUnit
  dateType: DateConstraintType
  dateFrom: string | null
  dateTo: string | null
  active: YesNo
}

export type MaterialConstraintFormValues = Omit<MaterialConstraint, 'id' | 'year'>

export type TargetConstraint = {
  id: string
  gbm: Gbm
  year: ConstraintYear
  adjustmentPct: number
  active: YesNo
}

export type TargetConstraintFormValues = Omit<TargetConstraint, 'id' | 'gbm' | 'year'>

export const TARGET_CONSTRAINT_SEED: readonly TargetConstraint[] = [
  { id: 'target-constraint-mx-2027', gbm: 'MX', year: '2027', adjustmentPct: 5, active: 'Y' },
  { id: 'target-constraint-vd-2027', gbm: 'VD', year: '2027', adjustmentPct: 3, active: 'Y' },
]

export const MATERIAL_CONSTRAINT_SEED: readonly MaterialConstraint[] = [
  { id: 'constraint-1108-000750-2027', partNumber: '1108-000750', year: '2027', volumeType: 'Maximum', volumeValue: 75, volumeUnit: 'Percentage', dateType: 'No limit', dateFrom: null, dateTo: null, active: 'Y' },
  { id: 'constraint-1108-001120-2027', partNumber: '1108-001120', year: '2027', volumeType: 'Maximum', volumeValue: 1200, volumeUnit: 'Units', dateType: 'Until date', dateFrom: '2027-06', dateTo: null, active: 'Y' },
  { id: 'constraint-1108-002020-2027', partNumber: '1108-002020', year: '2027', volumeType: 'No limit', volumeValue: null, volumeUnit: 'Units', dateType: 'No limit', dateFrom: null, dateTo: null, active: 'Y' },
  { id: 'constraint-1108-005010-2027', partNumber: '1108-005010', year: '2027', volumeType: 'Minimum', volumeValue: 20, volumeUnit: 'Percentage', dateType: 'From date', dateFrom: '2027-07', dateTo: null, active: 'Y' },
  { id: 'constraint-1108-000750-2026', partNumber: '1108-000750', year: '2026', volumeType: 'Maximum', volumeValue: 4800, volumeUnit: 'Units', dateType: 'Between dates', dateFrom: '2026-02', dateTo: '2026-09', active: 'N' },
  { id: 'constraint-1108-001120-2025', partNumber: '1108-001120', year: '2025', volumeType: 'Minimum', volumeValue: 15, volumeUnit: 'Percentage', dateType: 'No limit', dateFrom: null, dateTo: null, active: 'Y' },
]

export function formatMonth(value: string | null) {
  if (!value) return ''
  const [year, month] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)))
}

export function materialConstraintLabel(constraint: MaterialConstraint) {
  if (constraint.volumeType === 'No limit') return 'No limit'
  const value = constraint.volumeUnit === 'Percentage'
    ? `${constraint.volumeValue}%`
    : `${constraint.volumeValue?.toLocaleString('en-US')} units`
  return `${constraint.volumeType === 'Maximum' ? 'Max' : 'Min'} · ${value}`
}

export function dateConstraintLabel(constraint: MaterialConstraint) {
  switch (constraint.dateType) {
    case 'Until date': return `Until ${formatMonth(constraint.dateFrom)}`
    case 'From date': return `From ${formatMonth(constraint.dateFrom)}`
    case 'Between dates': return `${formatMonth(constraint.dateFrom)} – ${formatMonth(constraint.dateTo)}`
    default: return 'No limit'
  }
}

export function targetAdjustmentLabel(adjustmentPct: number) {
  return `${adjustmentPct > 0 ? '+' : ''}${adjustmentPct}%`
}

export function effectiveTarget(annualScore: number, adjustmentPct: number) {
  return Math.round(annualScore * (1 + adjustmentPct / 100) * 10) / 10
}
