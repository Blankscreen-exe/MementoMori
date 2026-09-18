import { useEffect, useRef, useState } from 'react'
import {
  formatTimeOfDay,
  isBorrowedTime,
  lifeAsTimeOfDay,
  lifeFraction,
  type Profile,
} from '../../domain/life'
import type { StrataColor } from '../../domain/palette'
import type { WeekEntries } from '../../domain/ritual'
import type { WeekKey } from '../../domain/week'
import { useAppStore } from '../../storage/store'
import { cn } from '../../ui/cn'
import { fadeClass, useFade } from '../../ui/fade'
import { Hourglass } from '../hourglass/Hourglass'
import { requestTiltPermission } from '../hourglass/tilt'

/** How long the revealed text stays before fading away. */
export const REVEAL_MS = 3500
/** How long a newly named week is shown after the ritual. */
export const SETTLE_MS = 4500

export interface SettledWeek {
  name: string
  color: StrataColor
}

interface Props {
  profile: Profile
  firstWeek: WeekKey
  entries: WeekEntries
  now: Date
  /** A week that was just named, shown briefly as it settles into the sand. */
  settled?: SettledWeek | null
}

const fadingText = (shown: boolean) =>
  cn(
    'transition-opacity duration-1000 motion-reduce:transition-none',
    shown ? 'opacity-100' : 'opacity-0',
  )

export function Home({ profile, firstWeek, entries, now, settled }: Props) {
  const { visible } = useFade()
  const hasTouchedGlass = useAppStore((state) => state.hasTouchedGlass)
  const touchGlass = useAppStore((state) => state.touchGlass)
  const [revealed, setRevealed] = useState(false)
  const [settling, setSettling] = useState(Boolean(settled))
  const hideTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => clearTimeout(hideTimer.current), [])

  useEffect(() => {
    if (!settled) return
    const timer = setTimeout(() => setSettling(false), SETTLE_MS)
    return () => clearTimeout(timer)
  }, [settled])

  function handleTouch() {
    if (!hasTouchedGlass) {
      touchGlass()
      void requestTiltPermission()
    }
    setSettling(false)
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
        <Hourglass
          profile={profile}
          firstWeek={firstWeek}
          entries={entries}
          now={now}
        />
      </button>

      <div className="absolute inset-x-4 bottom-[max(3rem,env(safe-area-inset-bottom))] text-center">
        {/* Always in the accessibility tree; only its visibility changes. */}
        <p className={cn('text-2xl font-light', fadingText(revealed))}>
          {isBorrowedTime(profile, now) ? (
            'Every week now is borrowed.'
          ) : (
            <>
              {formatTimeOfDay(lifeAsTimeOfDay(lifeFraction(profile, now)))}{' '}
              <span className="text-muted">of your life</span>
            </>
          )}
        </p>
        {settled && (
          <p
            role="status"
            style={{ color: `var(--mm-${settled.color})` }}
            className={cn(
              'absolute inset-x-0 top-0 text-2xl font-light italic',
              fadingText(settling),
            )}
          >
            {settled.name}
          </p>
        )}
        <p
          aria-hidden={hasTouchedGlass}
          className={cn(
            'absolute inset-x-0 top-1 text-base text-muted italic',
            fadingText(!hasTouchedGlass && !settling),
          )}
        >
          Touch the glass.
        </p>
      </div>
    </main>
  )
}
