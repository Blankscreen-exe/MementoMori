import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { initialState, useAppStore } from './storage/store'

beforeEach(() => {
  useAppStore.setState(initialState)
})

describe('App', () => {
  it('starts with onboarding on the first visit', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: 'When were you born?' }),
    ).toBeInTheDocument()
  })

  it('goes straight to the home screen once onboarded', () => {
    useAppStore.setState({
      profile: { birthDate: '1994-05-12', expectedAge: 80 },
      firstWeek: '2026-09-20',
    })
    render(<App />)
    expect(screen.getByText('of your life')).toBeInTheDocument()
  })

  it('saves the answers and shows the home screen after onboarding', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByPlaceholderText('DD'), '12')
    await user.type(screen.getByPlaceholderText('MM'), '05')
    await user.type(screen.getByPlaceholderText('YYYY'), '1994')
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await user.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByText('of your life')).toBeInTheDocument()
    expect(useAppStore.getState().profile).toEqual({
      birthDate: '1994-05-12',
      expectedAge: 80,
    })
  })
})
