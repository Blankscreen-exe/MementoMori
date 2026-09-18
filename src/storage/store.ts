import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  normalizeCounter,
  validateCounter,
  type BuiltInCounter,
  type CounterInput,
  type CustomCounter,
} from '../domain/counters'
import {
  deliveryFor,
  hasArrived,
  validateLetterBody,
  type Letter,
} from '../domain/letters'
import type { Profile } from '../domain/life'
import { canAnswer, type WeekEntries, type WeekEntry } from '../domain/ritual'
import { weekKeyOf, type WeekKey } from '../domain/week'

export const STORAGE_KEY = 'memento-mori'
/** Bump when the persisted shape changes, and add a migration. */
export const STORAGE_VERSION = 1

export interface PersistedState {
  profile: Profile | null
  /** The week the app was first used in. Earlier weeks are unrecorded. */
  firstWeek: WeekKey | null
  /** Set on the first tap of the hourglass, which retires the hint. */
  hasTouchedGlass: boolean
  /** Each answered week's final outcome. Entries are never changed. */
  entries: WeekEntries
  letters: Letter[]
  /**
   * Set once a letter has been opened or deleted, so the letters dot stays
   * even after every arrived letter is gone.
   */
  hasReceivedLetter: boolean
  counters: CustomCounter[]
  /** Built-in counters the user chose to hide. */
  hiddenCounters: BuiltInCounter[]
}

interface Actions {
  completeOnboarding: (profile: Profile, now: Date) => void
  touchGlass: () => void
  /**
   * Records the outcome of `week`. Returns false, and changes nothing, if the
   * week can no longer be answered at `now`.
   */
  recordWeek: (week: WeekKey, entry: WeekEntry, now: Date) => boolean
  /** Seals a letter to the week containing `date`. Returns false if invalid. */
  sealLetter: (body: string, date: Date, now: Date) => boolean
  /** Marks an arrived letter as read. Sealed letters can't be opened. */
  openLetter: (id: string, now: Date) => void
  /** Deletes an arrived letter. Sealed letters can't be deleted. */
  deleteLetter: (id: string, now: Date) => void
  /** Adds a custom counter. Returns false if it isn't valid. */
  addCounter: (input: CounterInput, now: Date) => boolean
  /** Replaces a custom counter. Returns false if the new version isn't valid. */
  updateCounter: (id: string, input: CounterInput, now: Date) => boolean
  deleteCounter: (id: string) => void
  setCounterHidden: (counter: BuiltInCounter, hidden: boolean) => void
}

export type AppState = PersistedState & Actions

export const initialState: PersistedState = {
  profile: null,
  firstWeek: null,
  hasTouchedGlass: false,
  entries: {},
  letters: [],
  hasReceivedLetter: false,
  counters: [],
  hiddenCounters: [],
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      completeOnboarding: (profile, now) =>
        set({ profile, firstWeek: weekKeyOf(now) }),
      touchGlass: () => set({ hasTouchedGlass: true }),
      recordWeek: (week, entry, now) => {
        const { entries } = get()
        if (!canAnswer(week, now, entries)) return false
        set({ entries: { ...entries, [week]: entry } })
        return true
      },
      sealLetter: (body, date, now) => {
        const { profile, letters } = get()
        if (!profile || validateLetterBody(body) !== null) return false
        const delivery = deliveryFor(date, profile, now)
        if ('error' in delivery) return false
        const letter: Letter = {
          id: crypto.randomUUID(),
          body: body.trim(),
          writtenAt: now.toISOString(),
          week: delivery.week,
          openedAt: null,
        }
        set({ letters: [...letters, letter] })
        return true
      },
      openLetter: (id, now) =>
        set(({ letters }) => ({
          hasReceivedLetter: true,
          letters: letters.map((letter) =>
            letter.id === id && hasArrived(letter, now) && !letter.openedAt
              ? { ...letter, openedAt: now.toISOString() }
              : letter,
          ),
        })),
      deleteLetter: (id, now) =>
        set(({ letters }) => ({
          hasReceivedLetter: true,
          letters: letters.filter(
            (letter) => letter.id !== id || !hasArrived(letter, now),
          ),
        })),
      addCounter: (input, now) => {
        if (validateCounter(input, now) !== null) return false
        const counter = { id: crypto.randomUUID(), ...normalizeCounter(input) }
        set(({ counters }) => ({ counters: [...counters, counter] }))
        return true
      },
      updateCounter: (id, input, now) => {
        if (validateCounter(input, now) !== null) return false
        set(({ counters }) => ({
          counters: counters.map((counter) =>
            counter.id === id ? { id, ...normalizeCounter(input) } : counter,
          ),
        }))
        return true
      },
      deleteCounter: (id) =>
        set(({ counters }) => ({
          counters: counters.filter((counter) => counter.id !== id),
        })),
      setCounterHidden: (counter, hidden) =>
        set(({ hiddenCounters }) => ({
          hiddenCounters: hidden
            ? [...new Set([...hiddenCounters, counter])]
            : hiddenCounters.filter((kind) => kind !== counter),
        })),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      // New fields need no migration: missing keys fall back to initialState.
      partialize: ({
        profile,
        firstWeek,
        hasTouchedGlass,
        entries,
        letters,
        hasReceivedLetter,
        counters,
        hiddenCounters,
      }): PersistedState => ({
        profile,
        firstWeek,
        hasTouchedGlass,
        entries,
        letters,
        hasReceivedLetter,
        counters,
        hiddenCounters,
      }),
    },
  ),
)
