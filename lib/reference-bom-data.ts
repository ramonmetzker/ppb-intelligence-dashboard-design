export type BomCoverage = 'Reference' | 'Previous' | 'Fake'

export type ReferenceBomRow = {
  id: string
  plant: string
  model: string
  month: string
  volume: number
  coverage: BomCoverage
  source: string
  previousBom?: string
}

export type ReferenceBomOption = {
  id: string
  sku: string
  model: string
  description: string
}

export type PpbBomItem = {
  id: string
  name: string
  description: string
  localDefault: number
}

export const REFERENCE_BOM_ROWS: ReferenceBomRow[] = [
  { id: 'sop-001', plant: 'P81M', model: 'ZB-420', month: 'Nov 2026', volume: 1840, coverage: 'Reference', source: 'BOM-ZB-420-R1' },
  { id: 'sop-002', plant: 'P81M', model: 'ZB-430', month: 'Nov 2026', volume: 1260, coverage: 'Previous', source: 'BOM-ZB-410-R3', previousBom: 'BOM-ZB-410-R3' },
  { id: 'sop-003', plant: 'P81J', model: 'NX-200', month: 'Dec 2026', volume: 980, coverage: 'Fake', source: 'Fake BOM' },
  { id: 'sop-004', plant: 'P81M', model: 'NX-210', month: 'Dec 2026', volume: 740, coverage: 'Reference', source: 'BOM-NX-200-R2' },
  { id: 'sop-005', plant: 'P81J', model: 'GT-510', month: 'Jan 2027', volume: 520, coverage: 'Previous', source: 'BOM-GT-500-R4', previousBom: 'BOM-GT-500-R4' },
  { id: 'sop-006', plant: 'P81M', model: 'GT-520', month: 'Jan 2027', volume: 410, coverage: 'Fake', source: 'Fake BOM' },
  { id: 'sop-007', plant: 'P81J', model: 'ZB-450', month: 'Feb 2027', volume: 680, coverage: 'Reference', source: 'BOM-ZB-420-R1' },
  { id: 'sop-008', plant: 'P81M', model: 'NX-220', month: 'Feb 2027', volume: 320, coverage: 'Fake', source: 'Fake BOM' },
]

export const REFERENCE_BOM_OPTIONS: ReferenceBomOption[] = [
  { id: 'bom-001', sku: 'BOM-ZB-420-R1', model: 'ZB-420', description: 'ZB-420 · 4G connected notebook' },
  { id: 'bom-002', sku: 'BOM-NX-200-R2', model: 'NX-200', description: 'NX-200 · 5G consumer notebook' },
  { id: 'bom-003', sku: 'BOM-GT-500-R4', model: 'GT-500', description: 'GT-500 · Performance notebook' },
  { id: 'bom-004', sku: 'BOM-ZB-410-R3', model: 'ZB-410', description: 'ZB-410 · Previous generation' },
  { id: 'bom-005', sku: 'BOM-NX-180-R1', model: 'NX-180', description: 'NX-180 · Entry notebook' },
]

export const PPB_BOM_ITEMS: PpbBomItem[] = [
  { id: 'memory', name: 'Memory', description: 'RAM modules', localDefault: 0 },
  { id: 'battery', name: 'Battery', description: 'Battery pack', localDefault: 0 },
  { id: 'adapter', name: 'Adapter', description: 'Power adapter', localDefault: 0 },
  { id: 'data-cable', name: 'Data Cable', description: 'USB and data cable', localDefault: 0 },
  { id: 'pba-assy', name: 'PBA Assy', description: 'Main board assembly', localDefault: 100 },
  { id: 'rfid', name: 'RFID', description: 'RFID module', localDefault: 0 },
]

export type SalesAssignmentRow = {
  id: string
  originalModel: string
  newModel: string
  referenceBom: string
  division: number
  totalVolume: number
  parentId?: string
  children?: SalesAssignmentRow[]
}

export function countUnassignedSalesModels(rows: readonly SalesAssignmentRow[]): number {
  return rows.reduce((count, row) => {
    if (row.children?.length) return count + countUnassignedSalesModels(row.children)
    return count + (row.referenceBom === 'Unassigned' ? 1 : 0)
  }, 0)
}

export const SALES_ASSIGNMENT_ROWS: SalesAssignmentRow[] = [
  {
    id: 'sales-sm-s098',
    originalModel: 'SM-S098',
    newModel: '2 submodels',
    referenceBom: 'Assign per child',
    division: 100,
    totalVolume: 1970,
    children: [
      { id: 'sales-sm-s098-128', parentId: 'sales-sm-s098', originalModel: 'SM-S098', newModel: 'SM-S098 128GB', referenceBom: 'Unassigned', division: 50, totalVolume: 985 },
      { id: 'sales-sm-s098-256', parentId: 'sales-sm-s098', originalModel: 'SM-S098', newModel: 'SM-S098 256GB', referenceBom: 'Unassigned', division: 50, totalVolume: 985 },
    ],
  },
  { id: 'sales-sm-s144', originalModel: 'SM-S144', newModel: 'SM-S144', referenceBom: 'Unassigned', division: 100, totalVolume: 3040 },
  { id: 'sales-sm-a059', originalModel: 'SM-A059', newModel: 'SM-A059', referenceBom: 'Unassigned', division: 100, totalVolume: 7190 },
]
