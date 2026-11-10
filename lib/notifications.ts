export const NOTIFICATION_TYPES = ['sop', 'bom', 'pricing', 'automation'] as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

export type Acknowledgements = Record<string, string>

export const ACK_COOKIE = 'ppb-acknowledgements'

const ONE_YEAR = 60 * 60 * 24 * 365

export function parseAcknowledgements(value: string | undefined): Acknowledgements {
  if (!value) return {}
  try {
    const parsed: unknown = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const clean: Acknowledgements = {}
    for (const [id, at] of Object.entries(parsed)) {
      if (typeof at === 'string' && !Number.isNaN(Date.parse(at))) clean[id] = at
    }
    return clean
  } catch {
    return {}
  }
}

export function serializeAcknowledgements(acks: Acknowledgements) {
  return `${ACK_COOKIE}=${encodeURIComponent(JSON.stringify(acks))}; path=/; max-age=${ONE_YEAR}; samesite=lax`
}
