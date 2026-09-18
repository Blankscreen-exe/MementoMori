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
