import { addYears, differenceInWeeks, isValid, parseISO } from 'date-fns'

export const MIN_EXPECTED_AGE = 1
export const MAX_EXPECTED_AGE = 120
export const DEFAULT_EXPECTED_AGE = 80

export interface Profile {
  /** Local calendar date, formatted `yyyy-MM-dd`. */
  birthDate: string
  /** Whole years. */
  expectedAge: number
}

export function birthOf(profile: Profile): Date {
  return parseISO(profile.birthDate)
}

export function expectedDeathOf(profile: Profile): Date {
  return addYears(birthOf(profile), profile.expectedAge)
}

/** Share of the expected lifespan already lived, clamped to [0, 1]. */
export function lifeFraction(profile: Profile, now: Date): number {
  const birth = birthOf(profile).getTime()
  const death = expectedDeathOf(profile).getTime()
  const fraction = (now.getTime() - birth) / (death - birth)
  return Math.min(1, Math.max(0, fraction))
}

/** True once the expected lifespan has run out. The app keeps working. */
export function isBorrowedTime(profile: Profile, now: Date): boolean {
  return now.getTime() >= expectedDeathOf(profile).getTime()
}

/** The next birthday after `now`. A birthday that is today counts as passed. */
export function nextBirthday(profile: Profile, now: Date): Date {
  const birth = birthOf(profile)
  const thisYear = addYears(birth, now.getFullYear() - birth.getFullYear())
  return thisYear.getTime() > now.getTime() ? thisYear : addYears(thisYear, 1)
}

export function weeksLived(profile: Profile, now: Date): number {
  return Math.max(0, differenceInWeeks(now, birthOf(profile)))
}

export function weeksRemaining(profile: Profile, now: Date): number {
  return Math.max(0, differenceInWeeks(expectedDeathOf(profile), now))
}

export interface TimeOfDay {
  hours: number
  minutes: number
}

/** Maps a life fraction onto a 24-hour day: 0.5 is noon. */
export function lifeAsTimeOfDay(fraction: number): TimeOfDay {
  const clamped = Math.min(1, Math.max(0, fraction))
  const totalMinutes = Math.floor(clamped * 24 * 60)
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 }
}

/** Formats a time of day as `10:12 AM`. The end of the day reads as midnight. */
export function formatTimeOfDay({ hours, minutes }: TimeOfDay): string {
  const period = hours < 12 || hours === 24 ? 'AM' : 'PM'
  const displayHours = hours % 12 === 0 ? 12 : hours % 12
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`
}

export type BirthDateError = 'invalid' | 'future' | 'too-old'

export function validateBirthDate(
  value: string,
  now: Date,
): BirthDateError | null {
  const date = parseISO(value)
  if (!isValid(date)) return 'invalid'
  if (date.getTime() > now.getTime()) return 'future'
  if (addYears(date, MAX_EXPECTED_AGE).getTime() < now.getTime()) {
    return 'too-old'
  }
  return null
}

export type ExpectedAgeError = 'not-whole' | 'out-of-range'

export function validateExpectedAge(value: number): ExpectedAgeError | null {
  if (!Number.isInteger(value)) return 'not-whole'
  if (value < MIN_EXPECTED_AGE || value > MAX_EXPECTED_AGE) {
    return 'out-of-range'
  }
  return null
}
