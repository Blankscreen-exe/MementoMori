import { Home } from './features/home/Home'
import { Onboarding } from './features/onboarding/Onboarding'
import { useAppStore } from './storage/store'

function App() {
  const profile = useAppStore((state) => state.profile)
  const firstWeek = useAppStore((state) => state.firstWeek)
  const completeOnboarding = useAppStore((state) => state.completeOnboarding)

  if (profile && firstWeek)
    return <Home profile={profile} firstWeek={firstWeek} />
  return <Onboarding onComplete={(p) => completeOnboarding(p, new Date())} />
}

export default App
