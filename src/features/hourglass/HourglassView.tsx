import { lazy, Suspense, useState } from 'react'
import type { Letter } from '../../domain/letters'
import type { Profile } from '../../domain/life'
import type { WeekEntries } from '../../domain/ritual'
import type { WeekKey } from '../../domain/week'
import { Hourglass } from './Hourglass'
import { supportsWebGL } from './webgl'

// three.js is only downloaded once the hourglass is actually shown.
const Hourglass3D = lazy(() =>
  import('./Hourglass3D').then((module) => ({ default: module.Hourglass3D })),
)

interface Props {
  profile: Profile
  firstWeek: WeekKey
  entries: WeekEntries
  letters: Letter[]
  now: Date
}

/** The 3D hourglass where the browser can draw it, the 2D one otherwise. */
export function HourglassView({
  profile,
  firstWeek,
  entries,
  letters,
  now,
}: Props) {
  const [canDraw3D] = useState(supportsWebGL)

  if (!canDraw3D) {
    return (
      <Hourglass
        profile={profile}
        firstWeek={firstWeek}
        entries={entries}
        letters={letters}
        now={now}
      />
    )
  }
  return (
    <Suspense fallback={<div className="size-full" />}>
      <Hourglass3D profile={profile} letters={letters} now={now} />
    </Suspense>
  )
}
