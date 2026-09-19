import { useState } from 'react'
import { STARING_NUDGE } from './content/nudges'
import { isRitualOpen } from './domain/ritual'
import { weekKeyOf } from './domain/week'
import { Home, type SettledWeek } from './features/home/Home'
import { Onboarding } from './features/onboarding/Onboarding'
import { Reflection } from './features/reflection/Reflection'
import { Ritual } from './features/ritual/Ritual'
import { useEveryOnScreen } from './hooks/useEveryOnScreen'
import { useNow } from './hooks/useNow'
import { useAppStore } from './storage/store'

/** How long the app can stay on screen before it nudges you to look away. */
export const STARING_NUDGE_MS = 60 * 60 * 1000

interface Props {
  /** A reflection to show before anything else, once per launch. */
  launchReflection?: string | null
}

function App({ launchReflection = null }: Props) {
  const [now, refreshNow] = useNow()
  const profile = useAppStore((state) => state.profile)
  const firstWeek = useAppStore((state) => state.firstWeek)
  const entries = useAppStore((state) => state.entries)
  const completeOnboarding = useAppStore((state) => state.completeOnboarding)
  const recordWeek = useAppStore((state) => state.recordWeek)
  const [settled, setSettled] = useState<SettledWeek | null>(null)
  const [reflection, setReflection] = useState(launchReflection)
  const [staring, setStaring] = useState(false)

  const onboarded = profile !== null && firstWeek !== null
  useEveryOnScreen(STARING_NUDGE_MS, () => setStaring(true), onboarded)

  if (!profile || !firstWeek) {
    return <Onboarding onComplete={(p) => completeOnboarding(p, new Date())} />
  }

  let screen
  if (reflection) {
    // Each launch opens with a reflection, before the ritual or the hourglass.
    screen = <Reflection text={reflection} onDone={() => setReflection(null)} />
  } else if (isRitualOpen(now, entries)) {
    // On Sunday, the ritual blocks the app until the week is named or let go.
    const week = weekKeyOf(now)
    screen = (
      <Ritual
        now={now}
        onKeep={(name) => {
          if (recordWeek(week, { outcome: 'named', name }, new Date())) {
            setSettled({ name })
          }
          // If Sunday ended mid-answer, this moves the app on to Monday.
          refreshNow()
        }}
        onRelease={() => {
          recordWeek(week, { outcome: 'released' }, new Date())
          refreshNow()
        }}
      />
    )
  } else {
    screen = (
      <Home
        profile={profile}
        firstWeek={firstWeek}
        entries={entries}
        now={now}
        settled={settled}
      />
    )
  }

  return (
    <>
      {screen}
      {/* Laid over whatever is open, so nothing in progress is lost. */}
      {staring && (
        <Reflection text={STARING_NUDGE} onDone={() => setStaring(false)} />
      )}
    </>
  )
}

export default App
