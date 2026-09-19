import { beforeEach, describe, expect, it } from 'vitest'
import { REFLECTIONS } from '../../content/reflections'
import { initialState, useAppStore } from '../../storage/store'
import { reflectionForLaunch } from './launch'

beforeEach(() => {
  useAppStore.setState(initialState)
})

describe('reflectionForLaunch', () => {
  it('shows nothing on the very first visit', () => {
    expect(reflectionForLaunch()).toBeNull()
    expect(useAppStore.getState().reflections).toBeNull()
  })

  it('draws a different reflection on each launch', () => {
    useAppStore.setState({
      profile: { birthDate: '1994-05-12', expectedAge: 80 },
    })
    const first = reflectionForLaunch()
    const second = reflectionForLaunch()
    expect(REFLECTIONS).toContain(first)
    expect(REFLECTIONS).toContain(second)
    expect(second).not.toBe(first)
    expect(useAppStore.getState().reflections?.position).toBe(2)
  })
})
