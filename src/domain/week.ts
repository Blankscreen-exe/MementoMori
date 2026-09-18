import { endOfWeek, format, parseISO, startOfWeek, subDays } from 'date-fns'

/**
 * A week runs Monday to Sunday and is identified by its Sunday, formatted
 * `yyyy-MM-dd` in local time. Keys sort chronologically as plain strings.
 */
export type WeekKey = string

const WEEK_OPTIONS = { weekStartsOn: 1 } as const

export function weekKeyOf(date: Date): WeekKey {
  return format(endOfWeek(date, WEEK_OPTIONS), 'yyyy-MM-dd')
}

/** Monday 00:00 local time of the week containing `date`. */
export function weekStartOf(date: Date): Date {
  return startOfWeek(date, WEEK_OPTIONS)
}

/** Monday 00:00 local time of the week identified by `key`. */
export function weekStartOfKey(key: WeekKey): Date {
  return subDays(parseISO(key), 6)
}
