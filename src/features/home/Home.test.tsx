import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Letter } from '../../domain/letters'
import { initialState, useAppStore } from '../../storage/store'
import { Home, REVEAL_MS, MESSAGE_MS, type SettledWeek } from './Home'

const profile = { birthDate: '1994-05-12', expectedAge: 80 }

beforeEach(() => {
  useAppStore.setState(initialState)
})

afterEach(() => {
  vi.useRealTimers()
})

function renderAt(now: Date, p = profile, settled?: SettledWeek) {
  vi.useFakeTimers({ now, toFake: ['Date', 'setTimeout', 'clearTimeout'] })
  render(
    <Home
      profile={p}
      firstWeek="2026-09-20"
      entries={{}}
      now={now}
      settled={settled}
    />,
  )
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

  describe('after the ritual', () => {
    const settled: SettledWeek = { name: 'moved to Lisbon' }

    it('shows the new name while it settles', () => {
      renderAt(new Date(2026, 8, 20, 21), profile, settled)
      const status = screen.getByRole('status')
      expect(status).toHaveTextContent('moved to Lisbon')
      expect(status).toHaveClass('opacity-100')
      expect(screen.getByText('Touch the glass.')).toHaveClass('opacity-0')

      act(() => vi.advanceTimersByTime(MESSAGE_MS))
      expect(status).toHaveClass('opacity-0')
      expect(screen.getByText('Touch the glass.')).toHaveClass('opacity-100')
    })

    it('gives way to the time of day on touch', () => {
      renderAt(new Date(2026, 8, 20, 21), profile, settled)
      fireEvent.click(glass())
      expect(screen.getByRole('status')).toHaveClass('opacity-0')
      expect(timeOfLife()).toHaveClass('opacity-100')
    })
  })

  describe('letters', () => {
    const FRIDAY = new Date(2026, 8, 18, 12)
    const sealed: Letter = {
      id: 'sealed',
      body: 'Not yet',
      writtenAt: '2026-01-01T12:00:00.000Z',
      week: '2027-05-16',
      openedAt: null,
    }
    const arrived: Letter = { ...sealed, id: 'arrived', week: '2026-09-13' }

    const lettersDot = () => screen.queryByRole('button', { name: /^Letters/ })

    it('keeps sealed letters out of sight, except for a glint', () => {
      useAppStore.setState({ letters: [sealed] })
      renderAt(FRIDAY)
      expect(lettersDot()).not.toBeInTheDocument()
      expect(glass()).toHaveAccessibleName(
        expect.stringContaining('Something glints in the sand.'),
      )
    })

    it('shows the dot once a letter arrives, announcing unread ones', () => {
      useAppStore.setState({ letters: [sealed, arrived] })
      renderAt(FRIDAY)
      expect(lettersDot()).toHaveAccessibleName('Letters, 1 unread')
    })

    it('keeps a quiet dot once everything has been read', () => {
      useAppStore.setState({
        letters: [{ ...arrived, openedAt: '2026-09-15T08:00:00.000Z' }],
      })
      renderAt(FRIDAY)
      expect(lettersDot()).toHaveAccessibleName('Letters')
    })

    it('keeps the dot after every arrived letter is deleted', () => {
      useAppStore.setState({ letters: [], hasReceivedLetter: true })
      renderAt(FRIDAY)
      expect(lettersDot()).toBeInTheDocument()
    })

    it('opens the arrived letters from the dot, and marks them read', () => {
      useAppStore.setState({ letters: [sealed, arrived] })
      renderAt(FRIDAY)
      fireEvent.click(lettersDot()!)
      const dialog = screen.getByRole('dialog', { name: 'Letters' })
      expect(dialog).toHaveTextContent('From 1 January 2026')
      expect(dialog).not.toHaveTextContent('Not yet')

      fireEvent.click(screen.getByRole('button', { name: /1 January 2026/ }))
      expect(screen.getByText('Not yet')).toBeInTheDocument()
      expect(
        useAppStore.getState().letters.find((l) => l.id === 'arrived')
          ?.openedAt,
      ).not.toBeNull()
    })

    it('writes and seals a letter from the menu', () => {
      useAppStore.setState({ profile })
      renderAt(FRIDAY)
      fireEvent.click(glass())
      fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
      fireEvent.click(screen.getByRole('button', { name: 'Write a letter' }))

      fireEvent.change(screen.getByRole('textbox', { name: 'Your letter' }), {
        target: { value: 'Dear me,' },
      })
      fireEvent.click(screen.getByRole('radio', { name: /In a year/ }))
      fireEvent.click(screen.getByRole('button', { name: 'Seal it' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveTextContent('Sealed.')
      expect(useAppStore.getState().letters).toMatchObject([
        { body: 'Dear me,', week: '2027-09-19' },
      ])
    })

    it('opens the counters from the menu', () => {
      renderAt(FRIDAY)
      fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
      fireEvent.click(screen.getByRole('button', { name: 'Counters' }))
      expect(
        screen.getByRole('dialog', { name: 'Counters' }),
      ).toHaveTextContent('Summers')
    })

    it('closes a sheet with the back gesture', async () => {
      // Real timers: the browser's history traversal is asynchronous.
      vi.useFakeTimers({ now: FRIDAY, toFake: ['Date'] })
      render(
        <Home
          profile={profile}
          firstWeek="2026-09-20"
          entries={{}}
          now={FRIDAY}
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Menu' }))
      expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument()

      window.history.back()

      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      )
    })
  })
})
