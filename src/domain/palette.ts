/** The curated tones a week can be painted with. Hex values live in the theme. */
export const STRATA_COLORS = [
  'ember',
  'rose',
  'moss',
  'tide',
  'dusk',
  'ochre',
  'clay',
  'sage',
  'plum',
  'slate',
] as const

export type StrataColor = (typeof STRATA_COLORS)[number]

export function isStrataColor(value: unknown): value is StrataColor {
  return (STRATA_COLORS as readonly unknown[]).includes(value)
}
