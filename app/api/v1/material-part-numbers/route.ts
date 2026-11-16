import type { NextRequest } from 'next/server'
import { ok, queryValue, mockLatency } from '@/lib/api/http'
import { MATERIAL_PRICE_ROWS } from '@/lib/material-price-data'
import type { MaterialPartNumberResource } from '@/lib/api/contracts'

const DEFAULT_LIMIT = 8
const MAX_LIMIT = 20

function getPartNumberOptions(): MaterialPartNumberResource[] {
  const unique = new Map<string, MaterialPartNumberResource>()

  for (const row of MATERIAL_PRICE_ROWS) {
    if (!unique.has(row.partNumber)) {
      unique.set(row.partNumber, {
        partNumber: row.partNumber,
        description: row.description,
        spec: row.spec,
      })
    }
  }

  return [...unique.values()].sort((left, right) => left.partNumber.localeCompare(right.partNumber))
}

export async function GET(request: NextRequest) {
  const query = queryValue(request, 'q', '').slice(0, 100).toLowerCase()
  const selected = queryValue(request, 'selected', '').slice(0, 100)
  const requestedLimit = Number(request.nextUrl.searchParams.get('limit'))
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
    ? Math.min(Math.floor(requestedLimit), MAX_LIMIT)
    : DEFAULT_LIMIT

  const allOptions = getPartNumberOptions()
  const matchingOptions = allOptions.filter((option) =>
    `${option.partNumber} ${option.description} ${option.spec}`.toLowerCase().includes(query),
  )
  const selectedOption = selected
    ? allOptions.find((option) => option.partNumber === selected)
    : undefined
  const options = matchingOptions.slice(0, limit)

  if (selectedOption && !options.some((option) => option.partNumber === selectedOption.partNumber)) {
    options.unshift(selectedOption)
  }

  await mockLatency()

  return ok(request, {
    items: options,
    total: matchingOptions.length,
    hasMore: matchingOptions.length > limit,
  })
}
