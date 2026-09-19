import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AUTO_DISMISS_MS, HINT_DELAY_MS, Reflection } from './Reflection'

afterEach(() => {
  vi.useRealTimers()
})

const TEXT = 'Who haven’t you called in a while?'

function setup() {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  const onDone = vi.fn()
  render(<Reflection text={TEXT} onDone={onDone} />)
  return { onDone }
}

describe('Reflection', () => {
  it('shows the message, focused so screen readers read it first', () => {
    setup()
    const overlay = screen.getByRole('button', { name: /called in a while/ })
    expect(overlay).toHaveFocus()
  })

  it('moves on with a tap anywhere', () => {
    const { onDone } = setup()
    fireEvent.click(screen.getByRole('button'))
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('moves on by itself after a while', () => {
    const { onDone } = setup()
    act(() => vi.advanceTimersByTime(AUTO_DISMISS_MS - 1))
    expect(onDone).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('does not move on twice if tapped and then timed out', () => {
    const { onDone } = setup()
    fireEvent.click(screen.getByRole('button'))
    act(() => vi.advanceTimersByTime(AUTO_DISMISS_MS))
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('offers a hint after a moment', async () => {
    setup()
    // Let the overlay fade in on its first animation frame.
    await act(() => new Promise((resolve) => requestAnimationFrame(resolve)))
    const hint = screen.getByText('Tap to continue')
    expect(hint).toHaveClass('opacity-0')
    act(() => vi.advanceTimersByTime(HINT_DELAY_MS))
    expect(hint).not.toHaveClass('opacity-0')
  })
})
