import { getNavigationCounters } from '@/lib/api/mock-services'
import { mockLatency, ok } from '@/lib/api/http'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  await mockLatency(140)
  return ok(request, getNavigationCounters())
}
