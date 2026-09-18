import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Letter } from '../../domain/letters'
import { LetterList } from './LetterList'

const older: Letter = {
  id: 'older',
  body: 'First letter',
  writtenAt: '2026-01-10T12:00:00.000Z',
  week: '2026-06-07',
  openedAt: '2026-06-02T08:00:00.000Z',
}
const newer: Letter = {
  id: 'newer',
  body: 'Dear me,\nYou made it.',
  writtenAt: '2026-03-15T12:00:00.000Z',
  week: '2026-09-20',
  openedAt: null,
}

function setup(letters: Letter[] = [older, newer]) {
  const onOpen = vi.fn()
  const onDelete = vi.fn()
  const user = userEvent.setup()
  render(<LetterList letters={letters} onOpen={onOpen} onDelete={onDelete} />)
  return { onOpen, onDelete, user }
}

describe('LetterList', () => {
  it('lists arrived letters, newest arrival first, marking unread ones', () => {
    setup()
    const items = screen.getAllByRole('button')
    expect(items[0]).toHaveTextContent('From 15 March 2026, unread')
    expect(items[0]).toHaveTextContent('Arrived the week of 14 September 2026')
    expect(items[1]).toHaveTextContent('From 10 January 2026')
    expect(items[1]).not.toHaveTextContent('unread')
  })

  it('says so when nothing has arrived', () => {
    setup([])
    expect(screen.getByText('Nothing has arrived yet.')).toBeInTheDocument()
  })

  it('opens a letter to read it, marking it read', async () => {
    const { onOpen, user } = setup()
    await user.click(screen.getByRole('button', { name: /15 March/ }))
    expect(onOpen).toHaveBeenCalledWith('newer')
    expect(screen.getByText(/You made it\./)).toBeInTheDocument()
    expect(screen.getByText('Written 15 March 2026')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('asks before deleting, and can keep the letter', async () => {
    const { onDelete, user } = setup()
    await user.click(screen.getByRole('button', { name: /15 March/ }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Delete this letter forever?',
    )
    await user.click(screen.getByRole('button', { name: 'Keep it' }))
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByText(/You made it\./)).toBeInTheDocument()
  })

  it('deletes a letter once confirmed', async () => {
    const { onDelete, user } = setup()
    await user.click(screen.getByRole('button', { name: /15 March/ }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Delete forever' }))
    expect(onDelete).toHaveBeenCalledWith('newer')
  })

  it('goes back to the list', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: /15 March/ }))
    await user.click(screen.getByRole('button', { name: 'All letters' }))
    expect(screen.getByRole('heading', { name: 'Letters' })).toBeInTheDocument()
  })
})
