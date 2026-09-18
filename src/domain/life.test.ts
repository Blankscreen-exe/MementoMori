import { describe, expect, it } from 'vitest'
import {
  expectedDeathOf,
  formatTimeOfDay,
  isBorrowedTime,
  lifeAsTimeOfDay,
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

describe('lifeAsTimeOfDay', () => {
  it('maps a life onto a 24-hour day', () => {
    expect(lifeAsTimeOfDay(0)).toEqual({ hours: 0, minutes: 0 })
    expect(lifeAsTimeOfDay(0.425)).toEqual({ hours: 10, minutes: 12 })
    expect(lifeAsTimeOfDay(0.5)).toEqual({ hours: 12, minutes: 0 })
    expect(lifeAsTimeOfDay(1)).toEqual({ hours: 24, minutes: 0 })
  })

  it('clamps out-of-range fractions', () => {
    expect(lifeAsTimeOfDay(-1)).toEqual({ hours: 0, minutes: 0 })
    expect(lifeAsTimeOfDay(2)).toEqual({ hours: 24, minutes: 0 })
  })
})

describe('formatTimeOfDay', () => {
  it.each([
    [0, 0, '12:00 AM'],
    [10, 12, '10:12 AM'],
    [12, 0, '12:00 PM'],
    [13, 5, '1:05 PM'],
    [23, 59, '11:59 PM'],
    [24, 0, '12:00 AM'],
  ])('formats %i:%i as %s', (hours, minutes, expected) => {
    expect(formatTimeOfDay({ hours, minutes })).toBe(expected)
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
