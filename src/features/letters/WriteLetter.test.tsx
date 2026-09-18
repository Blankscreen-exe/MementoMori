import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WriteLetter } from './WriteLetter'

const FRIDAY = new Date(2026, 8, 18, 12)
const profile = { birthDate: '1994-05-12', expectedAge: 80 }

function setup(p = profile) {
  const onSeal = vi.fn()
  const user = userEvent.setup()
  render(<WriteLetter profile={p} now={FRIDAY} onSeal={onSeal} />)
  return { onSeal, user }
}

const letterBox = () => screen.getByRole('textbox', { name: 'Your letter' })
const sealButton = () => screen.getByRole('button', { name: 'Seal it' })

describe('WriteLetter', () => {
  it('offers presets with the dates they point to', () => {
    setup()
    expect(
      screen.getByRole('radio', { name: 'Next birthday 12 May 2027' }),
    ).toBeEnabled()
    expect(
      screen.getByRole('radio', { name: 'In ten years 18 September 2036' }),
    ).toBeEnabled()
  })

  it('disables presets beyond the expected lifespan', () => {
    setup({ birthDate: '1950-01-01', expectedAge: 80 })
    expect(
      screen.getByRole('radio', { name: 'In five years beyond your time' }),
    ).toBeDisabled()
    expect(
      screen.getByRole('radio', { name: 'In a year 18 September 2027' }),
    ).toBeEnabled()
  })

  it('needs words and a destination before it can be sealed', async () => {
    const { user } = setup()
    expect(sealButton()).toBeDisabled()
    await user.type(letterBox(), 'Dear me,')
    expect(sealButton()).toBeDisabled()
    await user.click(screen.getByRole('radio', { name: /In a year/ }))
    expect(sealButton()).toBeEnabled()
  })

  it('seals the letter to the chosen preset', async () => {
    const { onSeal, user } = setup()
    await user.type(letterBox(), 'Dear me,')
    await user.click(screen.getByRole('radio', { name: /Next birthday/ }))
    await user.click(sealButton())
    expect(onSeal).toHaveBeenCalledWith('Dear me,', new Date(2027, 4, 12))
  })

  it('seals the letter to an exact date', async () => {
    const { onSeal, user } = setup()
    await user.type(letterBox(), 'Happy anniversary')
    await user.click(screen.getByRole('radio', { name: 'On a date' }))
    await user.type(screen.getByPlaceholderText('DD'), '03')
    await user.type(screen.getByPlaceholderText('MM'), '06')
    await user.type(screen.getByPlaceholderText('YYYY'), '2030')
    await user.click(sealButton())
    expect(onSeal).toHaveBeenCalledWith(
      'Happy anniversary',
      new Date(2030, 5, 3),
    )
  })

  it.each([
    ['20', '09', '2026', 'Choose a week after this one.'],
    ['01', '01', '2090', 'That’s beyond the time you expect to have.'],
    ['31', '02', '2030', 'That date doesn’t exist.'],
  ])('explains why %s/%s/%s is refused', async (day, month, year, reason) => {
    const { user } = setup()
    await user.type(letterBox(), 'Dear me,')
    await user.click(screen.getByRole('radio', { name: 'On a date' }))
    await user.type(screen.getByPlaceholderText('DD'), day)
    await user.type(screen.getByPlaceholderText('MM'), month)
    await user.type(screen.getByPlaceholderText('YYYY'), year)
    expect(screen.getByRole('alert')).toHaveTextContent(reason)
    expect(sealButton()).toBeDisabled()
  })

  it('counts characters up to the limit', async () => {
    const { user } = setup()
    expect(letterBox()).toHaveAttribute('maxLength', '2000')
    await user.type(letterBox(), 'Dear me,')
    expect(screen.getByText('8 / 2,000')).toBeInTheDocument()
  })
})
