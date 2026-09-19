import { useEffect, useRef } from 'react'

/**
 * Calls `onElapsed` after every `intervalMs` of time the page is actually
 * visible. Switching away pauses the count; coming back resumes it.
 */
export function useEveryOnScreen(
  intervalMs: number,
  onElapsed: () => void,
  enabled = true,
) {
  const latest = useRef(onElapsed)
  useEffect(() => {
    latest.current = onElapsed
  })

  useEffect(() => {
    if (!enabled) return
    let remaining = intervalMs
    let visibleSince: number | null = null
    let timer: number | undefined

    const fire = () => {
      remaining = intervalMs
      visibleSince = Date.now()
      latest.current()
      timer = window.setTimeout(fire, remaining)
    }
    const resume = () => {
      visibleSince = Date.now()
      timer = window.setTimeout(fire, remaining)
    }
    const pause = () => {
      clearTimeout(timer)
      if (visibleSince !== null) remaining -= Date.now() - visibleSince
      visibleSince = null
    }
    const onVisibility = () => (document.hidden ? pause() : resume())

    if (!document.hidden) resume()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [intervalMs, enabled])
}
