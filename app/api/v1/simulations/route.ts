import { getSimulations } from '@/lib/api/mock-services'
import { mockLatency, ok, queryValue } from '@/lib/api/http'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const selectedId = queryValue(request, 'selectedId', 'balanced')
  await mockLatency()
  return ok(request, getSimulations(selectedId))
}
