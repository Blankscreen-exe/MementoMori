import type { Layer } from '../../domain/strata'
import {
  glassOutline,
  halfWidthAt,
  pileSurfaceY,
  topSurfaceY,
  type Glass,
} from './geometry'

export interface Palette {
  canvas: string
  glass: string
  sand: string
  glint: string
  unrecorded: string
  missed: string
}

/** Reads the theme's CSS variables, so the canvas matches the current mode. */
export function readPalette(root: Element = document.documentElement): Palette {
  const styles = getComputedStyle(root)
  const token = (name: string) => styles.getPropertyValue(`--mm-${name}`).trim()
  return {
    canvas: token('canvas'),
    glass: token('glass'),
    sand: token('sand'),
    glint: token('glint'),
    unrecorded: token('unrecorded'),
    missed: token('missed'),
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
  glints: Glint[]
}

/** A sealed letter, glinting at its week's place in the remaining sand. */
export interface Glint {
  /** 0 is now, at the neck; 1 is the end of the expected lifespan. */
  share: number
  /** Stable per letter: sets its horizontal position and twinkle phase. */
  seed: number
}

/** A stable number in [0, 1) derived from a string, such as a letter's id. */
export function seedOf(value: string): number {
  // FNV-1a over the characters...
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash = Math.imul(hash ^ value.charCodeAt(i), 16777619)
  }
  // ...then MurmurHash3's finalizer, so ids that differ by one character
  // still land far apart.
  hash ^= hash >>> 16
  hash = Math.imul(hash, 0x85ebca6b)
  hash ^= hash >>> 13
  hash = Math.imul(hash, 0xc2b2ae35)
  hash ^= hash >>> 16
  return (hash >>> 0) / 2 ** 32
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

export function layerColor(layer: Layer, palette: Palette): string {
  switch (layer.kind) {
    // Each outcome keeps its own theme token, even though the current theme
    // paints all of them as the same white sand.
    case 'unrecorded':
      return palette.unrecorded
    case 'missed':
      return palette.missed
    case 'current':
    case 'released':
    case 'named':
      return palette.sand
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
  time = 0,
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
  drawGlints(ctx, scene, palette, time)
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

function drawGlints(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  palette: Palette,
  time: number,
) {
  const { glass, lived } = scene
  const size = Math.max(2, glass.halfHeight * 0.02)
  ctx.strokeStyle = palette.glint
  ctx.fillStyle = palette.glint
  ctx.lineWidth = Math.max(1, size * 0.2)

  for (const { share, seed } of scene.glints) {
    // Measured by area from the neck, like the sand itself.
    const y = topSurfaceY(glass, share * (1 - lived))
    const x = glass.cx + (seed * 2 - 1) * 0.6 * halfWidthAt(glass, y)
    // Keep the whole sparkle inside the sand.
    if (y > glass.neck - size * 2 || y < topSandAt(scene, x) + size * 2)
      continue

    const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(time / 700 + seed * 6))
    const reach = size * (0.6 + 0.4 * twinkle)
    ctx.globalAlpha = twinkle
    ctx.beginPath()
    ctx.moveTo(x - reach, y)
    ctx.lineTo(x + reach, y)
    ctx.moveTo(x, y - reach)
    ctx.lineTo(x, y + reach)
    ctx.stroke()
    ctx.fillRect(x - size * 0.2, y - size * 0.2, size * 0.4, size * 0.4)
  }
  ctx.globalAlpha = 1
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
