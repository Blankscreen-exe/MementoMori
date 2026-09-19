import { describe, expect, it } from 'vitest'
import type { Profile } from './life'
import type { WeekEntries } from './ritual'
import { buildStrata } from './strata'

// Born on a Monday, so every week lines up with a quarter of the pile below.
const profile: Profile = { birthDate: '2000-01-03', expectedAge: 80 }
const FOUR_WEEKS_LATER = new Date(2000, 0, 31)

describe('buildStrata', () => {
  it('lays down unrecorded, named, missed and released weeks in order', () => {
    const entries: WeekEntries = {
      '2000-01-16': { outcome: 'named', name: 'first' },
      '2000-01-30': { outcome: 'released' },
    }
    const layers = buildStrata(profile, {
      now: FOUR_WEEKS_LATER,
      firstWeek: '2000-01-16',
      entries,
    })

    expect(layers).toEqual([
      { kind: 'unrecorded', start: 0, end: expect.closeTo(0.25) },
      {
        kind: 'named',
        start: expect.closeTo(0.25),
        end: expect.closeTo(0.5),
      },
      { kind: 'missed', start: expect.closeTo(0.5), end: expect.closeTo(0.75) },
      { kind: 'released', start: expect.closeTo(0.75), end: 1 },
    ])
  })

  it('merges neighbouring weeks with the same outcome', () => {
    const entries: WeekEntries = {
      '2000-01-09': { outcome: 'named', name: 'a' },
      '2000-01-16': { outcome: 'named', name: 'b' },
      '2000-01-23': { outcome: 'released' },
    }
    const layers = buildStrata(profile, {
      now: new Date(2000, 0, 24),
      firstWeek: '2000-01-09',
      entries,
    })

    expect(layers.map((l) => l.kind)).toEqual(['named', 'released'])
  })

  it('ends with the partial current week while it is unanswered', () => {
    const wednesday = new Date(2000, 0, 12)
    const layers = buildStrata(profile, {
      now: wednesday,
      firstWeek: '2000-01-09',
      entries: {},
    })

    expect(layers.at(-1)).toMatchObject({ kind: 'current', end: 1 })
  })

  it('covers the whole pile without gaps', () => {
    const layers = buildStrata(
      { birthDate: '1994-05-12', expectedAge: 80 },
      { now: new Date(2026, 8, 18, 14), firstWeek: '2026-03-01', entries: {} },
    )

    expect(layers[0].start).toBe(0)
    expect(layers.at(-1)?.end).toBe(1)
    for (let i = 1; i < layers.length; i++) {
      expect(layers[i].start).toBe(layers[i - 1].end)
    }
  })

  it('is empty before birth', () => {
    expect(
      buildStrata(profile, {
        now: new Date(1999, 0, 1),
        firstWeek: '1999-01-03',
        entries: {},
      }),
    ).toEqual([])
  })
})
