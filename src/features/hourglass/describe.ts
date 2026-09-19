import { remainingShareOf, type Letter } from '../../domain/letters'
import {
  isBorrowedTime,
  lifeFraction,
  weeksRemaining,
  type Profile,
} from '../../domain/life'
import { seedOf } from './render'

export interface SealedSpark {
  /** Where its week lies in the remaining time: 0 is now, 1 is the end. */
  share: number
  /** Stable per letter, so its spark stays in the same place between visits. */
  seed: number
}

/** Sealed letters as sparks in the sand. Arrived letters have no place there. */
export function sealedSparks(
  letters: Letter[],
  profile: Profile,
  now: Date,
): SealedSpark[] {
  return letters.flatMap((letter) => {
    const share = remainingShareOf(letter, profile, now)
    return share === null ? [] : [{ share, seed: seedOf(letter.id) }]
  })
}

/** What the hourglass shows, in words, for screen readers. */
export function describeHourglass(
  profile: Profile,
  now: Date,
  sparkCount: number,
): string {
  if (isBorrowedTime(profile, now)) {
    return 'An hourglass that has run out. Every week now is borrowed.'
  }
  const lived = Math.round(lifeFraction(profile, now) * 100)
  const weeks = weeksRemaining(profile, now).toLocaleString('en')
  const glints = sparkCount > 0 ? ' Something glints in the sand.' : ''
  return `An hourglass. ${lived}% of your expected life has passed, and about ${weeks} weeks remain.${glints}`
}
