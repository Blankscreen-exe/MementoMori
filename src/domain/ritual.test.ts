import { describe, expect, it } from 'vitest'
import {
  canAnswer,
  isRitualOpen,
  normalizeWeekName,
  validateWeekName,
  weekStatus,
  type RitualContext,
  type WeekEntries,
} from './ritual'

const SUNDAY = new Date(2026, 8, 20, 10)
const named: WeekEntries = {
  '2026-09-20': { outcome: 'named', name: 'moved' },
}
const released: WeekEntries = { '2026-09-20': { outcome: 'released' } }

describe('isRitualOpen', () => {
  it('opens on Sunday while the week is unanswered', () => {
    expect(isRitualOpen(SUNDAY, {})).toBe(true)
  })

  it('stays open until the last moment of Sunday', () => {
    expect(isRitualOpen(new Date(2026, 8, 20, 23, 59, 59), {})).toBe(true)
  })

  it('closes for good once the week is named or released', () => {
    expect(isRitualOpen(SUNDAY, named)).toBe(false)
    expect(isRitualOpen(SUNDAY, released)).toBe(false)
  })

  it('is closed on every other day', () => {
    expect(isRitualOpen(new Date(2026, 8, 19, 23, 59), {})).toBe(false) // Saturday
    expect(isRitualOpen(new Date(2026, 8, 21, 0, 0), {})).toBe(false) // Monday
  })
})

describe('weekStatus', () => {
  const context = (
    now: Date,
    entries: WeekEntries = {},
    firstWeek = '2026-09-06',
  ): RitualContext => ({ now, firstWeek, entries })

  it('marks weeks before first use as unrecorded', () => {
    expect(weekStatus('2026-08-30', context(SUNDAY))).toBe('unrecorded')
  })

  it('marks weeks after the current one as future', () => {
    expect(weekStatus('2026-09-27', context(SUNDAY))).toBe('future')
  })

  it('reports the recorded outcome of an answered week', () => {
    expect(weekStatus('2026-09-20', context(SUNDAY, named))).toBe('named')
    expect(weekStatus('2026-09-20', context(SUNDAY, released))).toBe('released')
  })

  it('keeps the unanswered current week open, even on its Sunday', () => {
    expect(weekStatus('2026-09-20', context(SUNDAY))).toBe('current')
  })

  it('marks an unanswered week as missed once its Sunday is over', () => {
    const monday = new Date(2026, 8, 21, 0, 0)
    expect(weekStatus('2026-09-20', context(monday))).toBe('missed')
    expect(weekStatus('2026-09-13', context(SUNDAY))).toBe('missed')
  })

  it('counts the first week as recorded, even when first used on its Sunday', () => {
    const firstWeek = '2026-09-20'
    expect(weekStatus('2026-09-20', context(SUNDAY, {}, firstWeek))).toBe(
      'current',
    )
  })
})

describe('canAnswer', () => {
  it('accepts an answer for this week while its Sunday lasts', () => {
    expect(canAnswer('2026-09-20', SUNDAY, {})).toBe(true)
    expect(
      canAnswer('2026-09-20', new Date(2026, 8, 20, 23, 59, 59, 999), {}),
    ).toBe(true)
  })

  it('refuses an answer submitted after Sunday midnight', () => {
    expect(canAnswer('2026-09-20', new Date(2026, 8, 21, 0, 0, 1), {})).toBe(
      false,
    )
  })

  it('refuses a second answer for the same week', () => {
    expect(canAnswer('2026-09-20', SUNDAY, named)).toBe(false)
    expect(canAnswer('2026-09-20', SUNDAY, released)).toBe(false)
  })

  it('refuses answers for any other week', () => {
    expect(canAnswer('2026-09-13', SUNDAY, {})).toBe(false)
    expect(canAnswer('2026-09-27', SUNDAY, {})).toBe(false)
  })
})

describe('week names', () => {
  it('trims and collapses whitespace', () => {
    expect(normalizeWeekName('  moved   to\tLisbon ')).toBe('moved to Lisbon')
  })

  it('accepts one word or a short phrase', () => {
    expect(validateWeekName('moved')).toBeNull()
    expect(validateWeekName('moved to Lisbon')).toBeNull()
    expect(validateWeekName('a'.repeat(40))).toBeNull()
  })

  it('rejects blank and overly long names', () => {
    expect(validateWeekName('   ')).toBe('empty')
    expect(validateWeekName('a'.repeat(41))).toBe('too-long')
  })

  it('measures length after collapsing whitespace', () => {
    expect(
      validateWeekName(`${'a'.repeat(20)}     ${'b'.repeat(19)}`),
    ).toBeNull()
  })
})
