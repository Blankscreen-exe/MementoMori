/** Width divided by height of the glass. */
export const GLASS_RATIO = 11 / 18

const AREA_SAMPLES = 400

export interface Glass {
  cx: number
  top: number
  bottom: number
  neck: number
  /** Distance from the neck to either end of the glass. */
  halfHeight: number
  maxHalfWidth: number
  neckHalfWidth: number
  /** Area of one bulb. Both bulbs are the same shape. */
  bulbArea: number
  /** Cumulative bulb area measured outward from the neck, one entry per sample. */
  areaFromNeck: Float64Array
}

/** Fits the largest glass of the right proportions into a box, centred. */
export function createGlass(boxWidth: number, boxHeight: number): Glass {
  const height = Math.min(boxHeight, boxWidth / GLASS_RATIO)
  const width = height * GLASS_RATIO
  // Leaves room for the outline and for sand tilting near the rim.
  const padding = height * 0.04
  const top = (boxHeight - height) / 2 + padding
  const bottom = top + height - padding * 2
  const neck = (top + bottom) / 2

  const shape = {
    cx: boxWidth / 2,
    top,
    bottom,
    neck,
    halfHeight: neck - top,
    maxHalfWidth: width / 2 - padding,
    neckHalfWidth: Math.max(1.5, width * 0.016),
  }

  const areaFromNeck = new Float64Array(AREA_SAMPLES + 1)
  const step = shape.halfHeight / AREA_SAMPLES
  for (let i = 1; i <= AREA_SAMPLES; i++) {
    const inner = 2 * profileHalfWidth(shape, (i - 1) * step)
    const outer = 2 * profileHalfWidth(shape, i * step)
    areaFromNeck[i] = areaFromNeck[i - 1] + ((inner + outer) / 2) * step
  }

  return { ...shape, bulbArea: areaFromNeck[AREA_SAMPLES], areaFromNeck }
}

type Shape = Pick<Glass, 'halfHeight' | 'maxHalfWidth' | 'neckHalfWidth'>

/** Half-width of the glass at a given distance from the neck. */
function profileHalfWidth(shape: Shape, distance: number): number {
  const u = Math.min(Math.abs(distance) / shape.halfHeight, 1)
  const widening = Math.pow(Math.sin((u * Math.PI) / 2), 0.8)
  return (
    shape.neckHalfWidth + (shape.maxHalfWidth - shape.neckHalfWidth) * widening
  )
}

export function halfWidthAt(glass: Glass, y: number): number {
  return profileHalfWidth(glass, y - glass.neck)
}

/** How far from the neck a bulb must be filled to hold `area`. */
function distanceForArea(glass: Glass, area: number): number {
  const table = glass.areaFromNeck
  const target = Math.min(Math.max(area, 0), glass.bulbArea)
  let low = 0
  let high = table.length - 1
  while (low < high) {
    const mid = (low + high) >> 1
    if (table[mid] < target) low = mid + 1
    else high = mid
  }
  if (low === 0) return 0
  const span = table[low] - table[low - 1]
  const within = span > 0 ? (target - table[low - 1]) / span : 0
  return ((low - 1 + within) / (table.length - 1)) * glass.halfHeight
}

/**
 * Surface height of the sand in the top bulb, where `filled` is the share of
 * the bulb's area holding sand. The sand rests on the neck.
 */
export function topSurfaceY(glass: Glass, filled: number): number {
  return glass.neck - distanceForArea(glass, filled * glass.bulbArea)
}

/**
 * Surface height of the pile in the bottom bulb, where `filled` is the share
 * of the bulb's area holding sand. The pile rests on the bottom of the glass.
 */
export function pileSurfaceY(glass: Glass, filled: number): number {
  return glass.neck + distanceForArea(glass, (1 - filled) * glass.bulbArea)
}

/** Points tracing the glass: down the right side, then up the left. */
export function glassOutline(glass: Glass, step = 2): Array<[number, number]> {
  const points: Array<[number, number]> = []
  for (let y = glass.top; y < glass.bottom; y += step) {
    points.push([glass.cx + halfWidthAt(glass, y), y])
  }
  points.push([glass.cx + halfWidthAt(glass, glass.bottom), glass.bottom])
  for (let y = glass.bottom; y > glass.top; y -= step) {
    points.push([glass.cx - halfWidthAt(glass, y), y])
  }
  points.push([glass.cx - halfWidthAt(glass, glass.top), glass.top])
  return points
}
