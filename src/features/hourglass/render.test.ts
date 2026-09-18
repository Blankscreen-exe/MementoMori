import { describe, expect, it } from 'vitest'
import type { Layer } from '../../domain/strata'
import { layerColor, seedOf, type Palette } from './render'

const palette: Palette = {
  glass: 'glass',
  sand: 'sand',
  glint: 'glint',
  unrecorded: 'unrecorded',
  missed: 'missed',
  strata: {
    ember: 'ember',
    rose: 'rose',
    moss: 'moss',
    tide: 'tide',
    dusk: 'dusk',
    ochre: 'ochre',
    clay: 'clay',
    sage: 'sage',
    plum: 'plum',
    slate: 'slate',
  },
}

const layer = (kind: Layer['kind'], color?: Layer['color']): Layer => ({
  kind,
  color,
  start: 0,
  end: 1,
})

describe('layerColor', () => {
  it('paints named weeks in their chosen color', () => {
    expect(layerColor(layer('named', 'tide'), palette)).toBe('tide')
  })

  it('settles released weeks as plain sand, like the current week', () => {
    expect(layerColor(layer('released'), palette)).toBe('sand')
    expect(layerColor(layer('current'), palette)).toBe('sand')
  })

  it('keeps grey for missed weeks only', () => {
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
