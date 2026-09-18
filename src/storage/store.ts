import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
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
}

interface Actions {
  completeOnboarding: (profile: Profile, now: Date) => void
  touchGlass: () => void
  /**
   * Records the outcome of `week`. Returns false, and changes nothing, if the
   * week can no longer be answered at `now`.
   */
  recordWeek: (week: WeekKey, entry: WeekEntry, now: Date) => boolean
}

export type AppState = PersistedState & Actions

export const initialState: PersistedState = {
  profile: null,
  firstWeek: null,
  hasTouchedGlass: false,
  entries: {},
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
      }): PersistedState => ({
        profile,
        firstWeek,
        hasTouchedGlass,
        entries,
      }),
    },
  ),
)
