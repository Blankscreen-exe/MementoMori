import { useEffect, useMemo, useRef } from 'react'
import {
  isBorrowedTime,
  lifeFraction,
  weeksRemaining,
  type Profile,
} from '../../domain/life'
import type { WeekEntries } from '../../domain/ritual'
import { buildStrata } from '../../domain/strata'
import type { WeekKey } from '../../domain/week'
import { createGlass } from './geometry'
import {
  advanceStream,
  drawHourglass,
  readPalette,
  type Grain,
  type Scene,
} from './render'
import { useTiltTarget } from './tilt'

interface Props {
  profile: Profile
  firstWeek: WeekKey
  entries: WeekEntries
  now: Date
}

/** Longest frame step, so a stalled tab doesn't make grains jump. */
const MAX_FRAME_MS = 50

export function Hourglass({ profile, firstWeek, entries, now }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tiltTarget = useTiltTarget()

  const lived = lifeFraction(profile, now)
  const layers = useMemo(
    () => buildStrata(profile, { now, firstWeek, entries }),
    [profile, firstWeek, entries, now],
  )

  // The render loop reads the latest data from here instead of restarting.
  const data = useRef({ lived, layers })
  const redraw = useRef<() => void>(() => {})
  useEffect(() => {
    data.current = { lived, layers }
    redraw.current()
  }, [lived, layers])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const darkMode = window.matchMedia('(prefers-color-scheme: dark)')
    let palette = readPalette()
    let width = 0
    let height = 0
    let glass = createGlass(1, 1)
    let grains: Grain[] = []
    let tilt = 0
    let frame = 0
    let lastTime = 0
    let lastSecond = -1

    const scene = (): Scene => ({
      glass,
      lived: data.current.lived,
      layers: data.current.layers,
      tilt,
      grains,
    })
    const render = () => drawHourglass(ctx, scene(), palette, width, height)

    const tick = (time: number) => {
      const dt = lastTime ? Math.min(time - lastTime, MAX_FRAME_MS) : 16
      lastTime = time
      tilt += (tiltTarget.current - tilt) * Math.min(1, dt * 0.004)
      const next = advanceStream(scene(), dt, time, lastSecond)
      grains = next.grains
      lastSecond = next.second
      render()
      frame = requestAnimationFrame(tick)
    }

    const isAnimating = () => frame !== 0
    const start = () => {
      if (isAnimating() || reducedMotion.matches || document.hidden) return
      lastTime = 0
      frame = requestAnimationFrame(tick)
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 3)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      glass = createGlass(width, height)
      grains = []
      render()
    }

    // With reduced motion, the hourglass is a still image of the real levels.
    const onMotionPreference = () => {
      if (reducedMotion.matches) {
        stop()
        grains = []
        tilt = 0
        render()
      } else {
        start()
      }
    }
    const onColorScheme = () => {
      palette = readPalette()
      render()
    }
    const onVisibility = () => (document.hidden ? stop() : start())

    redraw.current = () => {
      if (!isAnimating()) render()
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    reducedMotion.addEventListener('change', onMotionPreference)
    darkMode.addEventListener('change', onColorScheme)
    document.addEventListener('visibilitychange', onVisibility)
    resize()
    start()

    return () => {
      stop()
      observer.disconnect()
      reducedMotion.removeEventListener('change', onMotionPreference)
      darkMode.removeEventListener('change', onColorScheme)
      document.removeEventListener('visibilitychange', onVisibility)
      redraw.current = () => {}
    }
  }, [tiltTarget])

  const description = isBorrowedTime(profile, now)
    ? 'An hourglass that has run out. Every week now is borrowed.'
    : `An hourglass. ${Math.round(lived * 100)}% of your expected life has passed, and about ${weeksRemaining(profile, now).toLocaleString('en')} weeks remain.`

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={description}
      className="block size-full"
    />
  )
}
