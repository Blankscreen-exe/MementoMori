import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { initialState, useAppStore } from './storage/store'

const FRIDAY = new Date(2026, 8, 18, 12)
const SUNDAY = new Date(2026, 8, 20, 12)
const profile = { birthDate: '1994-05-12', expectedAge: 80 }

beforeEach(() => {
  useAppStore.setState(initialState)
})

afterEach(() => {
  vi.useRealTimers()
})

// Only Date is faked, so the UI's timers and animation frames still run.
const setToday = (now: Date) => vi.useFakeTimers({ now, toFake: ['Date'] })

function onboarded() {
  useAppStore.setState({ profile, firstWeek: '2026-09-20' })
}

const ritualHeading = () =>
  screen.queryByRole('heading', { name: 'This week will not come again.' })

async function completeOnboarding(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('DD'), '12')
  await user.type(screen.getByPlaceholderText('MM'), '05')
  await user.type(screen.getByPlaceholderText('YYYY'), '1994')
  await user.click(screen.getByRole('button', { name: 'Continue' }))
  await user.click(screen.getByRole('button', { name: 'Continue' }))
}

describe('App', () => {
  it('starts with onboarding on the first visit', () => {
    setToday(FRIDAY)
    render(<App />)
    expect(
      screen.getByRole('heading', { name: 'When were you born?' }),
    ).toBeInTheDocument()
  })

  it('goes straight to the hourglass on a weekday once onboarded', () => {
    setToday(FRIDAY)
    onboarded()
    render(<App />)
    expect(
      screen.getByRole('button', { name: /hourglass/i }),
    ).toBeInTheDocument()
    expect(ritualHeading()).not.toBeInTheDocument()
  })

  it('saves the answers and shows the hourglass after onboarding', async () => {
    setToday(FRIDAY)
    const user = userEvent.setup()
    render(<App />)
    await completeOnboarding(user)

    expect(
      screen.getByRole('button', { name: /hourglass/i }),
    ).toBeInTheDocument()
    expect(useAppStore.getState().profile).toEqual(profile)
  })

  describe('on Sunday', () => {
    it('opens the ritual instead of the hourglass', () => {
      setToday(SUNDAY)
      onboarded()
      render(<App />)
      expect(ritualHeading()).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /hourglass/i }),
      ).not.toBeInTheDocument()
    })

    it('opens the ritual right after onboarding on a first Sunday', async () => {
      setToday(SUNDAY)
      const user = userEvent.setup()
      render(<App />)
      await completeOnboarding(user)
      expect(ritualHeading()).toBeInTheDocument()
    })

    it('records a named week and shows it settling into the hourglass', async () => {
      setToday(SUNDAY)
      onboarded()
      const user = userEvent.setup()
      render(<App />)

      await user.type(
        screen.getByRole('textbox', { name: 'Name this week' }),
        'moved to Lisbon',
      )
      await user.click(screen.getByRole('button', { name: 'Keep it' }))

      expect(useAppStore.getState().entries).toEqual({
        '2026-09-20': {
          outcome: 'named',
          name: 'moved to Lisbon',
        },
      })
      expect(screen.getByRole('status')).toHaveTextContent('moved to Lisbon')
      expect(ritualHeading()).not.toBeInTheDocument()
    })

    it('records a released week and returns to the hourglass', async () => {
      setToday(SUNDAY)
      onboarded()
      const user = userEvent.setup()
      render(<App />)

      await user.click(screen.getByRole('button', { name: 'Let it go' }))

      expect(useAppStore.getState().entries).toEqual({
        '2026-09-20': { outcome: 'released' },
      })
      expect(
        screen.getByRole('button', { name: /hourglass/i }),
      ).toBeInTheDocument()
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('does not ask again once the week is answered', () => {
      setToday(SUNDAY)
      onboarded()
      useAppStore.setState({
        entries: { '2026-09-20': { outcome: 'released' } },
      })
      render(<App />)
      expect(ritualHeading()).not.toBeInTheDocument()
    })

    it('refuses an answer given after midnight and moves on to Monday', async () => {
      setToday(new Date(2026, 8, 20, 23, 59, 50))
      onboarded()
      const user = userEvent.setup()
      render(<App />)

      await user.type(
        screen.getByRole('textbox', { name: 'Name this week' }),
        'too late',
      )
      act(() => vi.setSystemTime(new Date(2026, 8, 21, 0, 0, 10)))
      await user.click(screen.getByRole('button', { name: 'Keep it' }))

      expect(useAppStore.getState().entries).toEqual({})
      expect(ritualHeading()).not.toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /hourglass/i }),
      ).toBeInTheDocument()
    })
  })
})
