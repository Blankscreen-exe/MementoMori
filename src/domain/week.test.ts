import { describe, expect, it } from 'vitest'
import { weekKeyOf, weekStartOf, weekStartOfKey } from './week'

describe('weekKeyOf', () => {
  it('keys a week by its Sunday', () => {
    expect(weekKeyOf(new Date(2026, 8, 14))).toBe('2026-09-20') // Monday
    expect(weekKeyOf(new Date(2026, 8, 17, 12))).toBe('2026-09-20') // Thursday
    expect(weekKeyOf(new Date(2026, 8, 20))).toBe('2026-09-20') // Sunday
  })

  it('switches weeks exactly at Monday midnight', () => {
    expect(weekKeyOf(new Date(2026, 8, 20, 23, 59, 59, 999))).toBe('2026-09-20')
    expect(weekKeyOf(new Date(2026, 8, 21, 0, 0, 0, 0))).toBe('2026-09-27')
  })

  it('handles weeks that span a new year', () => {
    expect(weekKeyOf(new Date(2026, 11, 31))).toBe('2027-01-03')
  })

  it('produces keys that sort chronologically as strings', () => {
    const keys = [
      new Date(2027, 0, 1),
      new Date(2026, 8, 14),
      new Date(2026, 9, 5),
    ].map(weekKeyOf)
    expect([...keys].sort()).toEqual(['2026-09-20', '2026-10-11', '2027-01-03'])
  })
})

describe('weekStartOf', () => {
  it('returns Monday at midnight', () => {
    expect(weekStartOf(new Date(2026, 8, 20, 15, 30))).toEqual(
      new Date(2026, 8, 14),
    )
  })
})

describe('weekStartOfKey', () => {
  it('returns the Monday six days before the key', () => {
    expect(weekStartOfKey('2026-09-20')).toEqual(new Date(2026, 8, 14))
  })

  it('round-trips with weekKeyOf', () => {
    expect(weekKeyOf(weekStartOfKey('2027-01-03'))).toBe('2027-01-03')
  })
})
