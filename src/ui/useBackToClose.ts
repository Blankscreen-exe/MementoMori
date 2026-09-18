import { useEffect, useRef } from 'react'

/**
 * While `open`, adds one browser history entry so the back button or gesture
 * calls `onClose` instead of leaving the app. Closing any other way removes
 * the entry again. Switching what is shown while open adds nothing.
 */
export function useBackToClose(open: boolean, onClose: () => void) {
  const latestOnClose = useRef(onClose)
  useEffect(() => {
    latestOnClose.current = onClose
  })

  useEffect(() => {
    if (!open) return
    window.history.pushState({ overlay: true }, '')
    let poppedByBack = false
    const onPopState = () => {
      poppedByBack = true
      latestOnClose.current()
    }
    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('popstate', onPopState)
      // Closed by a button rather than Back: remove the entry we added.
      if (!poppedByBack) window.history.back()
    }
  }, [open])
}
