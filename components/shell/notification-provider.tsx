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
import { useRouter } from 'next/navigation'

export type Severity = 'info' | 'success' | 'warning' | 'critical'

export type AppNotification = {
  id: string
  severity: Severity
  title: string
  body: string
  time: string
  read: boolean
  href?: string
  hrefLabel?: string
}

type NewNotification = Omit<AppNotification, 'id' | 'read' | 'time'>

type NotificationsContext = {
  notifications: AppNotification[]
  unreadCount: number
  markRead: (id: string) => void
  markAllRead: () => void
  dismiss: (id: string) => void
  clearRead: () => void
  push: (notification: NewNotification) => void
  syncing: boolean
  syncLabel: string
  sync: () => void
}

const SEED: AppNotification[] = [
  {
    id: 'seed-1',
    severity: 'warning',
    title: 'Imported memory is above last year',
    body: 'Most imported memory vendors are priced higher than a year ago. A larger local share may cut spend.',
    time: '08:42',
    read: false,
    href: '/materials',
    hrefLabel: 'Review material prices',
  },
  {
    id: 'seed-2',
    severity: 'critical',
    title: 'PPB items at risk in the last quarter',
    body: 'The current plan leaves a gap against the annual target in the closing months.',
    time: '08:10',
    read: false,
    href: '/risks',
    hrefLabel: 'Open risks and data',
  },
  {
    id: 'seed-3',
    severity: 'info',
    title: 'Planner agent has a new proposal',
    body: 'A lower-spend plan that still reaches the target is ready to compare with the active one.',
    time: 'Yesterday',
    read: false,
    href: '/simulation',
    hrefLabel: 'Open simulation',
  },
  {
    id: 'seed-4',
    severity: 'success',
    title: 'October closed',
    body: 'Actual production and spend for October were consolidated into the simulation.',
    time: 'Nov 03',
    read: true,
    href: '/',
    hrefLabel: 'Go to overview',
  },
]

const INITIAL_SYNC_LABEL = 'Nov 06, 08:42'
const SYNC_DURATION_MS = 1600

const Context = createContext<NotificationsContext | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED)
  const [syncing, setSyncing] = useState(false)
  const [syncLabel, setSyncLabel] = useState(INITIAL_SYNC_LABEL)
  const counter = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    setNotifications((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((current) => current.map((n) => (n.read ? n : { ...n, read: true })))
  }, [])

  const dismiss = useCallback((id: string) => {
    setNotifications((current) => current.filter((n) => n.id !== id))
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
        severity: 'success',
        title: 'Data synced',
        body: 'Production actuals, plan and material prices were refreshed.',
      })
    }, SYNC_DURATION_MS)
  }, [router, push])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const value = useMemo<NotificationsContext>(
    () => ({
      notifications,
      unreadCount,
      markRead,
      markAllRead,
      dismiss,
      clearRead,
      push,
      syncing,
      syncLabel,
      sync,
    }),
    [notifications, unreadCount, markRead, markAllRead, dismiss, clearRead, push, syncing, syncLabel, sync],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useNotifications() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider')
  return ctx
}
