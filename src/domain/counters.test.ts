import { describe, expect, it } from 'vitest'
import {
  deadlineOf,
  endDateOf,
  remainingOfBuiltIn,
  remainingOfCustom,
  validateCounter,
  type CounterInput,
} from './counters'
import type { Profile } from './life'

const profile: Profile = { birthDate: '1994-05-12', expectedAge: 80 }
// Friday 18 September 2026. The expected age is reached on 12 May 2074.
const FRIDAY = new Date(2026, 8, 18, 12)

const counter = (overrides: Partial<CounterInput> = {}): CounterInput => ({
  name: 'Visits to my parents',
  times: 2,
  per: 'year',
  end: null,
  ...overrides,
})

describe('remainingOfBuiltIn', () => {
  it('counts Sundays from the next one up to the expected age', () => {
    // 20 Sep 2026 to 12 May 2074 is 17,401 days: 2,485 weeks after the first.
    expect(remainingOfBuiltIn('sundays', profile, FRIDAY)).toBe(2486)
    // From Monday 30 April 2074, only 6 May remains: 13 May is past the end.
    const nearTheEnd = new Date(2074, 3, 30, 12)
    expect(remainingOfBuiltIn('sundays', profile, nearTheEnd)).toBe(1)
  })

  it('counts birthdays, not including the expected age itself', () => {
    // Birthdays 33 through 79.
    expect(remainingOfBuiltIn('birthdays', profile, FRIDAY)).toBe(47)
  })

  it('counts summers by midsummer', () => {
    // 21 June 2027 through 21 June 2073.
    expect(remainingOfBuiltIn('summers', profile, FRIDAY)).toBe(47)
    expect(remainingOfBuiltIn('summers', profile, new Date(2026, 5, 20))).toBe(
      48,
    )
  })

  it('counts full moons from the lunar cycle', () => {
    const moons = remainingOfBuiltIn('full-moons', profile, FRIDAY)
    // About 47.6 years of 29.53-day cycles.
    expect(moons).toBeGreaterThanOrEqual(587)
    expect(moons).toBeLessThanOrEqual(590)
  })

  it('has nothing left in borrowed time', () => {
    const borrowed = { birthDate: '1940-01-01', expectedAge: 80 }
    for (const kind of [
      'sundays',
      'birthdays',
      'summers',
      'full-moons',
    ] as const) {
      expect(remainingOfBuiltIn(kind, borrowed, FRIDAY)).toBe(0)
    }
  })
})

describe('remainingOfCustom', () => {
  it('spreads the frequency over the time left', () => {
    // About 47.65 years at 2 a year.
    expect(remainingOfCustom(counter(), profile, FRIDAY)).toBe(95)
    expect(
      remainingOfCustom(counter({ times: 1, per: 'week' }), profile, FRIDAY),
    ).toBe(2486)
    expect(
      remainingOfCustom(counter({ times: 3, per: 'month' }), profile, FRIDAY),
    ).toBe(1715)
  })

  it('stops when another person reaches an age', () => {
    // Born 1962, until they turn 90: mid-2052, about 25.8 years away.
    const parents = counter({ end: { kind: 'age', birthYear: 1962, age: 90 } })
    expect(remainingOfCustom(parents, profile, FRIDAY)).toBe(51)
  })

  it('stops at a date', () => {
    const untilKidsLeave = counter({
      times: 1,
      per: 'week',
      end: { kind: 'date', date: '2036-09-18' },
    })
    expect(remainingOfCustom(untilKidsLeave, profile, FRIDAY)).toBe(521)
  })

  it('never runs past the user’s own expected age', () => {
    const farEnd = counter({ end: { kind: 'date', date: '2099-01-01' } })
    expect(deadlineOf(farEnd, profile)).toEqual(new Date(2074, 4, 12))
  })

  it('has nothing left once its end has passed', () => {
    const over = counter({ end: { kind: 'date', date: '2020-01-01' } })
    expect(remainingOfCustom(over, profile, FRIDAY)).toBe(0)
  })
})

describe('endDateOf', () => {
  it('uses the middle of the year for a person’s birthday', () => {
    expect(endDateOf({ kind: 'age', birthYear: 1962, age: 90 })).toEqual(
      new Date(2052, 6, 1),
    )
  })
})

describe('validateCounter', () => {
  it('accepts a named, regular event', () => {
    expect(validateCounter(counter(), FRIDAY)).toBeNull()
  })

  it.each([
    [{ name: '   ' }, 'name-empty'],
    [{ name: 'a'.repeat(41) }, 'name-too-long'],
    [{ times: 0 }, 'times'],
    [{ times: 1.5 }, 'times'],
    [{ times: 100 }, 'times'],
    [{ end: { kind: 'age', birthYear: 1850, age: 90 } }, 'birth-year'],
    [{ end: { kind: 'age', birthYear: 2030, age: 90 } }, 'birth-year'],
    [{ end: { kind: 'age', birthYear: 1962, age: 0 } }, 'age'],
    [{ end: { kind: 'age', birthYear: 1950, age: 70 } }, 'end-passed'],
    [{ end: { kind: 'date', date: '2026-02-31' } }, 'end-invalid'],
    [{ end: { kind: 'date', date: '2026-09-01' } }, 'end-passed'],
  ] as const)('rejects %o as %s', (overrides, error) => {
    expect(
      validateCounter(counter(overrides as Partial<CounterInput>), FRIDAY),
    ).toBe(error)
  })
})
