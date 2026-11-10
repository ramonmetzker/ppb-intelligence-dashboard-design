import { NextResponse, type NextRequest } from 'next/server'
import { paramsToQuery, runQuery } from '@/lib/data-table/query'
import { SOP_DEMAND_ROWS, SOP_SCHEMA } from '@/lib/sop-demand/data'

export async function GET(request: NextRequest) {
  const query = paramsToQuery(request.nextUrl.searchParams)
  const { pageRows, total } = runQuery(SOP_DEMAND_ROWS, SOP_SCHEMA, query, true)
  await new Promise((resolve) => setTimeout(resolve, 350))
  return NextResponse.json({ rows: pageRows, total })
}
