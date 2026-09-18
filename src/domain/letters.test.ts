import { describe, expect, it } from 'vitest'
import {
  deliveryFor,
  hasArrived,
  isUnread,
  MAX_LETTER_LENGTH,
  presetDate,
  remainingShareOf,
  validateLetterBody,
  type Letter,
} from './letters'
import type { Profile } from './life'

const profile: Profile = { birthDate: '1994-05-12', expectedAge: 80 }
const FRIDAY = new Date(2026, 8, 18, 12)

const letter = (week: string, openedAt: string | null = null): Letter => ({
  id: 'a',
  body: 'hello',
  writtenAt: '2026-09-18T12:00:00.000Z',
  week,
  openedAt,
})

describe('validateLetterBody', () => {
  it('accepts up to 2,000 characters', () => {
    expect(validateLetterBody('Dear me,')).toBeNull()
    expect(validateLetterBody('a'.repeat(MAX_LETTER_LENGTH))).toBeNull()
  })

  it('rejects blank and overly long letters', () => {
    expect(validateLetterBody('  \n ')).toBe('empty')
    expect(validateLetterBody('a'.repeat(MAX_LETTER_LENGTH + 1))).toBe(
      'too-long',
    )
  })
})

describe('presetDate', () => {
  it('finds the next birthday', () => {
    expect(presetDate('next-birthday', profile, FRIDAY)).toEqual(
      new Date(2027, 4, 12),
    )
    expect(presetDate('next-birthday', profile, new Date(2026, 2, 1))).toEqual(
      new Date(2026, 4, 12),
    )
  })

  it('treats a birthday that is today as passed', () => {
    expect(
      presetDate('next-birthday', profile, new Date(2026, 4, 12, 9)),
    ).toEqual(new Date(2027, 4, 12))
  })

  it('handles birthdays on 29 February', () => {
    const leap = { birthDate: '2000-02-29', expectedAge: 80 }
    expect(presetDate('next-birthday', leap, FRIDAY)).toEqual(
      new Date(2027, 1, 28),
    )
  })

  it('counts whole years from today', () => {
    expect(presetDate('in-1-year', profile, FRIDAY)).toEqual(
      new Date(2027, 8, 18),
    )
    expect(presetDate('in-10-years', profile, FRIDAY)).toEqual(
      new Date(2036, 8, 18),
    )
  })
})

describe('deliveryFor', () => {
  it('delivers to the week containing the date', () => {
    expect(deliveryFor(new Date(2027, 4, 12), profile, FRIDAY)).toEqual({
      week: '2027-05-16',
    })
  })

  it('needs a later week than this one', () => {
    expect(deliveryFor(new Date(2026, 8, 20), profile, FRIDAY)).toEqual({
      error: 'too-soon',
    })
    expect(deliveryFor(new Date(2026, 0, 1), profile, FRIDAY)).toEqual({
      error: 'too-soon',
    })
    expect(deliveryFor(new Date(2026, 8, 21), profile, FRIDAY)).toEqual({
      week: '2026-09-27',
    })
  })

  it('stays within the expected lifespan', () => {
    expect(deliveryFor(new Date(2074, 4, 12), profile, FRIDAY)).toEqual({
      week: '2074-05-13',
    })
    expect(deliveryFor(new Date(2074, 4, 13), profile, FRIDAY)).toEqual({
      error: 'beyond-lifespan',
    })
  })

  it('rejects impossible dates', () => {
    expect(deliveryFor(new Date(Number.NaN), profile, FRIDAY)).toEqual({
      error: 'invalid',
    })
  })
})

describe('arrival', () => {
  it('arrives when its week begins', () => {
    const sealed = letter('2026-09-27')
    expect(hasArrived(sealed, new Date(2026, 8, 20, 23, 59))).toBe(false)
    expect(hasArrived(sealed, new Date(2026, 8, 21, 0, 0))).toBe(true)
  })

  it('is unread until opened', () => {
    const now = new Date(2026, 8, 22)
    expect(isUnread(letter('2026-09-27'), now)).toBe(true)
    expect(isUnread(letter('2026-09-27', '2026-09-22T08:00:00Z'), now)).toBe(
      false,
    )
    expect(isUnread(letter('2026-10-04'), now)).toBe(false)
  })
})

describe('remainingShareOf', () => {
  it('places a sealed letter within the remaining time', () => {
    const halfway = remainingShareOf(letter('2050-07-17'), profile, FRIDAY)
    expect(halfway).toBeGreaterThan(0.45)
    expect(halfway).toBeLessThan(0.55)
    expect(
      remainingShareOf(letter('2026-09-27'), profile, FRIDAY),
    ).toBeLessThan(0.001)
  })

  it('has no place once the letter has arrived', () => {
    expect(remainingShareOf(letter('2026-09-20'), profile, FRIDAY)).toBeNull()
  })
})
