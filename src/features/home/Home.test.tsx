import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { initialState, useAppStore } from '../../storage/store'
import { Home, REVEAL_MS } from './Home'

const profile = { birthDate: '1994-05-12', expectedAge: 80 }

beforeEach(() => {
  useAppStore.setState(initialState)
})

afterEach(() => {
  vi.useRealTimers()
})

function renderAt(now: Date, p = profile) {
  vi.useFakeTimers({ now, toFake: ['Date', 'setTimeout', 'clearTimeout'] })
  render(<Home profile={p} firstWeek="2026-09-20" />)
}

const glass = () => screen.getByRole('button', { name: /hourglass/i })
const timeOfLife = () => screen.getByText(/of your life/).parentElement!

describe('Home', () => {
  it('describes the hourglass for screen readers', () => {
    renderAt(new Date(2034, 4, 12))
    expect(glass()).toHaveAccessibleName(
      'An hourglass. 50% of your expected life has passed, and about 2,087 weeks remain.',
    )
  })

  it('invites the first touch, then retires the hint for good', () => {
    renderAt(new Date(2026, 8, 18))
    expect(screen.getByText('Touch the glass.')).toHaveClass('opacity-100')

    fireEvent.click(glass())

    expect(screen.getByText('Touch the glass.')).toHaveClass('opacity-0')
    expect(useAppStore.getState().hasTouchedGlass).toBe(true)
  })

  it('reveals life as a time of day on touch, then fades it away', () => {
    renderAt(new Date(2034, 4, 12))
    expect(timeOfLife()).toHaveTextContent('12:00 PM of your life')
    expect(timeOfLife()).toHaveClass('opacity-0')

    fireEvent.click(glass())
    expect(timeOfLife()).toHaveClass('opacity-100')

    act(() => vi.advanceTimersByTime(REVEAL_MS))
    expect(timeOfLife()).toHaveClass('opacity-0')
  })

  it('restarts the fade-out timer on every touch', () => {
    renderAt(new Date(2034, 4, 12))
    fireEvent.click(glass())
    act(() => vi.advanceTimersByTime(REVEAL_MS - 500))
    fireEvent.click(glass())
    act(() => vi.advanceTimersByTime(REVEAL_MS - 500))
    expect(timeOfLife()).toHaveClass('opacity-100')
  })

  it('switches to borrowed time past the expected age', () => {
    renderAt(new Date(2030, 0, 1), { birthDate: '1950-01-01', expectedAge: 70 })
    expect(screen.getByText('Every week now is borrowed.')).toBeInTheDocument()
    expect(glass()).toHaveAccessibleName(
      'An hourglass that has run out. Every week now is borrowed.',
    )
  })
})
