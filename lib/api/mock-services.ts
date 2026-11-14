import {
  BASE_FORECAST,
  CURRENT_SCORE,
  DEFAULT_SUGGESTION,
  ITEMS,
  LAST_ACTUAL,
  MONTHS,
  OPEN_MONTHS,
  REQUIRED_SCORE,
  SUGGESTION_RESULTS,
  baselineSeries,
  buildSeries,
  simulate,
  type VolumeMode,
} from '@/lib/ppb-model'
import { countUnassignedSalesModels, SALES_ASSIGNMENT_ROWS } from '@/lib/reference-bom-data'
import { RPA_SEED } from '@/lib/rpa/data'
import { GBMS, PRODUCT_SCORE_YEARS, PRODUCT_SEED, parsePlants } from '@/lib/products/data'
import type {
  NavigationCounters,
  NotificationResource,
  NotificationsResponse,
  OverviewQuery,
  OverviewResponse,
  ProductResource,
  ProductsResponse,
  SimulationResource,
  SimulationsResponse,
  SessionResource,
  VolumeResource,
} from '@/lib/api/contracts'

const MOCK_NOTIFICATIONS: NotificationResource[] = [
  {
    id: 'seed-sop-1',
    type: 'sop',
    title: 'Tablet SOP moved to Dec 02',
    body: 'The start of production for the Tablet line shifted by two weeks. Planned volumes for the first month were re-spread.',
    createdAt: '2026-11-06T09:05:00Z',
    read: false,
    requiresAck: true,
    acknowledgedAt: null,
    href: '/production',
    hrefLabel: 'Open production',
  },
  {
    id: 'seed-bom-1',
    type: 'bom',
    title: 'BOM revision C released for Mobile',
    body: 'Three PPB items changed supplier and one was replaced. Confirm that you reviewed the new item list.',
    createdAt: '2026-11-06T08:50:00Z',
    read: false,
    requiresAck: true,
    acknowledgedAt: null,
    href: '/items',
    hrefLabel: 'Review PPB items',
  },
  {
    id: 'seed-pricing-1',
    type: 'pricing',
    title: 'Imported memory is above last year',
    body: 'Most imported memory vendors are priced higher than a year ago. A larger local share may cut spend.',
    createdAt: '2026-11-06T08:42:00Z',
    read: false,
    requiresAck: false,
    acknowledgedAt: null,
    href: '/materials',
    hrefLabel: 'Review material prices',
  },
  {
    id: 'seed-automation-1',
    type: 'automation',
    title: 'Planner agent has a new proposal',
    body: 'A lower-spend plan that still reaches the target is ready to compare with the active one.',
    createdAt: '2026-11-05T16:20:00Z',
    read: false,
    requiresAck: false,
    acknowledgedAt: null,
    href: '/simulation',
    hrefLabel: 'Open simulation',
  },
  {
    id: 'seed-pricing-2',
    type: 'pricing',
    title: 'Panel price list approved for Q1',
    body: 'The approved Q1 panel prices replace the draft list. Plans using panels were recalculated.',
    createdAt: '2026-11-05T15:30:00Z',
    read: false,
    requiresAck: true,
    acknowledgedAt: null,
    href: '/materials',
    hrefLabel: 'View material prices',
  },
  {
    id: 'seed-sop-2',
    type: 'sop',
    title: 'October closed',
    body: 'Actual production and spend for October were consolidated into the simulation.',
    createdAt: '2026-11-03T12:00:00Z',
    read: true,
    requiresAck: false,
    acknowledgedAt: null,
    href: '/',
    hrefLabel: 'Go to overview',
  },
  {
    id: 'seed-automation-2',
    type: 'automation',
    title: 'Nightly data sync completed',
    body: 'Production actuals and plan were refreshed from the corporate systems.',
    createdAt: '2026-11-02T08:00:00Z',
    read: true,
    requiresAck: false,
    acknowledgedAt: null,
    href: null,
    hrefLabel: null,
  },
]

function simulationFor(id: string) {
  return SUGGESTION_RESULTS.find((entry) => entry.suggestion.id === id) ?? SUGGESTION_RESULTS.find((entry) => entry.suggestion.id === DEFAULT_SUGGESTION.id)!
}

