import { describe, expect, it } from 'vitest'
import {
  daysBorrowed,
  daysRemaining,
  expectedDeathOf,
  isBorrowedTime,
  lifeFraction,
  validateBirthDate,
  validateExpectedAge,
  weeksLived,
  weeksRemaining,
  type Profile,
} from './life'

const profile: Profile = { birthDate: '1994-05-12', expectedAge: 80 }

describe('expectedDeathOf', () => {
  it('adds the expected age in calendar years', () => {
    expect(expectedDeathOf(profile)).toEqual(new Date(2074, 4, 12))
  })
})

describe('lifeFraction', () => {
  it('is 0 at birth and 0.5 halfway through', () => {
    expect(lifeFraction(profile, new Date(1994, 4, 12))).toBe(0)
    expect(lifeFraction(profile, new Date(2034, 4, 12))).toBeCloseTo(0.5, 6)
  })

  it('is clamped to [0, 1]', () => {
    expect(lifeFraction(profile, new Date(1990, 0, 1))).toBe(0)
    expect(lifeFraction(profile, new Date(2090, 0, 1))).toBe(1)
  })
})

describe('isBorrowedTime', () => {
  it('starts exactly at the expected age', () => {
    expect(isBorrowedTime(profile, new Date(2074, 4, 11, 23, 59))).toBe(false)
    expect(isBorrowedTime(profile, new Date(2074, 4, 12))).toBe(true)
  })
})

describe('weeksLived / weeksRemaining', () => {
  it('counts whole weeks', () => {
    expect(weeksLived(profile, new Date(1994, 4, 20))).toBe(1)
    expect(weeksRemaining(profile, new Date(2074, 4, 4))).toBe(1)
  })

  it('never goes negative', () => {
    expect(weeksLived(profile, new Date(1990, 0, 1))).toBe(0)
    expect(weeksRemaining(profile, new Date(2090, 0, 1))).toBe(0)
  })
})

describe('daysRemaining / daysBorrowed', () => {
  it('counts calendar days to the expected age', () => {
    // 18 Sep 2026 to 12 May 2074: 48 years (17,532 days) less 129 days.
    expect(daysRemaining(profile, new Date(2026, 8, 18, 12))).toBe(17403)
    expect(daysRemaining(profile, new Date(2074, 4, 10, 23))).toBe(2)
  })

  it('reaches zero on the day itself, and never goes negative', () => {
    expect(daysRemaining(profile, new Date(2074, 4, 12))).toBe(0)
    expect(daysRemaining(profile, new Date(2080, 0, 1))).toBe(0)
  })

  it('counts days borrowed only once the expected age has passed', () => {
    expect(daysBorrowed(profile, new Date(2074, 4, 11))).toBe(0)
    expect(daysBorrowed(profile, new Date(2074, 4, 12))).toBe(0)
    expect(daysBorrowed(profile, new Date(2074, 4, 15, 9))).toBe(3)
  })
})

describe('validateBirthDate', () => {
  const now = new Date(2026, 8, 18)

  it('accepts a past date within the supported range', () => {
    expect(validateBirthDate('1994-05-12', now)).toBeNull()
  })

  it('rejects malformed, future and implausibly old dates', () => {
    expect(validateBirthDate('not a date', now)).toBe('invalid')
    expect(validateBirthDate('2027-01-01', now)).toBe('future')
    expect(validateBirthDate('1900-01-01', now)).toBe('too-old')
  })
})

describe('validateExpectedAge', () => {
  it('accepts whole years from 1 to 120', () => {
    expect(validateExpectedAge(1)).toBeNull()
    expect(validateExpectedAge(80)).toBeNull()
    expect(validateExpectedAge(120)).toBeNull()
  })

  it('rejects fractions and out-of-range values', () => {
    expect(validateExpectedAge(80.5)).toBe('not-whole')
    expect(validateExpectedAge(Number.NaN)).toBe('not-whole')
    expect(validateExpectedAge(0)).toBe('out-of-range')
    expect(validateExpectedAge(121)).toBe('out-of-range')
  })
})
