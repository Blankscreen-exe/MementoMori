import { STRATA_COLORS, type StrataColor } from '../../domain/palette'
import type { Layer } from '../../domain/strata'
import { glassOutline, pileSurfaceY, topSurfaceY, type Glass } from './geometry'

export interface Palette {
  glass: string
  sand: string
  unrecorded: string
  missed: string
  strata: Record<StrataColor, string>
}

/** Reads the theme's CSS variables, so the canvas matches the current mode. */
export function readPalette(root: Element = document.documentElement): Palette {
  const styles = getComputedStyle(root)
  const token = (name: string) => styles.getPropertyValue(`--mm-${name}`).trim()
  return {
    glass: token('glass'),
    sand: token('sand'),
    unrecorded: token('unrecorded'),
    missed: token('missed'),
    strata: Object.fromEntries(
      STRATA_COLORS.map((color) => [color, token(color)]),
    ) as Record<StrataColor, string>,
  }
}

export interface Grain {
  x: number
  y: number
  vy: number
  /** The larger grain dropped once a second. */
  heartbeat: boolean
}

export interface Scene {
  glass: Glass
  /** Share of the expected life already lived, 0 to 1. */
  lived: number
  layers: Layer[]
  /** Slope of the sand surfaces, from device tilt. */
  tilt: number
  grains: Grain[]
}

const bell = (x: number) => Math.exp(-x * x)

/** Top of the sand in the upper bulb, with the funnel dip above the neck. */
function topSandAt(scene: Scene, x: number): number {
  const { glass, lived, tilt } = scene
  const dx = x - glass.cx
  const dip =
    lived < 1
      ? glass.halfHeight * 0.05 * bell(dx / (glass.maxHalfWidth * 0.15))
      : 0
  return topSurfaceY(glass, 1 - lived) + tilt * dx + dip
}

/**
 * A boundary inside the pile, where `share` is how much of the pile lies
 * below it. The pile's top (share 1) carries the small mound under the stream.
 */
function pileBoundaryAt(scene: Scene, share: number, x: number): number {
  const { glass, lived, tilt } = scene
  const dx = x - glass.cx
  const mound =
    glass.halfHeight *
    0.08 *
    Math.min(1, lived * 3) *
    share *
    bell(dx / (glass.maxHalfWidth * 0.5))
  return pileSurfaceY(glass, share * lived) + tilt * dx * share - mound
}

function layerColor(layer: Layer, palette: Palette): string {
  switch (layer.kind) {
    case 'unrecorded':
      return palette.unrecorded
    case 'current':
      return palette.sand
    case 'named':
      return layer.color ? palette.strata[layer.color] : palette.sand
    case 'missed':
    case 'released':
      return palette.missed
  }
}

function fillBelow(
  ctx: CanvasRenderingContext2D,
  glass: Glass,
  surface: (x: number) => number,
  floor: number,
  color: string,
) {
  const left = glass.cx - glass.maxHalfWidth - 2
  const right = glass.cx + glass.maxHalfWidth + 2
  const step = Math.max(2, glass.maxHalfWidth / 40)
  ctx.beginPath()
  ctx.moveTo(left, surface(left))
  for (let x = left + step; x < right; x += step) ctx.lineTo(x, surface(x))
  ctx.lineTo(right, surface(right))
  ctx.lineTo(right, floor)
  ctx.lineTo(left, floor)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

export function drawHourglass(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  palette: Palette,
  width: number,
  height: number,
) {
  const { glass } = scene
  ctx.clearRect(0, 0, width, height)

  const outline = new Path2D()
  glassOutline(glass).forEach(([x, y], i) =>
    i === 0 ? outline.moveTo(x, y) : outline.lineTo(x, y),
  )
  outline.closePath()

  ctx.save()
  ctx.clip(outline)

  // Upper bulb: the time that remains.
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, width, glass.neck)
  ctx.clip()
  fillBelow(
    ctx,
    glass,
    (x) => topSandAt(scene, x),
    glass.neck + 1,
    palette.sand,
  )
  ctx.restore()

  // Lower bulb: the strata of the time lived, drawn from the top layer down so
  // each older layer paints over the lower part of the one above it.
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, glass.neck, width, height)
  ctx.clip()
  for (let i = scene.layers.length - 1; i >= 0; i--) {
    const layer = scene.layers[i]
    fillBelow(
      ctx,
      glass,
      (x) => pileBoundaryAt(scene, layer.end, x),
      glass.bottom + 1,
      layerColor(layer, palette),
    )
  }
  ctx.restore()

  // The falling stream.
  ctx.fillStyle = palette.sand
  const radius = Math.max(0.6, glass.halfHeight * 0.004)
  for (const grain of scene.grains) {
    ctx.beginPath()
    ctx.arc(
      grain.x,
      grain.y,
      grain.heartbeat ? radius * 2 : radius,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }

  ctx.restore()

  ctx.strokeStyle = palette.glass
  ctx.lineWidth = 1
  ctx.stroke(outline)
}

/**
 * Advances the stream by `dt` milliseconds: grains fall under gravity and
 * disappear into the pile. New grains trickle constantly, plus one larger
 * grain at the start of every second.
 */
export function advanceStream(
  scene: Scene,
  dt: number,
  time: number,
  lastSecond: number,
): { grains: Grain[]; second: number } {
  const { glass } = scene
  const grains: Grain[] = []
  for (const grain of scene.grains) {
    const vy = grain.vy + glass.halfHeight * 4e-6 * dt
    const y = grain.y + vy * dt
    if (y < pileBoundaryAt(scene, 1, grain.x)) grains.push({ ...grain, vy, y })
  }

  const second = Math.floor(time / 1000)
  if (scene.lived < 1) {
    const spawn = (heartbeat: boolean) =>
      grains.push({
        x:
          glass.cx +
          (heartbeat ? 0 : (Math.random() - 0.5) * glass.neckHalfWidth),
        y: glass.neck - glass.neckHalfWidth,
        vy: glass.halfHeight * (2.5e-4 + Math.random() * 1.5e-4),
        heartbeat,
      })
    if (Math.random() < Math.min(1, dt * 0.05)) spawn(false)
    if (second !== lastSecond) spawn(true)
  }

  return { grains, second }
}
