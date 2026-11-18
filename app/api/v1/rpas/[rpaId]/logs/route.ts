import type { NextRequest } from 'next/server'
import { paramsToQuery, runQuery } from '@/lib/data-table/query'
import { fail, mockLatency, ok } from '@/lib/api/http'
import { DEFAULT_RPA_LOG_QUERY, getRpaLogs, RPA_LOG_SCHEMA } from '@/lib/rpa/log-data'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rpaId: string }> },
) {
  const { rpaId } = await params
  if (!/^RPA-\d{3}$/.test(rpaId)) {
    return fail(request, 404, 'RPA_NOT_FOUND', 'The requested RPA does not exist.')
  }

  const query = paramsToQuery(request.nextUrl.searchParams, DEFAULT_RPA_LOG_QUERY)
  const { pageRows, total } = runQuery(getRpaLogs(rpaId), RPA_LOG_SCHEMA, query, true)
  await mockLatency(180)

  return ok(request, { rows: pageRows, total })
}
