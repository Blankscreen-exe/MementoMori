import { useEffect, useRef, useState } from 'react'
import {
  formatTimeOfDay,
  isBorrowedTime,
  lifeAsTimeOfDay,
  lifeFraction,
  type Profile,
} from '../../domain/life'
import type { WeekKey } from '../../domain/week'
import { useNow } from '../../hooks/useNow'
import { useAppStore } from '../../storage/store'
import { cn } from '../../ui/cn'
import { fadeClass, useFade } from '../../ui/fade'
import { Hourglass } from '../hourglass/Hourglass'
import { requestTiltPermission } from '../hourglass/tilt'

/** How long the revealed text stays before fading away. */
export const REVEAL_MS = 3500

interface Props {
  profile: Profile
  firstWeek: WeekKey
}

export function Home({ profile, firstWeek }: Props) {
  const now = useNow()
  const { visible } = useFade()
  const hasTouchedGlass = useAppStore((state) => state.hasTouchedGlass)
  const touchGlass = useAppStore((state) => state.touchGlass)
  const [revealed, setRevealed] = useState(false)
  const hideTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => clearTimeout(hideTimer.current), [])

  function handleTouch() {
    if (!hasTouchedGlass) {
      touchGlass()
      void requestTiltPermission()
    }
    setRevealed(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setRevealed(false), REVEAL_MS)
  }

  return (
    <main
      className={cn(
        'relative flex min-h-dvh flex-col items-center justify-center px-4',
        fadeClass(visible),
      )}
    >
      <button
        type="button"
        onClick={handleTouch}
        className="h-[min(68dvh,46rem)] w-full max-w-xl cursor-pointer rounded-3xl outline-none focus-visible:outline-1 focus-visible:outline-offset-8 focus-visible:outline-line"
      >
        <Hourglass profile={profile} firstWeek={firstWeek} now={now} />
      </button>

      <div className="absolute inset-x-4 bottom-[max(3rem,env(safe-area-inset-bottom))] text-center">
        {/* Always in the accessibility tree; only its visibility changes. */}
        <p
          className={cn(
            'text-2xl font-light transition-opacity duration-1000 motion-reduce:transition-none',
            revealed ? 'opacity-100' : 'opacity-0',
          )}
        >
          {isBorrowedTime(profile, now) ? (
            'Every week now is borrowed.'
          ) : (
            <>
              {formatTimeOfDay(lifeAsTimeOfDay(lifeFraction(profile, now)))}{' '}
              <span className="text-muted">of your life</span>
            </>
          )}
        </p>
        <p
          aria-hidden={hasTouchedGlass}
          className={cn(
            'absolute inset-x-0 top-1 text-base text-muted italic transition-opacity duration-1000 motion-reduce:transition-none',
            hasTouchedGlass ? 'opacity-0' : 'opacity-100',
          )}
        >
          Touch the glass.
        </p>
      </div>
    </main>
  )
}
