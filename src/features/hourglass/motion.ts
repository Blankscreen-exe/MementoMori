/** How far the hourglass may lean in any direction: never close to upside down. */
export const MAX_TILT = (20 * Math.PI) / 180
/** The slow turn it always makes, in radians per second. */
export const IDLE_SPIN = 0.25
/** Radians of lean per pixel dragged. */
const DRAG_SENSITIVITY = 0.004
/** How quickly the lean catches up with its target, per second. */
const SPRING = 5
/** A phone held naturally is tilted back about this much. */
const RESTING_PITCH = 60

export interface Motion {
  /** Turn around the vertical axis, in radians. */
  spin: number
  /** Lean toward or away from the viewer. */
  tiltX: number
  /** Lean to the left or right. */
  tiltZ: number
}

export interface Lean {
  x: number
  z: number
}

export const UPRIGHT: Motion = { spin: 0, tiltX: 0, tiltZ: 0 }

/** Limits a lean to MAX_TILT in any direction, like a joystick's circular gate. */
export function clampLean({ x, z }: Lean): Lean {
  const size = Math.hypot(x, z)
  if (size <= MAX_TILT) return { x, z }
  const scale = MAX_TILT / size
  return { x: x * scale, z: z * scale }
}

/** Dragging leans it like a joystick: down tips it toward you, sideways leans it. */
export function dragLean(dx: number, dy: number): Lean {
  return clampLean({ x: dy * DRAG_SENSITIVITY, z: -dx * DRAG_SENSITIVITY })
}

/** A phone's orientation, in degrees, relative to how it's naturally held. */
export function deviceLean(beta: number, gamma: number): Lean {
  const toRadians = Math.PI / 180
  return clampLean({
    x: (beta - RESTING_PITCH) * toRadians * 0.6,
    z: -gamma * toRadians * 0.6,
  })
}

/** With nothing leaning on it, it sways gently as it turns. */
export function idleLean(seconds: number): Lean {
  return {
    x: Math.sin(seconds * 0.4) * 0.05,
    z: Math.sin(seconds * 0.3) * 0.04,
  }
}

/**
 * Advances the motion by `dt` seconds: it keeps turning, and its lean springs
 * toward `target`, so letting go of a drag eases it back upright.
 */
export function stepMotion(motion: Motion, target: Lean, dt: number): Motion {
  const ease = Math.min(1, dt * SPRING)
  const lean = clampLean(target)
  return {
    spin: motion.spin + IDLE_SPIN * dt,
    tiltX: motion.tiltX + (lean.x - motion.tiltX) * ease,
    tiltZ: motion.tiltZ + (lean.z - motion.tiltZ) * ease,
  }
}
