import { describe, expect, it } from 'vitest'
import { REFLECTION_THEMES, REFLECTIONS } from '.'

describe('reflections', () => {
  it('has 1,000 messages, 100 in each of 10 themes', () => {
    expect(REFLECTIONS).toHaveLength(1000)
    const themes = Object.values(REFLECTION_THEMES)
    expect(themes).toHaveLength(10)
    for (const theme of themes) expect(theme).toHaveLength(100)
  })

  it('never repeats a message', () => {
    const normalized = REFLECTIONS.map((text) => text.toLowerCase())
    expect(new Set(normalized).size).toBe(REFLECTIONS.length)
  })

  it('keeps every message short, tidy and complete', () => {
    for (const text of REFLECTIONS) {
      expect(text).toBe(text.trim())
      expect(text.length).toBeGreaterThan(8)
      expect(text.length).toBeLessThanOrEqual(100)
      expect(text).toMatch(/[.?!]$/)
      expect(text).not.toMatch(/\s{2}/)
    }
  })
})
