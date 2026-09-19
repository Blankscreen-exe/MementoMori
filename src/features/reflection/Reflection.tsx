import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../../ui/cn'
import { fadeClass, useFade } from '../../ui/fade'

/** How long a reflection stays before it fades on its own. */
export const AUTO_DISMISS_MS = 8000
/** How long before the "tap to continue" hint appears. */
export const HINT_DELAY_MS = 2500

interface Props {
  text: string
  onDone: () => void
}

/**
 * A single message on a black screen: a reflection when the app opens, or a
 * nudge after an hour on screen. A tap anywhere moves on; otherwise it fades
 * away by itself.
 */
export function Reflection({ text, onDone }: Props) {
  const { visible, fadeOutThen } = useFade()
  const [showHint, setShowHint] = useState(false)
  const dismissed = useRef(false)
  const button = useRef<HTMLButtonElement>(null)

  const dismiss = useCallback(() => {
    if (dismissed.current) return
    dismissed.current = true
    fadeOutThen(onDone)
  }, [fadeOutThen, onDone])

  useEffect(() => {
    button.current?.focus()
    const hint = setTimeout(() => setShowHint(true), HINT_DELAY_MS)
    const auto = setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => {
      clearTimeout(hint)
      clearTimeout(auto)
    }
  }, [dismiss])

  return (
    <button
      ref={button}
      type="button"
      onClick={dismiss}
      className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-canvas px-8 text-center outline-none"
    >
      <p
        className={cn(
          'max-w-sm text-[1.75rem] leading-snug font-light',
          fadeClass(visible),
        )}
      >
        {text}
      </p>
      <span
        className={cn(
          'absolute inset-x-0 bottom-[max(2.5rem,env(safe-area-inset-bottom))] text-sm italic',
          fadeClass(visible && showHint),
        )}
      >
        Tap to continue
      </span>
    </button>
  )
}
