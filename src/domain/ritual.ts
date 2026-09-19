import { isSunday } from 'date-fns'
import { weekKeyOf, type WeekKey } from './week'

/** The final outcome of a week's ritual. Once recorded, it never changes. */
export type WeekEntry =
  { outcome: 'named'; name: string } | { outcome: 'released' }

export type WeekEntries = Readonly<Record<WeekKey, WeekEntry>>

export const MAX_WEEK_NAME_LENGTH = 40

/** Trims a week's name and collapses runs of whitespace. */
export function normalizeWeekName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

export type WeekNameError = 'empty' | 'too-long'

export function validateWeekName(value: string): WeekNameError | null {
  const name = normalizeWeekName(value)
  if (name.length === 0) return 'empty'
  if (name.length > MAX_WEEK_NAME_LENGTH) return 'too-long'
  return null
}

export type WeekStatus =
  | 'unrecorded' // lived before the app was first used
  | 'named'
  | 'released' // the user chose "Let it go"
  | 'missed' // the week's Sunday passed without an answer
  | 'current'
  | 'future'

export interface RitualContext {
  now: Date
  /** The week the app was first used in. Earlier weeks are unrecorded. */
  firstWeek: WeekKey
  entries: WeekEntries
}

/**
 * The ritual is open all Sunday (local time) until the week is named or
 * released. That includes the Sunday the app is first used on.
 */
export function isRitualOpen(now: Date, entries: WeekEntries): boolean {
  return isSunday(now) && !(weekKeyOf(now) in entries)
}

/**
 * Whether `week` can still be answered at `now`. Checked at the moment of
 * saving, so an answer submitted after Sunday midnight is refused instead of
 * being filed under the next week.
 */
export function canAnswer(
  week: WeekKey,
  now: Date,
  entries: WeekEntries,
): boolean {
  return weekKeyOf(now) === week && isRitualOpen(now, entries)
}

export function weekStatus(week: WeekKey, context: RitualContext): WeekStatus {
  const { now, firstWeek, entries } = context
  const currentWeek = weekKeyOf(now)

  if (week > currentWeek) return 'future'
  if (week < firstWeek) return 'unrecorded'

  const entry = entries[week]
  if (entry) return entry.outcome
  return week === currentWeek ? 'current' : 'missed'
}
