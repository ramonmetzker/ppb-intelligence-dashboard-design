import { fail, mockLatency, ok } from '@/lib/api/http'
import { getNotifications } from '@/lib/api/mock-services'
import type { NextRequest } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const notification = getNotifications().items.find((item) => item.id === id)
  if (!notification) return fail(request, 404, 'NOTIFICATION_NOT_FOUND', `Notification "${id}" was not found.`, { id })
  await mockLatency(140)
  return ok(request, { id, deleted: true, deletedAt: new Date().toISOString() })
}
