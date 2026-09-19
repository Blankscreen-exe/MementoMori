import { describe, expect, it } from 'vitest'
import type { Layer } from '../../domain/strata'
import { layerColor, seedOf, type Palette } from './render'

const palette: Palette = {
  canvas: 'canvas',
  glass: 'glass',
  sand: 'sand',
  glint: 'glint',
  unrecorded: 'unrecorded',
  missed: 'missed',
}

const layer = (kind: Layer['kind']): Layer => ({ kind, start: 0, end: 1 })

describe('layerColor', () => {
  it('settles named, released and current weeks as sand', () => {
    expect(layerColor(layer('named'), palette)).toBe('sand')
    expect(layerColor(layer('released'), palette)).toBe('sand')
    expect(layerColor(layer('current'), palette)).toBe('sand')
  })

  it('keeps separate tokens for missed and unrecorded weeks', () => {
    expect(layerColor(layer('missed'), palette)).toBe('missed')
    expect(layerColor(layer('unrecorded'), palette)).toBe('unrecorded')
  })
})

describe('seedOf', () => {
  it('is stable for the same id', () => {
    expect(seedOf('letter-1')).toBe(seedOf('letter-1'))
  })

  it('spreads ids that differ by a single character', () => {
    const seeds = ['s1', 's2', 's3', 's4', 's5'].map(seedOf)
    for (const seed of seeds) {
      expect(seed).toBeGreaterThanOrEqual(0)
      expect(seed).toBeLessThan(1)
    }
    expect(Math.max(...seeds) - Math.min(...seeds)).toBeGreaterThan(0.3)
  })
})
