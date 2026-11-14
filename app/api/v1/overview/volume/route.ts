import { getVolume } from '@/lib/api/mock-services'
import { fail, mockLatency, ok, queryValue } from '@/lib/api/http'
import type { VolumeMode } from '@/lib/ppb-model'
import type { NextRequest } from 'next/server'

const MODES: VolumeMode[] = ['monthly', 'accumulated']

export async function GET(request: NextRequest) {
  const simulationId = queryValue(request, 'simulationId', 'balanced')
  const mode = queryValue(request, 'mode', 'monthly') as VolumeMode

  if (!MODES.includes(mode)) {
    return fail(request, 400, 'INVALID_VOLUME_MODE', 'Mode must be monthly or accumulated.', { mode })
  }

  await mockLatency()
  const data = getVolume(simulationId, mode)

  if (data.rows.length === 0) {
    return fail(request, 404, 'VOLUME_NOT_FOUND', `No volume data was found for "${simulationId}".`, {
      simulationId,
    })
  }

  return ok(request, data)
}
