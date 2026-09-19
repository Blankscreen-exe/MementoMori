import { Vector3 } from 'three'
import { widening } from './geometry'

/**
 * The 3D glass, in scene units: 2 tall with the neck at y = 0. Its sides
 * follow the same curve as the 2D glass, spun into a faceted solid.
 */
export const GLASS = {
  halfHeight: 1,
  maxRadius: 0.55,
  neckRadius: 0.035,
  facets: 12,
  /** Horizontal rings of the faceted glass, from end to end. */
  rings: 10,
} as const

/** The sand sits just inside the glass, so the glass's outline stays in front. */
export const SAND_INSET = 0.97

export function radiusAt(y: number): number {
  return (
    GLASS.neckRadius +
    (GLASS.maxRadius - GLASS.neckRadius) * widening(y / GLASS.halfHeight)
  )
}

// Every horizontal slice of the glass is the same polygon, scaled by r, so a
// bulb's volume is proportional to the integral of r² along its height.
const SAMPLES = 600
const volumeFromNeck = new Float64Array(SAMPLES + 1)
for (let i = 1; i <= SAMPLES; i++) {
  const inner = radiusAt(((i - 1) / SAMPLES) * GLASS.halfHeight) ** 2
  const outer = radiusAt((i / SAMPLES) * GLASS.halfHeight) ** 2
  volumeFromNeck[i] =
    volumeFromNeck[i - 1] + ((inner + outer) / 2) * (GLASS.halfHeight / SAMPLES)
}
const BULB_VOLUME = volumeFromNeck[SAMPLES]

/** How far from the neck a bulb must be filled to hold `share` of its volume. */
function distanceForShare(share: number): number {
  const target = Math.min(Math.max(share, 0), 1) * BULB_VOLUME
  let low = 0
  let high = SAMPLES
  while (low < high) {
    const mid = (low + high) >> 1
    if (volumeFromNeck[mid] < target) low = mid + 1
    else high = mid
  }
  if (low === 0) return 0
  const span = volumeFromNeck[low] - volumeFromNeck[low - 1]
  const within = span > 0 ? (target - volumeFromNeck[low - 1]) / span : 0
  return ((low - 1 + within) / SAMPLES) * GLASS.halfHeight
}

/** Height of the sand in the top bulb holding `share` of the bulb's volume. */
export function topSandLevel(share: number): number {
  return distanceForShare(share)
}

/** Height of the pile in the bottom bulb holding `share` of the bulb's volume. */
export function pileSandLevel(share: number): number {
  return -distanceForShare(1 - share)
}

/** Points up the glass's side, as [radius, height] pairs for a lathe. */
export function profilePoints(
  from: number,
  to: number,
  steps: number,
  inset = 1,
): Array<[number, number]> {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const y = from + ((to - from) * i) / steps
    return [radiusAt(y) * inset, y]
  })
}

/** Turns every lathe so a facet, not a seam, faces forward. */
export const FACET_PHASE = Math.PI / GLASS.facets

export interface Facet {
  normal: Vector3
  center: Vector3
}

export interface FacetEdge {
  a: Vector3
  b: Vector3
  /** The two facets that meet at this edge. */
  faces: [number, number]
}

export interface FacetedGlass {
  facets: Facet[]
  edges: FacetEdge[]
}

/**
 * The glass as flat facets and the edges between them, laid out exactly like
 * three.js's LatheGeometry so the outline lines up with the sand.
 */
export function facetedGlass(): FacetedGlass {
  const rings = profilePoints(-GLASS.halfHeight, GLASS.halfHeight, GLASS.rings)
  const count = GLASS.facets
  const vertex = (i: number, j: number) => {
    const phi = FACET_PHASE + ((i % count) / count) * Math.PI * 2
    const [r, y] = rings[j]
    return new Vector3(r * Math.sin(phi), y, r * Math.cos(phi))
  }
  const face = (i: number, j: number) => j * count + ((i + count) % count)

  const facets: Facet[] = []
  for (let j = 0; j < rings.length - 1; j++) {
    for (let i = 0; i < count; i++) {
      const a = vertex(i, j)
      const b = vertex(i + 1, j)
      const c = vertex(i, j + 1)
      const d = vertex(i + 1, j + 1)
      const center = a.clone().add(b).add(c).add(d).multiplyScalar(0.25)
      const normal = new Vector3()
        .subVectors(b, a)
        .cross(new Vector3().subVectors(c, a))
        .normalize()
      // Point every normal outward, away from the glass's axis.
      if (normal.x * center.x + normal.z * center.z < 0) normal.negate()
      facets.push({ normal, center })
    }
  }

  const edges: FacetEdge[] = []
  for (let j = 0; j < rings.length - 1; j++) {
    for (let i = 0; i < count; i++) {
      // Seams running up the glass, between neighbouring facets.
      edges.push({
        a: vertex(i, j),
        b: vertex(i, j + 1),
        faces: [face(i - 1, j), face(i, j)],
      })
      // Rings around the glass, between the facets above and below.
      if (j > 0) {
        edges.push({
          a: vertex(i, j),
          b: vertex(i + 1, j),
          faces: [face(i, j - 1), face(i, j)],
        })
      }
    }
  }
  return { facets, edges }
}

const toCamera = new Vector3()

/**
 * The edges on the glass's outline as seen from `camera` (in the glass's own
 * coordinates): those where one facet faces the camera and the other doesn't.
 */
export function outlineEdges(
  glass: FacetedGlass,
  camera: Vector3,
): FacetEdge[] {
  const facing = glass.facets.map(
    ({ normal, center }) => normal.dot(toCamera.subVectors(camera, center)) > 0,
  )
  return glass.edges.filter(
    ({ faces: [first, second] }) => facing[first] !== facing[second],
  )
}

const smoothstep = (from: number, to: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - from) / (to - from)))
  return t * t * (3 - 2 * t)
}

/**
 * Width of the glass's outline at height `y`, like an ink drawing of glass:
 * heaviest at the neck and the rims and on the side away from the light
 * (`viewX` below 0, left of centre on screen), lightest on the lit flank.
 */
export function strokeWidth(y: number, viewX: number, weight: number): number {
  const neck = Math.exp(-((y / 0.28) ** 2))
  const rim = Math.exp(-(((Math.abs(y) - GLASS.halfHeight) / 0.2) ** 2))
  const shadow = 1 - smoothstep(-0.15, 0.15, viewX)
  return weight * (0.25 + 1.8 * neck + 1.1 * rim) * (0.3 + 1.2 * shadow)
}

/**
 * Where a sealed letter sparks: on the outside of the top sand, at the height
 * where its share of the remaining time lies (0 at the neck, 1 at the top),
 * turned around the glass by its seed.
 */
export function sparkPosition(
  share: number,
  remaining: number,
  seed: number,
): Vector3 {
  const y = topSandLevel(share * remaining)
  const r = radiusAt(y) * (SAND_INSET + 0.01)
  const angle = seed * Math.PI * 2
  return new Vector3(r * Math.sin(angle), y, r * Math.cos(angle))
}
