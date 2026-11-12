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
  { id: 'sop-001', plant: 'Manaus', model: 'ZB-420', month: 'Nov 2026', volume: 1840, coverage: 'Reference', source: 'BOM-ZB-420-R1' },
  { id: 'sop-002', plant: 'Manaus', model: 'ZB-430', month: 'Nov 2026', volume: 1260, coverage: 'Previous', source: 'BOM-ZB-410-R3', previousBom: 'BOM-ZB-410-R3' },
  { id: 'sop-003', plant: 'Jundiaí', model: 'NX-200', month: 'Dec 2026', volume: 980, coverage: 'Fake', source: 'Fake BOM' },
  { id: 'sop-004', plant: 'Manaus', model: 'NX-210', month: 'Dec 2026', volume: 740, coverage: 'Reference', source: 'BOM-NX-200-R2' },
  { id: 'sop-005', plant: 'Jundiaí', model: 'GT-510', month: 'Jan 2027', volume: 520, coverage: 'Previous', source: 'BOM-GT-500-R4', previousBom: 'BOM-GT-500-R4' },
  { id: 'sop-006', plant: 'Manaus', model: 'GT-520', month: 'Jan 2027', volume: 410, coverage: 'Fake', source: 'Fake BOM' },
  { id: 'sop-007', plant: 'Jundiaí', model: 'ZB-450', month: 'Feb 2027', volume: 680, coverage: 'Reference', source: 'BOM-ZB-420-R1' },
  { id: 'sop-008', plant: 'Manaus', model: 'NX-220', month: 'Feb 2027', volume: 320, coverage: 'Fake', source: 'Fake BOM' },
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
