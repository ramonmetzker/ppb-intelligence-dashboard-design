import type { ApiResponse } from '@/lib/api/contracts'

export async function apiFetcher<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url, { headers: { accept: 'application/json' } })
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'Unable to load API resource')
  }

  return payload as ApiResponse<T>
}
