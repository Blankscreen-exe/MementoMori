import { useEffect, useRef, type RefObject } from 'react'

/** Steepest slope the sand surface can take. */
const MAX_TILT = 0.3
/** Device roll, in degrees, that produces the steepest slope. */
const FULL_TILT_DEGREES = 40

const clamp = (value: number) => Math.max(-1, Math.min(1, value))

/**
 * Tracks how far the sand should lean: from the device's roll on phones, or
 * from the pointer's position on desktops. Returns a ref so the render loop
 * can read it every frame without re-rendering React.
 */
export function useTiltTarget(): RefObject<number> {
  const target = useRef(0)

  useEffect(() => {
    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma === null) return
      target.current = clamp(event.gamma / FULL_TILT_DEGREES) * MAX_TILT
    }

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer.matches) return
      const offset = (event.clientX / window.innerWidth - 0.5) * 2
      target.current = clamp(offset) * MAX_TILT
    }
    const onPointerLeave = () => {
      if (finePointer.matches) target.current = 0
    }

    window.addEventListener('deviceorientation', onOrientation)
    window.addEventListener('pointermove', onPointerMove)
    document.documentElement.addEventListener('pointerleave', onPointerLeave)
    return () => {
      window.removeEventListener('deviceorientation', onOrientation)
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener(
        'pointerleave',
        onPointerLeave,
      )
    }
  }, [])

  return target
}

interface OrientationPermission {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

/**
 * iOS only delivers orientation events after the user grants permission, and
 * the request must come from a tap. Elsewhere this does nothing.
 */
export async function requestTiltPermission(): Promise<void> {
  if (typeof DeviceOrientationEvent === 'undefined') return
  // Called as a method: Safari throws if it's detached from its object.
  const orientation = DeviceOrientationEvent as unknown as OrientationPermission
  if (typeof orientation.requestPermission !== 'function') return
  try {
    await orientation.requestPermission()
  } catch {
    // Denied or dismissed: the sand simply stays level.
  }
}

export interface Orientation {
  beta: number
  gamma: number
}

/**
 * The device's latest orientation in degrees, or null until one arrives (on
 * desktops, or on iOS before permission is granted). A ref, so an animation
 * loop can read it every frame without re-rendering React.
 */
export function useDeviceOrientation(): RefObject<Orientation | null> {
  const orientation = useRef<Orientation | null>(null)

  useEffect(() => {
    const onOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta === null || event.gamma === null) return
      orientation.current = { beta: event.beta, gamma: event.gamma }
    }
    window.addEventListener('deviceorientation', onOrientation)
    return () => window.removeEventListener('deviceorientation', onOrientation)
  }, [])

  return orientation
}
