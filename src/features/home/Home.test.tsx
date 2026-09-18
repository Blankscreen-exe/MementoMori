import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Home } from './Home'

afterEach(() => {
  vi.useRealTimers()
})

describe('Home', () => {
  it('shows how far through life the user is, as a time of day', () => {
    vi.useFakeTimers({ now: new Date(2034, 4, 12), toFake: ['Date'] })
    render(<Home profile={{ birthDate: '1994-05-12', expectedAge: 80 }} />)
    expect(screen.getByText(/12:00 PM/)).toHaveTextContent(
      '12:00 PM of your life',
    )
  })

  it('switches to borrowed time past the expected age', () => {
    vi.useFakeTimers({ now: new Date(2030, 0, 1), toFake: ['Date'] })
    render(<Home profile={{ birthDate: '1950-01-01', expectedAge: 70 }} />)
    expect(screen.getByText('Every week now is borrowed.')).toBeInTheDocument()
  })
})
