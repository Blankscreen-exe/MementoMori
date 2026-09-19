import { beforeEach, describe, expect, it } from 'vitest'
import {
  initialState,
  STORAGE_KEY,
  STORAGE_VERSION,
  useAppStore,
} from './store'

beforeEach(() => {
  useAppStore.setState(initialState)
})

describe('completeOnboarding', () => {
  it('saves the profile and the week the app was first used in', () => {
    useAppStore
      .getState()
      .completeOnboarding(
        { birthDate: '1994-05-12', expectedAge: 80 },
        new Date(2026, 8, 17),
      )

    expect(useAppStore.getState()).toMatchObject({
      profile: { birthDate: '1994-05-12', expectedAge: 80 },
      firstWeek: '2026-09-20',
    })
  })

  it('persists data, not actions, under a versioned key', () => {
    useAppStore
      .getState()
      .completeOnboarding(
        { birthDate: '1994-05-12', expectedAge: 80 },
        new Date(2026, 8, 17),
      )

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    expect(stored).toEqual({
      version: STORAGE_VERSION,
      state: {
        profile: { birthDate: '1994-05-12', expectedAge: 80 },
        firstWeek: '2026-09-20',
        hasTouchedGlass: false,
        entries: {},
        letters: [],
        hasReceivedLetter: false,
        counters: [],
        hiddenCounters: [],
        reflections: null,
      },
    })
  })
})

describe('touchGlass', () => {
  it('remembers the first touch', () => {
    useAppStore.getState().touchGlass()
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    expect(stored.state.hasTouchedGlass).toBe(true)
  })
})

describe('rehydration', () => {
  it('loads data saved before newer fields existed', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        state: {
          profile: { birthDate: '1994-05-12', expectedAge: 80 },
          firstWeek: '2026-09-20',
        },
      }),
    )

    await useAppStore.persist.rehydrate()

    expect(useAppStore.getState()).toMatchObject({
      profile: { birthDate: '1994-05-12', expectedAge: 80 },
      hasTouchedGlass: false,
    })
  })
})

describe('recordWeek', () => {
  const SUNDAY = new Date(2026, 8, 20, 21)
  const named = { outcome: 'named', name: 'moved' } as const

  it('records the answer for this Sunday', () => {
    expect(useAppStore.getState().recordWeek('2026-09-20', named, SUNDAY)).toBe(
      true,
    )
    expect(useAppStore.getState().entries).toEqual({ '2026-09-20': named })
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    expect(stored.state.entries).toEqual({ '2026-09-20': named })
  })

  it('never overwrites an answer', () => {
    const { recordWeek } = useAppStore.getState()
    recordWeek('2026-09-20', named, SUNDAY)
    expect(recordWeek('2026-09-20', { outcome: 'released' }, SUNDAY)).toBe(
      false,
    )
    expect(useAppStore.getState().entries['2026-09-20']).toEqual(named)
  })

  it('refuses an answer that arrives after Sunday midnight', () => {
    const justAfter = new Date(2026, 8, 21, 0, 0, 5)
    expect(
      useAppStore.getState().recordWeek('2026-09-20', named, justAfter),
    ).toBe(false)
    expect(useAppStore.getState().entries).toEqual({})
  })
})

