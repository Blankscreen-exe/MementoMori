import { addYears, isValid, startOfDay } from 'date-fns'
import { birthOf, expectedDeathOf, type Profile } from './life'
import { weekKeyOf, weekStartOfKey, type WeekKey } from './week'

export const MAX_LETTER_LENGTH = 2000

export interface Letter {
  id: string
  body: string
  /** When it was sealed, as an ISO timestamp. */
  writtenAt: string
  /** The week it opens in. Until then it can't be read, listed or changed. */
  week: WeekKey
  /** When it was first read, as an ISO timestamp. */
  openedAt: string | null
}

export type LetterBodyError = 'empty' | 'too-long'

export function validateLetterBody(body: string): LetterBodyError | null {
  if (body.trim().length === 0) return 'empty'
  if (body.length > MAX_LETTER_LENGTH) return 'too-long'
  return null
}

export const LETTER_PRESETS = [
  'next-birthday',
  'in-1-year',
  'in-5-years',
  'in-10-years',
] as const

export type LetterPreset = (typeof LETTER_PRESETS)[number]

const PRESET_YEARS: Record<Exclude<LetterPreset, 'next-birthday'>, number> = {
  'in-1-year': 1,
  'in-5-years': 5,
  'in-10-years': 10,
}

/** The date a preset points to. A birthday that is today counts as passed. */
export function presetDate(
  preset: LetterPreset,
  profile: Profile,
  now: Date,
): Date {
  if (preset !== 'next-birthday') {
    return addYears(startOfDay(now), PRESET_YEARS[preset])
  }
  const birth = birthOf(profile)
  const thisYear = addYears(birth, now.getFullYear() - birth.getFullYear())
  return thisYear.getTime() > now.getTime() ? thisYear : addYears(thisYear, 1)
}

export type DeliveryError = 'invalid' | 'too-soon' | 'beyond-lifespan'

export type Delivery = { week: WeekKey } | { error: DeliveryError }

/**
 * The week a letter aimed at `date` opens in. It must be a later week than
 * this one, and within the expected lifespan: a week beyond it has no place
 * in the sand.
 */
export function deliveryFor(date: Date, profile: Profile, now: Date): Delivery {
  if (!isValid(date)) return { error: 'invalid' }
  const week = weekKeyOf(date)
  if (week <= weekKeyOf(now)) return { error: 'too-soon' }
  if (date.getTime() > expectedDeathOf(profile).getTime()) {
    return { error: 'beyond-lifespan' }
  }
  return { week }
}

/** A letter arrives at the start of its week. */
export function hasArrived(letter: Letter, now: Date): boolean {
  return letter.week <= weekKeyOf(now)
}

export function isUnread(letter: Letter, now: Date): boolean {
  return hasArrived(letter, now) && letter.openedAt === null
}

/**
 * Where a sealed letter sits in the remaining time: 0 is now, at the neck,
 * and 1 is the end of the expected lifespan, at the top of the sand.
 * Returns null once the letter has arrived.
 */
export function remainingShareOf(
  letter: Letter,
  profile: Profile,
  now: Date,
): number | null {
  if (hasArrived(letter, now)) return null
  const remaining = expectedDeathOf(profile).getTime() - now.getTime()
  if (remaining <= 0) return null
  const until = weekStartOfKey(letter.week).getTime() - now.getTime()
  return Math.min(1, Math.max(0, until / remaining))
}
