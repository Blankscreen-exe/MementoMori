import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Profile } from '../domain/life'
import { weekKeyOf, type WeekKey } from '../domain/week'

export const STORAGE_KEY = 'memento-mori'
/** Bump when the persisted shape changes, and add a migration. */
export const STORAGE_VERSION = 1

export interface PersistedState {
  profile: Profile | null
  /** The week the app was first used in. Earlier weeks are unrecorded. */
  firstWeek: WeekKey | null
}

interface Actions {
  completeOnboarding: (profile: Profile, now: Date) => void
}

export type AppState = PersistedState & Actions

export const initialState: PersistedState = { profile: null, firstWeek: null }

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
      completeOnboarding: (profile, now) =>
        set({ profile, firstWeek: weekKeyOf(now) }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ profile, firstWeek }): PersistedState => ({
        profile,
        firstWeek,
      }),
    },
  ),
)
