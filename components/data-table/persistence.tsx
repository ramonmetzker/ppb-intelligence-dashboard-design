'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Density } from '@/lib/data-table/types'

export type DataTableSettings = {
  columnOrder: string[]
  columnWidths: Record<string, number>
  hiddenColumns: Record<string, boolean>
  pinnedColumns: Record<string, 'left' | 'right' | 'none'>
  density: Density
  pageSize?: number
}

const PersistenceScopeContext = createContext('anonymous')
const STORAGE_PREFIX = 'ppb:data-table:v1'
const DENSITIES = new Set<Density>(['compact', 'default', 'comfortable'])
const PINS = new Set(['left', 'right', 'none'])

export function DataTablePersistenceProvider({
  userId,
  children,
}: {
  userId: string
  children: ReactNode
}) {
  return <PersistenceScopeContext.Provider value={userId}>{children}</PersistenceScopeContext.Provider>
}

export function useDataTableStorageKey(tableKey?: string) {
  const userId = useContext(PersistenceScopeContext)
  if (!tableKey) return null
  return `${STORAGE_PREFIX}:${encodeURIComponent(userId)}:${encodeURIComponent(tableKey)}`
}

function booleanRecord(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean'))
}

function widthRecord(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] > 0,
    ),
  )
}

function pinRecord(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, 'left' | 'right' | 'none'] => typeof entry[1] === 'string' && PINS.has(entry[1]),
    ),
  )
}

export function readDataTableSettings(storageKey: string): Partial<DataTableSettings> | null {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    const record = value as Record<string, unknown>
    const columnOrder = Array.isArray(record.columnOrder)
      ? [...new Set(record.columnOrder.filter((id): id is string => typeof id === 'string'))]
      : []
    const density = DENSITIES.has(record.density as Density) ? (record.density as Density) : undefined
    const pageSize =
      typeof record.pageSize === 'number' && Number.isInteger(record.pageSize) && record.pageSize > 0
        ? record.pageSize
        : undefined

    return {
      columnOrder,
      columnWidths: widthRecord(record.columnWidths),
      hiddenColumns: booleanRecord(record.hiddenColumns),
      pinnedColumns: pinRecord(record.pinnedColumns),
      ...(density ? { density } : {}),
      ...(pageSize ? { pageSize } : {}),
    }
  } catch {
    return null
  }
}

export function writeDataTableSettings(storageKey: string, settings: DataTableSettings) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(settings))
  } catch {
    // Storage can be unavailable or full; table interaction must keep working.
  }
}
