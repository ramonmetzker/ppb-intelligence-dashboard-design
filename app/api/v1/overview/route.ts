import { getOverview } from '@/lib/api/mock-services'
import { fail, mockLatency, ok, queryValue } from '@/lib/api/http'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const simulationId = queryValue(request, 'simulationId', 'balanced')
  const productSlug = queryValue(request, 'productSlug', 'mobile')
  const year = queryValue(request, 'year', '2026')

  if (!/^\d{4}$/.test(year)) {
    return fail(request, 400, 'INVALID_YEAR', 'The year must use the YYYY format.', { year })
  }

  await mockLatency()
  const data = getOverview({ simulationId, productSlug, year })

  if (data.context.simulationId !== simulationId) {
    return fail(request, 404, 'SIMULATION_NOT_FOUND', `Simulation "${simulationId}" was not found.`, {
      simulationId,
    })
  }

  return ok(request, data)
}
