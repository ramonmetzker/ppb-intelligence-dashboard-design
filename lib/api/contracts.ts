import type {
  DriverRow,
  ItemKey,
  Month,
  Plan,
  SeriesRow,
  Simulation,
  Status,
  TrajectoryPoint,
  VolumeMode,
} from '@/lib/ppb-model'

export const API_VERSION = 'v1' as const

export type ApiMeta = {
  version: typeof API_VERSION
  requestId: string
  generatedAt: string
}

export type ApiResponse<T> = {
  data: T
  meta: ApiMeta
}

export type ApiErrorResponse = {
  error: {
    code: string
    message: string
    details?: Record<string, string | number | boolean | null>
  }
  meta: ApiMeta
}

export type OverviewQuery = {
  productSlug: string
  year: string
  simulationId: string
}

export type OverviewContext = {
  productSlug: string
  year: string
  simulationId: string
  actualThrough: Month
  openMonths: [Month, Month]
}

export type OverviewScore = {
  current: number
  required: number
  forecast: number
  simulation: number
  gainVsForecast: number
  gapVsRequired: number
  status: Status
}

export type VolumeItem = {
  key: ItemKey
  name: string
  color: string
}

export type VolumeResource = {
  mode: VolumeMode
  items: VolumeItem[]
  rows: SeriesRow[]
}

export type SimulationResource = {
  id: string
  name: string
  tag: string
  blurb: string
  createdAt: string
  source: 'forecast' | 'agent'
  delta: Record<ItemKey, [number, number]>
  plan: Plan
  result: Simulation
}

export type OverviewPlan = Pick<SimulationResource, 'id' | 'name' | 'tag' | 'source' | 'createdAt'> & {
  changes: Simulation['changes']
  items: Simulation['items']
}

export type OverviewResponse = {
  context: OverviewContext
  score: OverviewScore
  volume: VolumeResource
  trajectory: TrajectoryPoint[]
  simulation: SimulationResource
  plan: OverviewPlan
  drivers: DriverRow[]
}

export type SimulationsResponse = {
  items: SimulationResource[]
  selectedId: string
}

export type ProductsResponse = {
  items: ProductResource[]
  gbms: Array<'MX' | 'VD' | 'DA'>
  years: string[]
}

export type MaterialPartNumberResource = {
  partNumber: string
  description: string
  spec: string
}

export type MaterialPartNumbersResponse = {
  items: MaterialPartNumberResource[]
  total: number
  hasMore: boolean
}

export type ProductResource = {
  product_slug: string
  product_name: string
  product_code: string
  order: number
  gbm: 'MX' | 'VD' | 'DA'
  plants: string[]
  icon: string
  active_yn: 'Y' | 'N'
  created_at: string
  updated_at: string
}

export type NotificationResource = {
  id: string
  type: 'sop' | 'bom' | 'pricing' | 'automation'
  title: string
  body: string
  createdAt: string
  read: boolean
  requiresAck: boolean
  acknowledgedAt: string | null
  href: string | null
  hrefLabel: string | null
}

export type NotificationsResponse = {
  items: NotificationResource[]
  unreadCount: number
  pendingAckCount: number
}

export type NavigationCounters = {
  rawData: number
  referenceBomPending: number
  rpaErrors: number
  notificationsUnread: number
  notificationsPendingAck: number
}

export type SessionResource = {
  user: {
    fullName: string
    initials: string
    knoxId: string
  }
  locale: string
  timezone: string
}
