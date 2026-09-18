/**
 * Draws the app icon from the same glass geometry the app uses, and writes it
 * to public/favicon.svg. `pwa-assets-generator` then renders every PNG size
 * from it (see pwa-assets.config.ts). Run both with `bun run icons`.
 */
import { writeFileSync } from 'node:fs'
import {
  createGlass,
  glassOutline,
  pileSurfaceY,
  topSurfaceY,
} from '../src/features/hourglass/geometry.ts'

const SIZE = 512
const BACKGROUND = '#000000'
const SAND = '#ffffff'
const PILE = '#ffffff'
const GLASS = '#ffffff'
/** Share of the sand shown as fallen, as if a life were 40% lived. */
const LIVED = 0.4

// The glass takes up about three quarters of the icon's height.
const glassBox = { width: SIZE, height: SIZE * 0.78 }
const offsetY = (SIZE - glassBox.height) / 2
const glass = createGlass(glassBox.width, glassBox.height)

const round = (n: number) => Math.round(n * 10) / 10
const outline =
  glassOutline(glass, 4)
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${round(x)} ${round(y)}`)
    .join(' ') + ' Z'

const sandTop = topSurfaceY(glass, 1 - LIVED)
const pileTop = pileSurfaceY(glass, LIVED)
const grains = [0.25, 0.5, 0.75].map((t) => ({
  cy: glass.neck + (pileTop - glass.neck) * t,
  r: 4,
}))

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${BACKGROUND}"/>
  <g transform="translate(0 ${round(offsetY)})">
    <clipPath id="glass"><path d="${outline}"/></clipPath>
    <g clip-path="url(#glass)">
      <rect x="0" y="${round(sandTop)}" width="${SIZE}" height="${round(glass.neck - sandTop)}" fill="${SAND}"/>
      <rect x="0" y="${round(pileTop)}" width="${SIZE}" height="${round(glass.bottom - pileTop)}" fill="${PILE}"/>
      ${grains.map(({ cy, r }) => `<circle cx="${glass.cx}" cy="${round(cy)}" r="${r}" fill="${SAND}"/>`).join('\n      ')}
    </g>
    <path d="${outline}" fill="none" stroke="${GLASS}" stroke-width="5"/>
  </g>
</svg>
`

writeFileSync(new URL('../public/favicon.svg', import.meta.url), svg)
console.log('Wrote public/favicon.svg')
