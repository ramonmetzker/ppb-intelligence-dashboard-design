import { useSyncExternalStore } from 'react'

const subscribe = (notify: () => void) => {
  const timer = setInterval(notify, 30_000)
  return () => clearInterval(timer)
}

const currentMinute = () => Math.floor(Date.now() / 60_000) * 60_000

/** Current time rounded to the minute. Null during server render so markup never depends on the clock. */
export function useNow() {
  return useSyncExternalStore(subscribe, currentMinute, () => null)
}
