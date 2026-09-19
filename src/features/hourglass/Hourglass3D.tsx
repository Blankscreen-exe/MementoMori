import {
  useEffect,
  useMemo,
  useRef,
  type MouseEvent,
  type PointerEvent,
} from 'react'
import type { Letter } from '../../domain/letters'
import { lifeFraction, type Profile } from '../../domain/life'
import { describeHourglass, sealedSparks } from './describe'
import {
  deviceLean,
  dragLean,
  idleLean,
  stepMotion,
  UPRIGHT,
  type Lean,
  type Motion,
} from './motion'
import { readPalette } from './render'
import { createHourglassScene } from './scene3d'
import { useDeviceOrientation } from './tilt'

interface Props {
  profile: Profile
  letters: Letter[]
  now: Date
}

/** Longest frame step, so a stalled tab doesn't make the sand jump. */
const MAX_FRAME_SECONDS = 0.05
/** Pointer movement below this is a tap, which the page handles; above, a drag. */
const TAP_TOLERANCE_PX = 6
/** The pose shown when motion is reduced: upright, turned slightly. */
const STILL: Motion = { ...UPRIGHT, spin: 0.35 }

export function Hourglass3D({ profile, letters, now }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const orientation = useDeviceOrientation()

  const lived = lifeFraction(profile, now)
  const sparks = useMemo(
    () => sealedSparks(letters, profile, now),
    [letters, profile, now],
  )

  // The render loop reads the latest data from here instead of restarting.
  const data = useRef({ lived, sparks })
  const redraw = useRef<() => void>(() => {})
  useEffect(() => {
    data.current = { lived, sparks }
    redraw.current()
  }, [lived, sparks])

  // An in-progress drag, as the offset from where it started.
  const drag = useRef<{
    startX: number
    startY: number
    lean: Lean
    moved: boolean
  } | null>(null)
  const swallowClick = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const scene = createHourglassScene(canvas, readPalette())
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let motion = UPRIGHT
    let frame = 0
    let lastTime = 0

    const drawStill = () =>
      scene.render(
        { ...data.current, motion: STILL, streaming: false, time: 0 },
        0,
      )

    const tick = (time: number) => {
      const dt = lastTime
        ? Math.min((time - lastTime) / 1000, MAX_FRAME_SECONDS)
        : 0
      lastTime = time
      const seconds = time / 1000
      const device = orientation.current
      const target =
        drag.current?.lean ??
        (device ? deviceLean(device.beta, device.gamma) : idleLean(seconds))
      motion = stepMotion(motion, target, dt)
      scene.render(
        {
          ...data.current,
          motion,
          streaming: data.current.lived < 1,
          time: seconds,
        },
        dt,
      )
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
      const { width, height } = canvas.getBoundingClientRect()
      scene.resize(width, height, window.devicePixelRatio || 1)
      if (!isAnimating()) drawStill()
    }
    const onMotionPreference = () => {
      if (reducedMotion.matches) {
        stop()
        drawStill()
      } else {
        start()
      }
    }
    const onVisibility = () => (document.hidden ? stop() : start())
    redraw.current = () => {
      if (!isAnimating()) drawStill()
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    reducedMotion.addEventListener('change', onMotionPreference)
    document.addEventListener('visibilitychange', onVisibility)
    resize()
    start()

    return () => {
      stop()
      observer.disconnect()
      reducedMotion.removeEventListener('change', onMotionPreference)
      document.removeEventListener('visibilitychange', onVisibility)
      redraw.current = () => {}
      scene.dispose()
    }
  }, [orientation])

  function handlePointerDown(event: PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      startX: event.clientX,
      startY: event.clientY,
      lean: { x: 0, z: 0 },
      moved: false,
    }
  }

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const current = drag.current
    if (!current) return
    const dx = event.clientX - current.startX
    const dy = event.clientY - current.startY
    if (Math.hypot(dx, dy) > TAP_TOLERANCE_PX) current.moved = true
    current.lean = dragLean(dx, dy)
  }

  function handlePointerEnd() {
    // A drag isn't a tap: keep its click from revealing the time of day.
    swallowClick.current = drag.current?.moved ?? false
    drag.current = null
  }

  function handleClickCapture(event: MouseEvent) {
    if (!swallowClick.current) return
    swallowClick.current = false
    event.stopPropagation()
    event.preventDefault()
  }

  return (
    <div className="size-full" onClickCapture={handleClickCapture}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={describeHourglass(profile, now, sparks.length)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        className="block size-full touch-none"
      />
    </div>
  )
}
