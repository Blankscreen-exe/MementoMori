import {
  formatTimeOfDay,
  isBorrowedTime,
  lifeAsTimeOfDay,
  lifeFraction,
  type Profile,
} from '../../domain/life'
import { useNow } from '../../hooks/useNow'
import { fadeClass, useFade } from '../../ui/fade'

/** Interim home screen until the hourglass lands. */
export function Home({ profile }: { profile: Profile }) {
  const now = useNow()
  const { visible } = useFade()

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 text-center">
      <p className={`text-3xl font-light ${fadeClass(visible)}`}>
        {isBorrowedTime(profile, now) ? (
          'Every week now is borrowed.'
        ) : (
          <>
            {formatTimeOfDay(lifeAsTimeOfDay(lifeFraction(profile, now)))}{' '}
            <span className="text-muted">of your life</span>
          </>
        )}
      </p>
    </main>
  )
}
