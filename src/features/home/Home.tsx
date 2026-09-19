import { useEffect, useRef, useState } from 'react'
import { hasArrived, isUnread } from '../../domain/letters'
import {
  formatTimeOfDay,
  isBorrowedTime,
  lifeAsTimeOfDay,
  lifeFraction,
  type Profile,
} from '../../domain/life'
import type { WeekEntries } from '../../domain/ritual'
import type { WeekKey } from '../../domain/week'
import { useAppStore } from '../../storage/store'
import { cn } from '../../ui/cn'
import { fadeClass, useFade } from '../../ui/fade'
import { Sheet } from '../../ui/Sheet'
import { useBackToClose } from '../../ui/useBackToClose'
import { Counters } from '../counters/Counters'
import { HourglassView } from '../hourglass/HourglassView'
import { requestTiltPermission } from '../hourglass/tilt'
import { LetterList } from '../letters/LetterList'
import { WriteLetter } from '../letters/WriteLetter'

/** How long the revealed text stays before fading away. */
export const REVEAL_MS = 3500
/** How long a message, like a newly named week, stays on screen. */
export const MESSAGE_MS = 4500

export interface SettledWeek {
  name: string
}

type SheetKind = 'menu' | 'write' | 'letters' | 'counters'

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
    shown ? 'opacity-100' : 'pointer-events-none opacity-0',
  )

export function Home({ profile, firstWeek, entries, now, settled }: Props) {
  const { visible } = useFade()
  const hasTouchedGlass = useAppStore((state) => state.hasTouchedGlass)
  const touchGlass = useAppStore((state) => state.touchGlass)
  const letters = useAppStore((state) => state.letters)
  const hasReceivedLetter = useAppStore((state) => state.hasReceivedLetter)
  const sealLetter = useAppStore((state) => state.sealLetter)
  const openLetter = useAppStore((state) => state.openLetter)
  const deleteLetter = useAppStore((state) => state.deleteLetter)
  const counters = useAppStore((state) => state.counters)
  const hiddenCounters = useAppStore((state) => state.hiddenCounters)
  const addCounter = useAppStore((state) => state.addCounter)
  const updateCounter = useAppStore((state) => state.updateCounter)
  const deleteCounter = useAppStore((state) => state.deleteCounter)
  const setCounterHidden = useAppStore((state) => state.setCounterHidden)

  const [revealed, setRevealed] = useState(false)
  const [sheet, setSheet] = useState<SheetKind | null>(null)
  const [message, setMessage] = useState<string | null>(settled?.name ?? null)
  const [messageShown, setMessageShown] = useState(message !== null)
  const revealTimer = useRef<number | undefined>(undefined)
  useBackToClose(sheet !== null, () => setSheet(null))

  useEffect(() => () => clearTimeout(revealTimer.current), [])

  // Whatever shows a message also sets it visible; this only schedules the fade.
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessageShown(false), MESSAGE_MS)
    return () => clearTimeout(timer)
  }, [message])

  function showMessage(next: string) {
    setMessage(next)
    setMessageShown(true)
  }

  const arrived = letters.filter((letter) => hasArrived(letter, now))
  const unread = arrived.filter((letter) => isUnread(letter, now)).length
  // The dot first appears with the first arrival, then stays for good.
  const showLettersDot = hasReceivedLetter || arrived.length > 0

  function handleTouch() {
    if (!hasTouchedGlass) {
      touchGlass()
      void requestTiltPermission()
    }
    setMessageShown(false)
    setRevealed(true)
    clearTimeout(revealTimer.current)
    revealTimer.current = window.setTimeout(() => setRevealed(false), REVEAL_MS)
  }

  function openSheet(kind: SheetKind) {
    clearTimeout(revealTimer.current)
    setRevealed(false)
    setSheet(kind)
  }

  return (
    <main
      className={cn(
        'relative flex min-h-dvh flex-col items-center justify-center px-4',
        fadeClass(visible),
      )}
    >
      {showLettersDot && (
        <button
          type="button"
          onClick={() => openSheet('letters')}
          aria-label={unread > 0 ? `Letters, ${unread} unread` : 'Letters'}
          className="absolute top-[max(0.75rem,env(safe-area-inset-top))] right-3 flex size-11 items-center justify-center rounded-full outline-none focus-visible:outline-1 focus-visible:outline-line"
        >
          <span
            aria-hidden
            className={cn(
              'size-2 rounded-full',
              unread > 0
                ? 'animate-pulse bg-sand motion-reduce:animate-none'
                : 'bg-missed',
            )}
          />
        </button>
      )}

      <button
        type="button"
        onClick={handleTouch}
        className="h-[min(68dvh,46rem)] w-full max-w-xl cursor-pointer rounded-3xl outline-none focus-visible:outline-1 focus-visible:outline-offset-8 focus-visible:outline-line"
      >
        <HourglassView
          profile={profile}
          firstWeek={firstWeek}
          entries={entries}
          letters={letters}
          now={now}
        />
      </button>

      <div className="absolute inset-x-4 bottom-[max(2rem,env(safe-area-inset-bottom))] text-center">
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
        <button
          type="button"
          onClick={() => openSheet('menu')}
          aria-label="Menu"
          className={cn(
            'mt-1 px-4 py-1 text-2xl tracking-[0.3em] text-muted outline-none focus-visible:opacity-100',
            fadingText(revealed),
          )}
        >
          ···
        </button>

        {message && (
          <p
            role="status"
            className={cn(
              'absolute inset-x-0 top-0 text-2xl font-light italic',
              fadingText(messageShown),
            )}
          >
            {message}
          </p>
        )}
        <p
          aria-hidden={hasTouchedGlass}
          className={cn(
            'absolute inset-x-0 top-1 text-base text-muted italic',
            fadingText(!hasTouchedGlass && !messageShown),
          )}
        >
          Touch the glass.
        </p>
      </div>

      {sheet === 'menu' && (
        <Sheet label="Menu" onClose={() => setSheet(null)}>
          <nav className="mt-[14vh] flex flex-col items-start gap-4">
            <button
              type="button"
              onClick={() => setSheet('write')}
              className="text-[2rem] font-light outline-none focus-visible:underline focus-visible:underline-offset-8"
            >
              Write a letter
            </button>
            <button
              type="button"
              onClick={() => setSheet('counters')}
              className="text-[2rem] font-light outline-none focus-visible:underline focus-visible:underline-offset-8"
            >
              Counters
            </button>
          </nav>
        </Sheet>
      )}

      {sheet === 'write' && (
        <Sheet label="Write a letter" onClose={() => setSheet(null)}>
          <WriteLetter
            profile={profile}
            now={now}
            onSeal={(body, date) => {
              if (sealLetter(body, date, new Date())) {
                setSheet(null)
                showMessage('Sealed.')
              }
            }}
          />
        </Sheet>
      )}

      {sheet === 'counters' && (
        <Sheet label="Counters" onClose={() => setSheet(null)}>
          <Counters
            profile={profile}
            now={now}
            counters={counters}
            hiddenCounters={hiddenCounters}
            onAdd={(input) => addCounter(input, new Date())}
            onUpdate={(id, input) => updateCounter(id, input, new Date())}
            onDelete={deleteCounter}
            onSetHidden={setCounterHidden}
          />
        </Sheet>
      )}

      {sheet === 'letters' && (
        <Sheet label="Letters" onClose={() => setSheet(null)}>
          <LetterList
            letters={arrived}
            onOpen={(id) => openLetter(id, new Date())}
            onDelete={(id) => deleteLetter(id, new Date())}
          />
        </Sheet>
      )}
    </main>
  )
}
