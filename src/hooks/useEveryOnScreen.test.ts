import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEveryOnScreen } from './useEveryOnScreen'

const MINUTE = 60_000

let hidden = false

beforeEach(() => {
  hidden = false
  Object.defineProperty(document, 'hidden', {
    configurable: true,
    get: () => hidden,
  })
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
})

afterEach(() => {
  // Drop the override so the prototype's own getter applies again.
  delete (document as { hidden?: boolean }).hidden
  vi.useRealTimers()
})

function setHidden(value: boolean) {
  hidden = value
  act(() => document.dispatchEvent(new Event('visibilitychange')))
}

const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms))

describe('useEveryOnScreen', () => {
  it('fires once the interval has passed on screen', () => {
    const onElapsed = vi.fn()
    renderHook(() => useEveryOnScreen(60 * MINUTE, onElapsed))

    wait(60 * MINUTE - 1)
    expect(onElapsed).not.toHaveBeenCalled()
    wait(1)
    expect(onElapsed).toHaveBeenCalledOnce()
  })

  it('fires again after every further interval', () => {
    const onElapsed = vi.fn()
    renderHook(() => useEveryOnScreen(60 * MINUTE, onElapsed))

    wait(3 * 60 * MINUTE)
    expect(onElapsed).toHaveBeenCalledTimes(3)
  })

  it('does not count time spent hidden', () => {
    const onElapsed = vi.fn()
    renderHook(() => useEveryOnScreen(60 * MINUTE, onElapsed))

    wait(40 * MINUTE)
    setHidden(true)
    wait(5 * 60 * MINUTE)
    expect(onElapsed).not.toHaveBeenCalled()

    setHidden(false)
    wait(20 * MINUTE - 1)
    expect(onElapsed).not.toHaveBeenCalled()
    wait(1)
    expect(onElapsed).toHaveBeenCalledOnce()
  })

  it('waits until the page is shown if it starts hidden', () => {
    hidden = true
    const onElapsed = vi.fn()
    renderHook(() => useEveryOnScreen(60 * MINUTE, onElapsed))

    wait(2 * 60 * MINUTE)
    setHidden(false)
    wait(60 * MINUTE)
    expect(onElapsed).toHaveBeenCalledOnce()
  })

  it('does nothing while disabled', () => {
    const onElapsed = vi.fn()
    renderHook(() => useEveryOnScreen(60 * MINUTE, onElapsed, false))

    wait(2 * 60 * MINUTE)
    expect(onElapsed).not.toHaveBeenCalled()
  })

  it('stops when unmounted', () => {
    const onElapsed = vi.fn()
    const { unmount } = renderHook(() =>
      useEveryOnScreen(60 * MINUTE, onElapsed),
    )

    unmount()
    wait(2 * 60 * MINUTE)
    expect(onElapsed).not.toHaveBeenCalled()
  })
})
