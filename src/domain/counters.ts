import {
  differenceInCalendarDays,
  differenceInYears,
  isValid,
  nextSunday,
  parseISO,
  startOfDay,
} from 'date-fns'
import { expectedDeathOf, nextBirthday, type Profile } from './life'
import { normalizeWeekName } from './ritual'

export const BUILT_IN_COUNTERS = [
  'summers',
  'sundays',
  'birthdays',
  'full-moons',
] as const

export type BuiltInCounter = (typeof BUILT_IN_COUNTERS)[number]

export const COUNTER_PERIODS = ['week', 'month', 'year'] as const

export type CounterPeriod = (typeof COUNTER_PERIODS)[number]

export type CounterEnd =
  /** When another person reaches an age, e.g. "until they turn 90". */
  | { kind: 'age'; birthYear: number; age: number }
  /** A calendar date, `yyyy-MM-dd`. */
  | { kind: 'date'; date: string }

export interface CustomCounter {
  id: string
  name: string
  /** How many times it happens per period, e.g. 2 per year. */
  times: number
  per: CounterPeriod
  /** An end before the user's own expected age, if any. */
  end: CounterEnd | null
}

export type CounterInput = Omit<CustomCounter, 'id'>

export const MAX_COUNTER_NAME_LENGTH = 40
export const MAX_COUNTER_TIMES = 99

const DAY_MS = 86_400_000
const YEAR_MS = 365.2425 * DAY_MS
const PERIOD_MS: Record<CounterPeriod, number> = {
  week: 7 * DAY_MS,
  month: YEAR_MS / 12,
  year: YEAR_MS,
}

/** A known full moon, and the average length of a lunar cycle. */
const REFERENCE_FULL_MOON = Date.UTC(2000, 0, 21, 4, 40)
const LUNAR_CYCLE_MS = 29.530588853 * DAY_MS

/**
 * When a custom end falls. For a person's age only the birth year is known,
 * so the middle of the year stands in for their birthday.
 */
export function endDateOf(end: CounterEnd): Date {
  return end.kind === 'age'
    ? new Date(end.birthYear + end.age, 6, 1)
    : parseISO(end.date)
}

/** Whichever comes first: the counter's own end or the user's expected age. */
export function deadlineOf(counter: CounterInput, profile: Profile): Date {
  const death = expectedDeathOf(profile)
  if (!counter.end) return death
  const end = endDateOf(counter.end)
  return end.getTime() < death.getTime() ? end : death
}

/** How many more times a custom counter's event will happen. */
export function remainingOfCustom(
  counter: CounterInput,
  profile: Profile,
  now: Date,
): number {
  const span = deadlineOf(counter, profile).getTime() - now.getTime()
  if (span <= 0) return 0
  return Math.floor(span / (PERIOD_MS[counter.per] / counter.times))
}

/** How many more times a built-in counter's event will happen. */
export function remainingOfBuiltIn(
  counter: BuiltInCounter,
  profile: Profile,
  now: Date,
): number {
  const death = expectedDeathOf(profile)
  if (death.getTime() <= now.getTime()) return 0

  switch (counter) {
    case 'sundays': {
      const first = nextSunday(startOfDay(now))
      const days = differenceInCalendarDays(death, first)
      return days < 0 ? 0 : Math.floor(days / 7) + 1
    }
    case 'birthdays': {
      // The expected age is itself a birthday, and it isn't counted.
      const next = nextBirthday(profile, now)
      return next.getTime() >= death.getTime()
        ? 0
        : differenceInYears(death, next)
    }
    case 'summers': {
      // Counted by midsummer, 21 June. Near enough for either hemisphere.
      const midsummer = (year: number) => new Date(year, 5, 21)
      const first =
        now < midsummer(now.getFullYear())
          ? now.getFullYear()
          : now.getFullYear() + 1
      const last =
        death > midsummer(death.getFullYear())
          ? death.getFullYear()
          : death.getFullYear() - 1
      return Math.max(0, last - first + 1)
    }
    case 'full-moons': {
      const cycles = (time: number) =>
        Math.floor((time - REFERENCE_FULL_MOON) / LUNAR_CYCLE_MS)
      return Math.max(0, cycles(death.getTime()) - cycles(now.getTime()))
    }
  }
}

export type CounterError =
  | 'name-empty'
  | 'name-too-long'
  | 'times'
  | 'birth-year'
  | 'age'
  | 'end-invalid'
  | 'end-passed'

/** The first problem with a counter, or null if it can be saved. */
export function validateCounter(
  input: CounterInput,
  now: Date,
): CounterError | null {
  const name = normalizeWeekName(input.name)
  if (name.length === 0) return 'name-empty'
  if (name.length > MAX_COUNTER_NAME_LENGTH) return 'name-too-long'
  if (
    !Number.isInteger(input.times) ||
    input.times < 1 ||
    input.times > MAX_COUNTER_TIMES
  ) {
    return 'times'
  }

  const { end } = input
  if (!end) return null
  if (end.kind === 'age') {
    const { birthYear, age } = end
    if (
      !Number.isInteger(birthYear) ||
      birthYear < 1900 ||
      birthYear > now.getFullYear()
    ) {
      return 'birth-year'
    }
    if (!Number.isInteger(age) || age < 1 || age > 120) return 'age'
  } else if (!isValid(parseISO(end.date))) {
    return 'end-invalid'
  }
  return endDateOf(end).getTime() <= now.getTime() ? 'end-passed' : null
}

/** Tidies a counter's name the same way week names are tidied. */
export function normalizeCounter(input: CounterInput): CounterInput {
  return { ...input, name: normalizeWeekName(input.name) }
}
