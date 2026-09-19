import { describe, expect, it } from 'vitest'
import {
  clampLean,
  deviceLean,
  dragLean,
  IDLE_SPIN,
  idleLean,
  MAX_TILT,
  stepMotion,
  UPRIGHT,
} from './motion'

const size = ({ x, z }: { x: number; z: number }) => Math.hypot(x, z)

describe('clampLean', () => {
  it('leaves small leans alone', () => {
    expect(clampLean({ x: 0.1, z: -0.1 })).toEqual({ x: 0.1, z: -0.1 })
  })

  it('never leans more than 20° in any direction', () => {
    expect(size(clampLean({ x: 5, z: 0 }))).toBeCloseTo(MAX_TILT)
    expect(size(clampLean({ x: 3, z: -3 }))).toBeCloseTo(MAX_TILT)
    expect(MAX_TILT).toBeCloseTo((20 * Math.PI) / 180)
  })
})

describe('dragLean', () => {
  it('tips toward the viewer when dragged down, and leans sideways', () => {
    expect(dragLean(0, 50).x).toBeGreaterThan(0)
    expect(dragLean(50, 0).z).toBeLessThan(0)
    expect(dragLean(-50, 0).z).toBeGreaterThan(0)
  })

  it('stops at the limit however far it is dragged', () => {
    expect(size(dragLean(2000, 2000))).toBeCloseTo(MAX_TILT)
  })
})

describe('deviceLean', () => {
  it('is upright when the phone is held naturally', () => {
    const lean = deviceLean(60, 0)
    expect(lean.x).toBeCloseTo(0)
    expect(lean.z).toBeCloseTo(0)
  })

  it('stays within the limit even when the phone is flipped', () => {
    expect(size(deviceLean(180, 90))).toBeLessThanOrEqual(MAX_TILT + 1e-9)
  })
})

describe('idleLean', () => {
  it('only sways a little', () => {
    for (let t = 0; t < 60; t += 0.7)
      expect(size(idleLean(t))).toBeLessThan(0.07)
  })
})

describe('stepMotion', () => {
  it('keeps turning slowly, whatever else happens', () => {
    const next = stepMotion(UPRIGHT, { x: 0.2, z: 0 }, 1)
    expect(next.spin).toBeCloseTo(IDLE_SPIN)
  })

  it('springs toward its target lean', () => {
    let motion = UPRIGHT
    for (let i = 0; i < 120; i++)
      motion = stepMotion(motion, { x: 0.2, z: -0.1 }, 1 / 60)
    expect(motion.tiltX).toBeCloseTo(0.2, 2)
    expect(motion.tiltZ).toBeCloseTo(-0.1, 2)
  })

  it('eases back upright once the target returns to rest', () => {
    let motion = { spin: 0, tiltX: MAX_TILT, tiltZ: 0 }
    for (let i = 0; i < 120; i++)
      motion = stepMotion(motion, { x: 0, z: 0 }, 1 / 60)
    expect(Math.abs(motion.tiltX)).toBeLessThan(0.01)
  })

  it('cannot be pushed past the limit', () => {
    let motion = UPRIGHT
    for (let i = 0; i < 300; i++)
      motion = stepMotion(motion, { x: 9, z: 9 }, 1 / 60)
    expect(Math.hypot(motion.tiltX, motion.tiltZ)).toBeLessThanOrEqual(
      MAX_TILT + 1e-6,
    )
  })
})
