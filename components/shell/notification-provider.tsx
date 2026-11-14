'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import {
  serializeAcknowledgements,
  type Acknowledgements,
  type NotificationType,
} from '@/lib/notifications'
import { apiFetcher } from '@/lib/api/client'
import type { ApiResponse, NotificationsResponse } from '@/lib/api/contracts'

export type AppNotification = {
  id: string
  type: NotificationType
  title: string
  body: string
  time: string
  read: boolean
  requiresAck?: boolean
  acknowledgedAt?: string
  href?: string
  hrefLabel?: string
}

type NewNotification = Omit<AppNotification, 'id' | 'read' | 'time' | 'acknowledgedAt'>

type NotificationsContext = {
  notifications: AppNotification[]
  unreadCount: number
  pendingAckCount: number
  markRead: (id: string) => void
  markAllRead: () => void
  acknowledge: (id: string) => void
  dismiss: (id: string) => void
  clearRead: () => void
  push: (notification: NewNotification) => void
  syncing: boolean
  syncLabel: string
  sync: () => void
  isLoading: boolean
}

const SEED: AppNotification[] = [
  {
    id: 'seed-sop-1',
    type: 'sop',
    title: 'Tablet SOP moved to Dec 02',
    body: 'The start of production for the Tablet line shifted by two weeks. Planned volumes for the first month were re-spread.',
    time: '09:05',
    read: false,
    requiresAck: true,
    href: '/production',
    hrefLabel: 'Open production',
  },
  {
    id: 'seed-bom-1',
    type: 'bom',
    title: 'BOM revision C released for Mobile',
    body: 'Three PPB items changed supplier and one was replaced. Confirm that you reviewed the new item list.',
    time: '08:50',
    read: false,
    requiresAck: true,
    href: '/items',
    hrefLabel: 'Review PPB items',
  },
  {
    id: 'seed-pricing-1',
    type: 'pricing',
    title: 'Imported memory is above last year',
    body: 'Most imported memory vendors are priced higher than a year ago. A larger local share may cut spend.',
    time: '08:42',
    read: false,
    href: '/materials',
    hrefLabel: 'Review material prices',
  },
  {
    id: 'seed-automation-1',
    type: 'automation',
    title: 'Planner agent has a new proposal',
    body: 'A lower-spend plan that still reaches the target is ready to compare with the active one.',
    time: 'Yesterday',
    read: false,
    href: '/simulation',
    hrefLabel: 'Open simulation',
  },
  {
    id: 'seed-pricing-2',
    type: 'pricing',
    title: 'Panel price list approved for Q1',
    body: 'The approved Q1 panel prices replace the draft list. Plans using panels were recalculated.',
    time: 'Yesterday',
    read: false,
    requiresAck: true,
    href: '/materials',
    hrefLabel: 'View material prices',
  },
  {
    id: 'seed-sop-2',
    type: 'sop',
    title: 'October closed',
    body: 'Actual production and spend for October were consolidated into the simulation.',
    time: 'Nov 03',
    read: true,
    href: '/',
    hrefLabel: 'Go to overview',
  },
  {
    id: 'seed-automation-2',
    type: 'automation',
    title: 'Nightly data sync completed',
    body: 'Production actuals and plan were refreshed from the corporate systems.',
    time: 'Nov 02',
    read: true,
  },
]

function fromApiNotification(notification: NotificationsResponse['items'][number]): AppNotification {
  const date = new Date(notification.createdAt)
  const time = Number.isNaN(date.getTime())
    ? notification.createdAt
    : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })

  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    time,
    read: notification.read,
    requiresAck: notification.requiresAck,
    acknowledgedAt: notification.acknowledgedAt ?? undefined,
    href: notification.href ?? undefined,
    hrefLabel: notification.hrefLabel ?? undefined,
  }
}

const INITIAL_SYNC_LABEL = 'Nov 06, 08:42'
const SYNC_DURATION_MS = 1600

function withAcknowledgements(
  list: AppNotification[],
  acks: Acknowledgements,
): AppNotification[] {
  return list.map((n) => {
    const acknowledgedAt = n.requiresAck ? acks[n.id] : undefined
    return acknowledgedAt ? { ...n, read: true, acknowledgedAt } : n
  })
}

const Context = createContext<NotificationsContext | null>(null)

export function NotificationProvider({
  children,
  initialAcknowledgements,
}: {
  children: ReactNode
  initialAcknowledgements: Acknowledgements
}) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    withAcknowledgements(SEED, initialAcknowledgements),
  )
  const [syncing, setSyncing] = useState(false)
  const [syncLabel, setSyncLabel] = useState(INITIAL_SYNC_LABEL)
  const counter = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const acks = useRef<Acknowledgements>(initialAcknowledgements)
  const hydratedFromApi = useRef(false)
  const { data, isLoading } = useSWR<ApiResponse<NotificationsResponse>>('/api/v1/notifications', apiFetcher)

  useEffect(() => {
    if (!data || hydratedFromApi.current) return
    setNotifications(withAcknowledgements(data.data.items.map(fromApiNotification), initialAcknowledgements))
    hydratedFromApi.current = true
  }, [data, initialAcknowledgements])

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const push = useCallback((notification: NewNotification) => {
    counter.current += 1
    const entry: AppNotification = {
      ...notification,
      id: `live-${counter.current}`,
      time: 'Just now',
      read: false,
    }
    setNotifications((current) => [entry, ...current])
  }, [])

  const markRead = useCallback((id: string) => {
    setNotifications((current) =>
      current.map((n) => (n.id === id && !n.requiresAck ? { ...n, read: true } : n)),
    )
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((current) =>
      current.map((n) => (n.read || n.requiresAck ? n : { ...n, read: true })),
    )
  }, [])

  const acknowledge = useCallback((id: string) => {
    const at = new Date().toISOString()
    acks.current = { ...acks.current, [id]: at }
    document.cookie = serializeAcknowledgements(acks.current)
    setNotifications((current) =>
      current.map((n) =>
        n.id === id && n.requiresAck && !n.acknowledgedAt
          ? { ...n, read: true, acknowledgedAt: at }
          : n,
      ),
    )
  }, [])

  const dismiss = useCallback((id: string) => {
    setNotifications((current) =>
      current.filter((n) => n.id !== id || (n.requiresAck && !n.acknowledgedAt)),
    )
  }, [])

  const clearRead = useCallback(() => {
    setNotifications((current) => current.filter((n) => !n.read))
  }, [])

  const sync = useCallback(() => {
    if (timer.current) return
    setSyncing(true)
    router.refresh()
    timer.current = setTimeout(() => {
      timer.current = null
      setSyncing(false)
      setSyncLabel('just now')
      push({
        type: 'automation',
        title: 'Data synced',
        body: 'Production actuals, plan and material prices were refreshed.',
      })
    }, SYNC_DURATION_MS)
  }, [router, push])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])
  const pendingAckCount = useMemo(
    () => notifications.filter((n) => n.requiresAck && !n.acknowledgedAt).length,
    [notifications],
  )

  const value = useMemo<NotificationsContext>(
    () => ({
      notifications,
      unreadCount,
      pendingAckCount,
      markRead,
      markAllRead,
      acknowledge,
      dismiss,
      clearRead,
      push,
      syncing,
      syncLabel,
      sync,
      isLoading,
    }),
    [
      notifications,
      unreadCount,
      pendingAckCount,
      markRead,
      markAllRead,
      acknowledge,
      dismiss,
      clearRead,
      push,
      syncing,
      syncLabel,
      sync,
      isLoading,
    ],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useNotifications() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider')
  return ctx
}
