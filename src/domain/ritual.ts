import { isSunday } from 'date-fns'
import type { StrataColor } from './palette'
import { weekKeyOf, type WeekKey } from './week'

/** The final outcome of a week's ritual. Once recorded, it never changes. */
export type WeekEntry =
  | { outcome: 'named'; word: string; color: StrataColor }
  | { outcome: 'released' }

export type WeekEntries = Readonly<Record<WeekKey, WeekEntry>>

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

export function weekStatus(week: WeekKey, context: RitualContext): WeekStatus {
  const { now, firstWeek, entries } = context
  const currentWeek = weekKeyOf(now)

  if (week > currentWeek) return 'future'
  if (week < firstWeek) return 'unrecorded'

  const entry = entries[week]
  if (entry) return entry.outcome
  return week === currentWeek ? 'current' : 'missed'
}
