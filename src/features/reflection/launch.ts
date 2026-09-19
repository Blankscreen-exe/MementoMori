import { REFLECTIONS } from '../../content/reflections'
import { useAppStore } from '../../storage/store'

/**
 * The reflection for this launch of the app, or null on the very first
 * visit, before anything is set up. Called once per page load, outside React,
 * so re-renders can never skip a message.
 */
export function reflectionForLaunch(): string | null {
  const { profile, drawReflection } = useAppStore.getState()
  if (!profile) return null
  return REFLECTIONS[drawReflection(REFLECTIONS.length)]
}