describe('letters', () => {
  const FRIDAY = new Date(2026, 8, 18, 12)
  const NEXT_MONDAY = new Date(2026, 8, 21, 9)

  function sealOne(date = new Date(2026, 8, 23)) {
    useAppStore.setState({
      profile: { birthDate: '1994-05-12', expectedAge: 80 },
    })
    return useAppStore.getState().sealLetter('  Dear me,  ', date, FRIDAY)
  }

  it('seals a letter to the week of the chosen date', () => {
    expect(sealOne()).toBe(true)
    expect(useAppStore.getState().letters).toEqual([
      {
        id: expect.any(String),
        body: 'Dear me,',
        writtenAt: FRIDAY.toISOString(),
        week: '2026-09-27',
        openedAt: null,
      },
    ])
  })

  it('refuses letters to this week or beyond the expected lifespan', () => {
    expect(sealOne(new Date(2026, 8, 19))).toBe(false)
    expect(sealOne(new Date(2080, 0, 1))).toBe(false)
    expect(useAppStore.getState().letters).toEqual([])
  })

  it('refuses blank letters', () => {
    useAppStore.setState({
      profile: { birthDate: '1994-05-12', expectedAge: 80 },
    })
    expect(
      useAppStore.getState().sealLetter('   ', new Date(2027, 0, 1), FRIDAY),
    ).toBe(false)
  })

  it('cannot open or delete a letter before it arrives', () => {
    sealOne()
    const [{ id }] = useAppStore.getState().letters
    useAppStore.getState().openLetter(id, FRIDAY)
    useAppStore.getState().deleteLetter(id, FRIDAY)
    expect(useAppStore.getState().letters).toMatchObject([{ openedAt: null }])
  })

  it('opens an arrived letter once, keeping the first reading time', () => {
    sealOne()
    const [{ id }] = useAppStore.getState().letters
    useAppStore.getState().openLetter(id, NEXT_MONDAY)
    useAppStore.getState().openLetter(id, new Date(2026, 8, 25))
    expect(useAppStore.getState().letters[0].openedAt).toBe(
      NEXT_MONDAY.toISOString(),
    )
    expect(useAppStore.getState().hasReceivedLetter).toBe(true)
  })

  it('deletes an arrived letter and remembers one was received', () => {
    sealOne()
    const [{ id }] = useAppStore.getState().letters
    useAppStore.getState().deleteLetter(id, NEXT_MONDAY)
    expect(useAppStore.getState().letters).toEqual([])
    expect(useAppStore.getState().hasReceivedLetter).toBe(true)
  })
})

describe('counters', () => {
  const FRIDAY = new Date(2026, 8, 18, 12)
  const visits = {
    name: '  Visits to   my parents ',
    times: 2,
    per: 'year',
    end: { kind: 'age', birthYear: 1962, age: 90 },
  } as const

  it('adds a tidied custom counter', () => {
    expect(useAppStore.getState().addCounter(visits, FRIDAY)).toBe(true)
    expect(useAppStore.getState().counters).toEqual([
      { ...visits, id: expect.any(String), name: 'Visits to my parents' },
    ])
  })

  it('refuses an invalid counter', () => {
    expect(
      useAppStore.getState().addCounter({ ...visits, times: 0 }, FRIDAY),
    ).toBe(false)
    expect(useAppStore.getState().counters).toEqual([])
  })

  it('edits and deletes a custom counter', () => {
    useAppStore.getState().addCounter(visits, FRIDAY)
    const [{ id }] = useAppStore.getState().counters
    useAppStore
      .getState()
      .updateCounter(id, { ...visits, times: 4, end: null }, FRIDAY)
    expect(useAppStore.getState().counters).toMatchObject([
      { id, times: 4, end: null },
    ])
    useAppStore.getState().deleteCounter(id)
    expect(useAppStore.getState().counters).toEqual([])
  })

  it('hides and shows built-in counters', () => {
    const { setCounterHidden } = useAppStore.getState()
    setCounterHidden('full-moons', true)
    setCounterHidden('full-moons', true)
    expect(useAppStore.getState().hiddenCounters).toEqual(['full-moons'])
    setCounterHidden('full-moons', false)
    expect(useAppStore.getState().hiddenCounters).toEqual([])
  })
})

describe('drawReflection', () => {
  it('walks through a shuffled deck and remembers its place', () => {
    const { drawReflection } = useAppStore.getState()
    const drawn = Array.from({ length: 5 }, () => drawReflection(5))
    expect([...drawn].sort()).toEqual([0, 1, 2, 3, 4])

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    expect(stored.state.reflections).toMatchObject({ position: 5 })
  })
})
