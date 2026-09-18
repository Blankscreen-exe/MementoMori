import { useEffect, useRef, type ReactNode } from 'react'
import { cn } from './cn'
import { fadeClass, useFade } from './fade'

interface Props {
  label: string
  onClose: () => void
  children: ReactNode
}

/**
 * A full-screen layer over the hourglass. The screen that shows it owns the
 * back-gesture behavior (see useBackToClose), so switching sheets is seamless.
 */
export function Sheet({ label, onClose, children }: Props) {
  const { visible } = useFade()
  const dialog = useRef<HTMLDivElement>(null)

  // Move focus into the sheet, so keyboard and screen reader users land in it.
  useEffect(() => dialog.current?.focus(), [])

  return (
    <div
      ref={dialog}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className={cn(
        'fixed inset-0 z-10 overflow-y-auto bg-canvas outline-none',
        fadeClass(visible),
      )}
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-sm flex-col px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 p-2 text-sm tracking-[0.14em] text-muted uppercase outline-none focus-visible:underline focus-visible:underline-offset-4"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
