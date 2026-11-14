import { NextResponse, type NextRequest } from 'next/server'
import type { ApiErrorResponse, ApiMeta, ApiResponse } from '@/lib/api/contracts'

export function createMeta(request: NextRequest): ApiMeta {
  return {
    version: 'v1',
    requestId: request.headers.get('x-request-id') ?? crypto.randomUUID(),
    generatedAt: new Date().toISOString(),
  }
}

export function ok<T>(request: NextRequest, data: T, init?: ResponseInit) {
  const response = NextResponse.json<ApiResponse<T>>({ data, meta: createMeta(request) }, init)
  response.headers.set('x-api-version', 'v1')
  return response
}

export function fail(
  request: NextRequest,
  status: number,
  code: string,
  message: string,
  details?: ApiErrorResponse['error']['details'],
) {
  const body: ApiErrorResponse = {
    error: { code, message, ...(details ? { details } : {}) },
    meta: createMeta(request),
  }
  return NextResponse.json(body, { status })
}

export async function mockLatency(duration = 220) {
  await new Promise((resolve) => setTimeout(resolve, duration))
}

export function queryValue(request: NextRequest, key: string, fallback: string) {
  return request.nextUrl.searchParams.get(key)?.trim() || fallback
}
