import { fail, mockLatency, ok } from '@/lib/api/http'
import { getNotifications } from '@/lib/api/mock-services'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  await mockLatency(160)
  const count = getNotifications().unreadCount
  if (count === 0) return fail(request, 409, 'NOTIFICATIONS_ALREADY_READ', 'There are no unread notifications.')
  return ok(request, { affectedCount: count, updatedAt: new Date().toISOString() })
}
