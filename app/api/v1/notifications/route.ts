import { getNotifications } from '@/lib/api/mock-services'
import { mockLatency, ok } from '@/lib/api/http'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  await mockLatency()
  return ok(request, getNotifications())
}
