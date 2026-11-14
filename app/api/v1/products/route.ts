import { getProducts } from '@/lib/api/mock-services'
import { fail, mockLatency, ok } from '@/lib/api/http'
import { GBMS, type Gbm } from '@/lib/products/data'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestedGbm = request.nextUrl.searchParams.get('gbm') as Gbm | null

  if (requestedGbm && !GBMS.includes(requestedGbm)) {
    return fail(request, 400, 'INVALID_GBM', 'GBM must be MX, VD or DA.', { gbm: requestedGbm })
  }

  await mockLatency()
  return ok(request, getProducts(requestedGbm ?? undefined))
}
