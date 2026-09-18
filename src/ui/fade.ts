import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from './cn'

export const FADE_MS = 700

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Fades content in on mount. `fadeOutThen` fades it out, runs `next` (usually
 * a content swap), then fades back in. With reduced motion, swaps instantly.
 */
export function useFade() {
  const [visible, setVisible] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer.current)
    }
  }, [])

  const fadeOutThen = useCallback((next: () => void) => {
    if (prefersReducedMotion()) {
      next()
      return
    }
    setVisible(false)
    timer.current = window.setTimeout(() => {
      next()
      setVisible(true)
    }, FADE_MS)
  }, [])

  return { visible, fadeOutThen }
}

export function fadeClass(visible: boolean): string {
  return cn(
    'transition-opacity duration-700 ease-in-out motion-reduce:transition-none',
    visible ? 'opacity-100' : 'opacity-0',
  )
}
