import { useCallback, useEffect, useState } from 'react'

/**
 * The current time, refreshed every `intervalMs`. `refresh` updates it
 * immediately, for when an action depends on the exact moment.
 */
export function useNow(intervalMs = 60_000): [now: Date, refresh: () => void] {
  const [now, setNow] = useState(() => new Date())
  const refresh = useCallback(() => setNow(new Date()), [])

  useEffect(() => {
    const id = setInterval(refresh, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs, refresh])

  return [now, refresh]
}
