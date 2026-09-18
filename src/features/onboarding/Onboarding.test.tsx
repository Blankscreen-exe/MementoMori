import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Onboarding } from './Onboarding'

function setup() {
  const onComplete = vi.fn()
  const user = userEvent.setup()
  render(<Onboarding onComplete={onComplete} />)
  return { onComplete, user }
}

const field = (placeholder: string) => screen.getByPlaceholderText(placeholder)
const continueButton = () => screen.getByRole('button', { name: 'Continue' })

async function enterBirthday(
  user: ReturnType<typeof userEvent.setup>,
  day: string,
  month: string,
  year: string,
) {
  await user.type(field('DD'), day)
  await user.type(field('MM'), month)
  await user.type(field('YYYY'), year)
}

describe('Onboarding', () => {
  it('collects the birthday and expected age', async () => {
    const { onComplete, user } = setup()

    await enterBirthday(user, '12', '05', '1994')
    await user.click(continueButton())

    expect(
      screen.getByRole('heading', { name: 'How long do you expect to live?' }),
    ).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'One year more' }))
    await user.click(screen.getByRole('button', { name: 'One year more' }))
    await user.click(continueButton())

    expect(onComplete).toHaveBeenCalledWith({
      birthDate: '1994-05-12',
      expectedAge: 82,
    })
  })

  describe('birthday step', () => {
    it('moves to the next field once a field is full', async () => {
      const { user } = setup()
      await user.type(field('DD'), '12')
      expect(field('MM')).toHaveFocus()
      await user.type(field('MM'), '05')
      expect(field('YYYY')).toHaveFocus()
    })

    it('goes back a field on backspace in an empty field', async () => {
      const { user } = setup()
      await user.type(field('DD'), '12')
      await user.keyboard('{Backspace}')
      expect(field('DD')).toHaveFocus()
    })

    it('ignores anything that is not a digit', async () => {
      const { user } = setup()
      await user.type(field('DD'), 'a1')
      expect(field('DD')).toHaveValue('1')
    })

    it('keeps Continue disabled until the date is complete', async () => {
      const { user } = setup()
      expect(continueButton()).toBeDisabled()
      await enterBirthday(user, '1', '5', '199')
      expect(continueButton()).toBeDisabled()
      await user.type(field('YYYY'), '4')
      expect(continueButton()).toBeEnabled()
    })

    it.each([
      ['31', '02', '2001', 'That date doesn’t exist.'],
      ['01', '01', '2999', 'That date hasn’t happened yet.'],
      ['01', '01', '1850', 'Please check the year.'],
    ])('rejects %s/%s/%s', async (day, month, year, message) => {
      const { onComplete, user } = setup()
      await enterBirthday(user, day, month, year)
      await user.click(continueButton())
      expect(screen.getByRole('alert')).toHaveTextContent(message)
      expect(onComplete).not.toHaveBeenCalled()
    })
  })

  describe('lifespan step', () => {
    async function openLifespanStep() {
      const context = setup()
      await enterBirthday(context.user, '12', '05', '1994')
      await context.user.click(continueButton())
      return { ...context, spinbutton: screen.getByRole('spinbutton') }
    }

    it('starts at 80 years', async () => {
      const { spinbutton } = await openLifespanStep()
      expect(spinbutton).toHaveAttribute('aria-valuenow', '80')
    })

    it('responds to the keyboard', async () => {
      const { spinbutton, user } = await openLifespanStep()
      spinbutton.focus()
      await user.keyboard('{ArrowUp}{ArrowUp}{ArrowLeft}')
      expect(spinbutton).toHaveAttribute('aria-valuenow', '81')
      await user.keyboard('{PageDown}')
      expect(spinbutton).toHaveAttribute('aria-valuenow', '71')
      await user.keyboard('{End}')
      expect(spinbutton).toHaveAttribute('aria-valuenow', '120')
    })

    it('changes by one year per 10px of horizontal drag', async () => {
      const { spinbutton } = await openLifespanStep()
      fireEvent.pointerDown(spinbutton, { clientX: 100, pointerId: 1 })
      fireEvent.pointerMove(spinbutton, { clientX: 150, pointerId: 1 })
      fireEvent.pointerUp(spinbutton, { clientX: 150, pointerId: 1 })
      expect(spinbutton).toHaveAttribute('aria-valuenow', '85')
    })

    it('opens a text field on tap and accepts a typed age', async () => {
      const { onComplete, spinbutton, user } = await openLifespanStep()
      fireEvent.pointerDown(spinbutton, { clientX: 100, pointerId: 1 })
      fireEvent.pointerUp(spinbutton, { clientX: 102, pointerId: 1 })

      const input = screen.getByRole('textbox', {
        name: 'Expected age in years',
      })
      await user.clear(input)
      await user.type(input, '95{Enter}')
      await user.click(continueButton())

      expect(onComplete).toHaveBeenCalledWith({
        birthDate: '1994-05-12',
        expectedAge: 95,
      })
    })

    it('keeps the previous age when a typed age is out of range', async () => {
      const { spinbutton, user } = await openLifespanStep()
      fireEvent.pointerDown(spinbutton, { clientX: 100, pointerId: 1 })
      fireEvent.pointerUp(spinbutton, { clientX: 100, pointerId: 1 })

      const input = screen.getByRole('textbox', {
        name: 'Expected age in years',
      })
      await user.clear(input)
      await user.type(input, '500{Enter}')
      expect(screen.getByRole('spinbutton')).toHaveAttribute(
        'aria-valuenow',
        '80',
      )
    })

    it('disables the buttons at the limits', async () => {
      const { spinbutton, user } = await openLifespanStep()
      spinbutton.focus()
      await user.keyboard('{End}')
      expect(
        screen.getByRole('button', { name: 'One year more' }),
      ).toBeDisabled()
      await user.keyboard('{Home}')
      expect(
        screen.getByRole('button', { name: 'One year less' }),
      ).toBeDisabled()
    })

    it('remembers both answers when going back', async () => {
      const { user } = await openLifespanStep()
      await user.click(screen.getByRole('button', { name: 'One year more' }))
      await user.click(screen.getByRole('button', { name: 'Back' }))

      expect(field('DD')).toHaveValue('12')
      expect(field('YYYY')).toHaveValue('1994')

      await user.click(continueButton())
      expect(screen.getByRole('spinbutton')).toHaveAttribute(
        'aria-valuenow',
        '81',
      )
    })
  })
})
