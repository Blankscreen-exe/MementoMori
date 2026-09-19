import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import {
  facetedGlass,
  GLASS,
  outlineEdges,
  pileSandLevel,
  radiusAt,
  sparkPosition,
  strokeWidth,
  topSandLevel,
} from './geometry3d'

/** Independent numeric integration of the bulb volume between two heights. */
function volumeBetween(from: number, to: number): number {
  const steps = 4000
  const dy = (to - from) / steps
  let volume = 0
  for (let i = 0; i < steps; i++)
    volume += radiusAt(from + (i + 0.5) * dy) ** 2 * dy
  return Math.abs(volume)
}
const bulb = volumeBetween(0, GLASS.halfHeight)

describe('radiusAt', () => {
  it('is narrowest at the neck, widest at the ends, and symmetric', () => {
    expect(radiusAt(0)).toBe(GLASS.neckRadius)
    expect(radiusAt(1)).toBeCloseTo(GLASS.maxRadius)
    expect(radiusAt(0.4)).toBeCloseTo(radiusAt(-0.4))
  })
})

describe('sand levels', () => {
  it('range from the neck to the ends', () => {
    expect(topSandLevel(0)).toBe(0)
    expect(topSandLevel(1)).toBeCloseTo(1)
    expect(pileSandLevel(0)).toBeCloseTo(-1)
    expect(pileSandLevel(1)).toBeCloseTo(0)
  })

  it.each([0.1, 0.4, 0.75])('hold %f of the bulb by volume', (share) => {
    expect(volumeBetween(0, topSandLevel(share)) / bulb).toBeCloseTo(share, 2)
    expect(volumeBetween(-1, pileSandLevel(share)) / bulb).toBeCloseTo(share, 2)
  })

  it('conserve sand between the bulbs', () => {
    const lived = 0.4
    const top = volumeBetween(0, topSandLevel(1 - lived))
    const pile = volumeBetween(-1, pileSandLevel(lived))
    expect((top + pile) / bulb).toBeCloseTo(1, 2)
  })
})

describe('outlineEdges', () => {
  const glass = facetedGlass()

  it('builds one facet per segment and ring gap', () => {
    expect(glass.facets).toHaveLength(GLASS.facets * GLASS.rings)
  })

  it('shows only the sides of the glass when seen from the front', () => {
    const edges = outlineEdges(glass, new Vector3(0, 0, 50))
    expect(edges.length).toBeGreaterThan(0)
    for (const { a, b } of edges) {
      const mid = a.clone().add(b).multiplyScalar(0.5)
      // On the left or right edge, never across the middle of the glass.
      expect(Math.abs(mid.x)).toBeGreaterThan(radiusAt(mid.y) * 0.85)
    }
  })

  it('follows the viewer around the glass', () => {
    const front = outlineEdges(glass, new Vector3(0, 0, 50))
    const side = outlineEdges(glass, new Vector3(50, 0, 0))
    const sideEdges = new Set(side)
    expect(front.some((edge) => !sideEdges.has(edge))).toBe(true)
  })
})

describe('strokeWidth', () => {
  it('is heaviest at the neck and lightest on the flank', () => {
    expect(strokeWidth(0, 0, 1)).toBeGreaterThan(strokeWidth(0.5, 0, 1) * 2)
  })

  it('swells at the rims', () => {
    expect(strokeWidth(1, 0, 1)).toBeGreaterThan(strokeWidth(0.6, 0, 1))
  })

  it('is heavier on the side away from the light', () => {
    expect(strokeWidth(0.5, -1, 1)).toBeGreaterThan(strokeWidth(0.5, 1, 1) * 3)
  })

  it('scales with the weight', () => {
    expect(strokeWidth(0.3, 0, 2)).toBeCloseTo(strokeWidth(0.3, 0, 1) * 2)
  })
})

describe('sparkPosition', () => {
  it('sits on the top sand, below its surface, just outside the sand', () => {
    const remaining = 0.6
    const spark = sparkPosition(0.5, remaining, 0.25)
    expect(spark.y).toBeGreaterThan(0)
    expect(spark.y).toBeLessThan(topSandLevel(remaining))
    const r = Math.hypot(spark.x, spark.z)
    expect(r).toBeLessThan(radiusAt(spark.y))
    expect(r).toBeGreaterThan(radiusAt(spark.y) * 0.97)
  })

  it('turns around the glass with its seed', () => {
    const a = sparkPosition(0.5, 0.6, 0)
    const b = sparkPosition(0.5, 0.6, 0.5)
    expect(a.z).toBeCloseTo(-b.z)
  })
})
