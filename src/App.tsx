import { useState } from 'react'
import { isRitualOpen } from './domain/ritual'
import { weekKeyOf } from './domain/week'
import { Home, type SettledWeek } from './features/home/Home'
import { Onboarding } from './features/onboarding/Onboarding'
import { Ritual } from './features/ritual/Ritual'
import { useNow } from './hooks/useNow'
import { useAppStore } from './storage/store'

function App() {
  const [now, refreshNow] = useNow()
  const profile = useAppStore((state) => state.profile)
  const firstWeek = useAppStore((state) => state.firstWeek)
  const entries = useAppStore((state) => state.entries)
  const completeOnboarding = useAppStore((state) => state.completeOnboarding)
  const recordWeek = useAppStore((state) => state.recordWeek)
  const [settled, setSettled] = useState<SettledWeek | null>(null)

  if (!profile || !firstWeek) {
    return <Onboarding onComplete={(p) => completeOnboarding(p, new Date())} />
  }

  // On Sunday, the ritual blocks the app until the week is named or let go.
  if (isRitualOpen(now, entries)) {
    const week = weekKeyOf(now)
    return (
      <Ritual
        now={now}
        onKeep={(name, color) => {
          if (recordWeek(week, { outcome: 'named', name, color }, new Date())) {
            setSettled({ name, color })
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
  }

  return (
    <Home
      profile={profile}
      firstWeek={firstWeek}
      entries={entries}
      now={now}
      settled={settled}
    />
  )
}

export default App