function toSimulationResource(entry: (typeof SUGGESTION_RESULTS)[number]): SimulationResource {
  return {
    id: entry.suggestion.id,
    name: entry.suggestion.name,
    tag: entry.suggestion.tag,
    blurb: entry.suggestion.blurb,
    createdAt: entry.suggestion.createdAt,
    source: entry.suggestion.source,
    delta: entry.suggestion.delta,
    plan: entry.suggestion.plan,
    result: entry.sim,
  }
}

export function getSimulations(selectedId = DEFAULT_SUGGESTION.id): SimulationsResponse {
  return {
    items: SUGGESTION_RESULTS.map(toSimulationResource),
    selectedId: simulationFor(selectedId).suggestion.id,
  }
}

export function getVolume(simulationId = DEFAULT_SUGGESTION.id, mode: VolumeMode = 'monthly'): VolumeResource {
  const selected = simulationFor(simulationId)
  return {
    mode,
    items: ITEMS.map(({ key, name, color }) => ({ key, name, color })),
    rows: buildSeries(selected.suggestion.plan, mode),
  }
}

export function getOverview(query: Partial<OverviewQuery> = {}): OverviewResponse {
  const simulationId = query.simulationId ?? DEFAULT_SUGGESTION.id
  const selected = simulationFor(simulationId)
  const simulation = selected.sim
  const accumulated = buildSeries(selected.suggestion.plan, 'accumulated')
  const baseline = baselineSeries('accumulated')
  const score = accumulated[11].total
  const baseScore = baseline[11].total

  return {
    context: {
      productSlug: query.productSlug ?? 'mobile',
      year: query.year ?? '2026',
      simulationId: selected.suggestion.id,
      actualThrough: MONTHS[LAST_ACTUAL],
      openMonths: [OPEN_MONTHS[0], OPEN_MONTHS[1]],
    },
    score: {
      current: CURRENT_SCORE,
      required: REQUIRED_SCORE,
      forecast: BASE_FORECAST,
      simulation: simulation.yearEnd,
      gainVsForecast: simulation.gain,
      gapVsRequired: simulation.gap,
      status: simulation.status,
    },
    volume: getVolume(selected.suggestion.id, 'monthly'),
    trajectory: simulation.trajectory,
    simulation: toSimulationResource(selected),
    plan: {
      id: selected.suggestion.id,
      name: selected.suggestion.name,
      tag: selected.suggestion.tag,
      source: selected.suggestion.source,
      createdAt: selected.suggestion.createdAt,
      changes: simulation.changes,
      items: simulation.items,
    },
    drivers: simulation.drivers,
  }
}

export function getProducts(gbm?: ProductResource['gbm']): ProductsResponse {
  const items = PRODUCT_SEED
    .filter((product) => product.active_yn === 'Y' && (!gbm || product.gbm === gbm))
    .sort((a, b) => a.gbm.localeCompare(b.gbm) || a.order - b.order)
    .map((product) => ({ ...product, plants: parsePlants(product.plants) }))

  return {
    items,
    gbms: [...GBMS],
    years: [...PRODUCT_SCORE_YEARS],
  }
}

export function getNotifications(): NotificationsResponse {
  return {
    items: MOCK_NOTIFICATIONS.map((notification) => ({ ...notification })),
    unreadCount: MOCK_NOTIFICATIONS.filter((notification) => !notification.read).length,
    pendingAckCount: MOCK_NOTIFICATIONS.filter((notification) => notification.requiresAck && !notification.acknowledgedAt).length,
  }
}

export function getNavigationCounters(): NavigationCounters {
  const rpaErrors = RPA_SEED.filter((row) => row.status === 'failed').length
  return {
    rawData: 8,
    referenceBomPending: countUnassignedSalesModels(SALES_ASSIGNMENT_ROWS),
    rpaErrors,
    notificationsUnread: getNotifications().unreadCount,
    notificationsPendingAck: getNotifications().pendingAckCount,
  }
}

export function getSession(): SessionResource {
  return {
    user: {
      fullName: 'Rafael Alves',
      initials: 'RA',
      knoxId: 'rafael.alves',
    },
    locale: 'en-US',
    timezone: 'America/Sao_Paulo',
  }
}
