import { describe, expect, it } from 'vitest'
import {
  createGlass,
  GLASS_RATIO,
  halfWidthAt,
  pileSurfaceY,
  topSurfaceY,
  type Glass,
} from './geometry'

const glass = createGlass(330, 540)

/** Independent numeric integration of the glass area between two heights. */
function areaBetween(g: Glass, from: number, to: number): number {
  const steps = 4000
  const dy = (to - from) / steps
  let area = 0
  for (let i = 0; i < steps; i++) {
    area += 2 * halfWidthAt(g, from + (i + 0.5) * dy) * dy
  }
  return area
}

describe('createGlass', () => {
  it('fits the box while keeping its proportions', () => {
    const wide = createGlass(1000, 540)
    const narrow = createGlass(200, 1000)
    expect(wide.maxHalfWidth * 2).toBeLessThan(540 * GLASS_RATIO)
    expect(narrow.maxHalfWidth * 2).toBeLessThan(200)
    expect(wide.cx).toBe(500)
  })

  it('is narrowest at the neck and symmetric around it', () => {
    expect(halfWidthAt(glass, glass.neck)).toBe(glass.neckHalfWidth)
    expect(halfWidthAt(glass, glass.neck - 50)).toBeCloseTo(
      halfWidthAt(glass, glass.neck + 50),
    )
    expect(halfWidthAt(glass, glass.top)).toBeCloseTo(glass.maxHalfWidth)
  })

  it('computes the bulb area', () => {
    expect(glass.bulbArea).toBeCloseTo(
      areaBetween(glass, glass.neck, glass.bottom),
      0,
    )
  })
})

describe('topSurfaceY', () => {
  it('ranges from the neck (empty) to the top (full)', () => {
    expect(topSurfaceY(glass, 0)).toBeCloseTo(glass.neck)
    expect(topSurfaceY(glass, 1)).toBeCloseTo(glass.top)
  })

  it.each([0.1, 0.25, 0.5, 0.9])(
    'holds %f of the bulb by area, not by height',
    (filled) => {
      const surface = topSurfaceY(glass, filled)
      const area = areaBetween(glass, surface, glass.neck)
      expect(area / glass.bulbArea).toBeCloseTo(filled, 2)
    },
  )
})

describe('pileSurfaceY', () => {
  it('ranges from the bottom (empty) to the neck (full)', () => {
    expect(pileSurfaceY(glass, 0)).toBeCloseTo(glass.bottom)
    expect(pileSurfaceY(glass, 1)).toBeCloseTo(glass.neck)
  })

  it.each([0.1, 0.25, 0.5, 0.9])('holds %f of the bulb by area', (filled) => {
    const surface = pileSurfaceY(glass, filled)
    const area = areaBetween(glass, surface, glass.bottom)
    expect(area / glass.bulbArea).toBeCloseTo(filled, 2)
  })

  it('mirrors the top bulb: sand that leaves one arrives in the other', () => {
    const lived = 0.4
    const topSand = areaBetween(
      glass,
      topSurfaceY(glass, 1 - lived),
      glass.neck,
    )
    const pile = areaBetween(glass, pileSurfaceY(glass, lived), glass.bottom)
    expect((topSand + pile) / glass.bulbArea).toBeCloseTo(1, 2)
  })
})
