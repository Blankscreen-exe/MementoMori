import { describe, expect, it } from 'vitest'
import type { Layer } from '../../domain/strata'
import { layerColor, type Palette } from './render'

const palette: Palette = {
  glass: 'glass',
  sand: 'sand',
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
