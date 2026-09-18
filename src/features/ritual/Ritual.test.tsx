import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Ritual } from './Ritual'

const SUNDAY = new Date(2026, 8, 20, 10)

function setup() {
  const onKeep = vi.fn()
  const onRelease = vi.fn()
  const user = userEvent.setup()
  render(<Ritual now={SUNDAY} onKeep={onKeep} onRelease={onRelease} />)
  return { onKeep, onRelease, user }
}

const nameInput = () => screen.getByRole('textbox', { name: 'Name this week' })
const keepButton = () => screen.getByRole('button', { name: 'Keep it' })

describe('Ritual', () => {
  it('asks about this week, dated', () => {
    setup()
    expect(screen.getByText('Sunday · 20 September')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'This week will not come again.' }),
    ).toBeInTheDocument()
    expect(nameInput()).toHaveAttribute('placeholder', 'a few words')
  })

  it('offers the ten strata colors as a radio group, none preselected', () => {
    setup()
    const colors = screen.getAllByRole('radio')
    expect(colors).toHaveLength(10)
    expect(colors.every((radio) => !(radio as HTMLInputElement).checked)).toBe(
      true,
    )
    expect(screen.getByRole('radio', { name: 'Ember' })).toBeInTheDocument()
  })

  it('needs both a name and a color before it can be kept', async () => {
    const { user } = setup()
    expect(keepButton()).toBeDisabled()

    await user.type(nameInput(), 'moved')
    expect(keepButton()).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: 'Tide' }))
    expect(keepButton()).toBeEnabled()

    await user.clear(nameInput())
    await user.type(nameInput(), '   ')
    expect(keepButton()).toBeDisabled()
  })

  it('keeps a tidied name with its color', async () => {
    const { onKeep, user } = setup()
    await user.type(nameInput(), '  moved   to Lisbon ')
    await user.click(screen.getByRole('radio', { name: 'Tide' }))
    await user.click(keepButton())
    expect(onKeep).toHaveBeenCalledWith('moved to Lisbon', 'tide')
  })

  it('keeps the week with the Enter key', async () => {
    const { onKeep, user } = setup()
    await user.click(screen.getByRole('radio', { name: 'Moss' }))
    await user.type(nameInput(), 'quiet{Enter}')
    expect(onKeep).toHaveBeenCalledWith('quiet', 'moss')
  })

  it('limits names to 40 characters', () => {
    setup()
    expect(nameInput()).toHaveAttribute('maxLength', '40')
  })

  it('lets the week go without asking twice', async () => {
    const { onKeep, onRelease, user } = setup()
    await user.click(screen.getByRole('button', { name: 'Let it go' }))
    expect(onRelease).toHaveBeenCalledOnce()
    expect(onKeep).not.toHaveBeenCalled()
  })
})
