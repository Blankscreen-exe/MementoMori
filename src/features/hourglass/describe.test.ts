import { describe, expect, it } from 'vitest'
import type { Letter } from '../../domain/letters'
import { describeHourglass, sealedSparks } from './describe'

const profile = { birthDate: '1994-05-12', expectedAge: 80 }
const FRIDAY = new Date(2026, 8, 18, 12)
const letter = (id: string, week: string): Letter => ({
  id,
  body: '',
  writtenAt: '2026-01-01T00:00:00.000Z',
  week,
  openedAt: null,
})

describe('sealedSparks', () => {
  it('keeps only letters still sealed, each with a stable seed', () => {
    const sparks = sealedSparks(
      [letter('sealed', '2030-05-12'), letter('arrived', '2026-09-13')],
      profile,
      FRIDAY,
    )
    expect(sparks).toHaveLength(1)
    expect(sparks[0].share).toBeGreaterThan(0)
    expect(sparks[0].seed).toBe(
      sealedSparks([letter('sealed', '2030-05-12')], profile, FRIDAY)[0].seed,
    )
  })
})

describe('describeHourglass', () => {
  it('says how much of life has passed and how many weeks remain', () => {
    expect(describeHourglass(profile, new Date(2034, 4, 12), 0)).toBe(
      'An hourglass. 50% of your expected life has passed, and about 2,087 weeks remain.',
    )
  })

  it('hints at sealed letters without revealing them', () => {
    expect(describeHourglass(profile, FRIDAY, 2)).toMatch(
      /Something glints in the sand\.$/,
    )
  })

  it('describes borrowed time', () => {
    expect(
      describeHourglass(
        { birthDate: '1940-01-01', expectedAge: 80 },
        FRIDAY,
        0,
      ),
    ).toBe('An hourglass that has run out. Every week now is borrowed.')
  })
})
