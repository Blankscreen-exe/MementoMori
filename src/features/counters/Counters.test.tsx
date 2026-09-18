import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { initialState, useAppStore } from '../../storage/store'
import { Counters } from './Counters'

const profile = { birthDate: '1994-05-12', expectedAge: 80 }
const FRIDAY = new Date(2026, 8, 18, 12)

function Harness() {
  const state = useAppStore()
  return (
    <Counters
      profile={profile}
      now={FRIDAY}
      counters={state.counters}
      hiddenCounters={state.hiddenCounters}
      onAdd={(input) => state.addCounter(input, FRIDAY)}
      onUpdate={(id, input) => state.updateCounter(id, input, FRIDAY)}
      onDelete={state.deleteCounter}
      onSetHidden={state.setCounterHidden}
    />
  )
}

beforeEach(() => {
  useAppStore.setState(initialState)
})

function setup() {
  const user = userEvent.setup()
  render(<Harness />)
  return { user }
}

const row = (label: string) =>
  screen.getByText(label, { selector: 'span' }).closest('li')!

async function addCounter(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  await user.click(screen.getByRole('button', { name: 'Count something else' }))
  await user.type(screen.getByPlaceholderText('Visits to my parents'), name)
}

describe('Counters', () => {
  it('shows the built-in counters with what remains', () => {
    setup()
    expect(row('Summers')).toHaveTextContent('47')
    expect(row('Sundays')).toHaveTextContent('2,486')
    expect(row('Birthdays')).toHaveTextContent('47')
    expect(row('Full moons')).toBeInTheDocument()
  })

  it('draws dots only for counts of 200 or fewer', () => {
    setup()
    expect(row('Summers').querySelectorAll('.rounded-full')).toHaveLength(47)
    expect(row('Sundays').querySelectorAll('.rounded-full')).toHaveLength(0)
  })

  it('hides a built-in counter and shows it again', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Hide Full moons' }))
    expect(screen.queryByText('Full moons', { selector: 'span' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Show Full moons' }))
    expect(row('Full moons')).toBeInTheDocument()
  })

  it('adds a counter that ends when someone reaches an age', async () => {
    const { user } = setup()
    await addCounter(user, 'Visits to my parents')
    await user.clear(screen.getByRole('textbox', { name: 'Times' }))
    await user.type(screen.getByRole('textbox', { name: 'Times' }), '2')
    await user.click(screen.getByRole('radio', { name: 'a year' }))
    await user.click(
      screen.getByRole('radio', { name: 'Someone reaches an age' }),
    )
    await user.type(screen.getByRole('textbox', { name: 'Their age' }), '90')
    await user.type(
      screen.getByRole('textbox', { name: 'Their birth year' }),
      '1962',
    )
    await user.click(screen.getByRole('button', { name: 'Save' }))

    const visits = row('Visits to my parents')
    expect(visits).toHaveTextContent('51')
    expect(visits).toHaveTextContent('2 times a year · until they turn 90')
    expect(visits.querySelectorAll('.rounded-full')).toHaveLength(51)
  })

  it('explains what is wrong instead of saving', async () => {
    const { user } = setup()
    await user.click(
      screen.getByRole('button', { name: 'Count something else' }),
    )
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Give it a name.')

    await user.type(
      screen.getByPlaceholderText('Visits to my parents'),
      'Trips',
    )
    await user.click(screen.getByRole('radio', { name: 'A date' }))
    await user.type(screen.getByPlaceholderText('DD'), '01')
    await user.type(screen.getByPlaceholderText('MM'), '01')
    await user.type(screen.getByPlaceholderText('YYYY'), '2020')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'That has already passed.',
    )
    expect(useAppStore.getState().counters).toEqual([])
  })

  it('edits and deletes a custom counter', async () => {
    const { user } = setup()
    await addCounter(user, 'Calls home')
    await user.click(screen.getByRole('radio', { name: 'a week' }))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(row('Calls home')).toHaveTextContent('2,486')

    await user.click(screen.getByRole('button', { name: 'Edit Calls home' }))
    const times = screen.getByRole('textbox', { name: 'Times' })
    await user.clear(times)
    await user.type(times, '2')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(within(row('Calls home')).getByText('4,972')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit Calls home' }))
    await user.click(screen.getByRole('button', { name: 'Delete' }))
    expect(screen.queryByText('Calls home')).toBeNull()
  })

  it('leaves the list unchanged on cancel', async () => {
    const { user } = setup()
    await addCounter(user, 'Never saved')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('Never saved')).toBeNull()
    expect(
      screen.getByRole('heading', { name: 'What’s left' }),
    ).toBeInTheDocument()
  })
})
