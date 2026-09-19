import { addWeeks } from 'date-fns'
import { birthOf, type Profile } from './life'
import { weekStatus, type RitualContext } from './ritual'
import { weekKeyOf, weekStartOfKey } from './week'

export type LayerKind =
  'unrecorded' | 'named' | 'released' | 'missed' | 'current'

export interface Layer {
  kind: LayerKind
  /** Position within the lived pile: 0 is birth, 1 is now. */
  start: number
  end: number
}

/**
 * Builds the sediment in the bottom bulb, oldest layer first. Each layer's
 * thickness is proportional to the time it covers, and neighbouring weeks
 * with the same outcome are merged into a single layer.
 */
export function buildStrata(profile: Profile, context: RitualContext): Layer[] {
  const birth = birthOf(profile).getTime()
  const now = context.now.getTime()
  if (now <= birth) return []

  const toFraction = (time: number) => (time - birth) / (now - birth)
  const layers: Layer[] = []

  const push = (kind: LayerKind, from: number, to: number) => {
    if (to <= from) return
    const last = layers.at(-1)
    if (last && last.kind === kind) {
      last.end = toFraction(to)
      return
    }
    layers.push({ kind, start: toFraction(from), end: toFraction(to) })
  }

  const recordedStart = Math.max(
    birth,
    weekStartOfKey(context.firstWeek).getTime(),
  )
  push('unrecorded', birth, Math.min(recordedStart, now))

  let weekStart = recordedStart
  while (weekStart < now) {
    const key = weekKeyOf(new Date(weekStart))
    const weekEnd = addWeeks(weekStartOfKey(key), 1).getTime()
    const status = weekStatus(key, context)

    // Every week in this loop is recorded and has started, so neither case occurs.
    if (status !== 'unrecorded' && status !== 'future') {
      push(status, weekStart, Math.min(weekEnd, now))
    }
    weekStart = weekEnd
  }

  return layers
}
