import { describe, expect, it } from 'vitest'
import { draw, shuffle, type Deck } from './deck'

/** A repeatable stand-in for Math.random. */
function seeded(seed = 42) {
  let state = seed
  return () => {
    state = (state * 16807) % 2147483647
    return state / 2147483647
  }
}

describe('shuffle', () => {
  it('returns every index exactly once', () => {
    const order = shuffle(50, seeded())
    expect([...order].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 50 }, (_, i) => i),
    )
  })

  it('actually changes the order', () => {
    const order = shuffle(50, seeded())
    expect(order).not.toEqual(Array.from({ length: 50 }, (_, i) => i))
  })
})

describe('draw', () => {
  it('shows every item once before repeating any', () => {
    const random = seeded()
    let deck: Deck | null = null
    const seen: number[] = []
    for (let i = 0; i < 20; i++) {
      const next = draw(deck, 20, random)
      seen.push(next.index)
      deck = next.deck
    }
    expect(new Set(seen).size).toBe(20)
  })

  it('deals a fresh deck once every item has been shown', () => {
    const random = seeded()
    let deck: Deck | null = null
    for (let i = 0; i < 5; i++) deck = draw(deck, 5, random).deck
    expect(deck?.position).toBe(5)
    const next = draw(deck, 5, random)
    expect(next.deck.position).toBe(1)
  })

  it('never starts a fresh deck with the item just shown', () => {
    for (let seed = 1; seed < 200; seed++) {
      const random = seeded(seed)
      let deck: Deck | null = null
      let last = -1
      for (let i = 0; i < 3; i++) {
        const next = draw(deck, 3, random)
        last = next.index
        deck = next.deck
      }
      expect(draw(deck, 3, random).index).not.toBe(last)
    }
  })

  it('starts over when the number of items changes', () => {
    const random = seeded()
    const { deck } = draw(null, 10, random)
    const next = draw(deck, 12, random)
    expect(next.deck.order).toHaveLength(12)
    expect(next.deck.position).toBe(1)
  })

  it('does not change the deck it was given', () => {
    const deck: Deck = { order: [2, 0, 1], position: 1 }
    draw(deck, 3)
    expect(deck).toEqual({ order: [2, 0, 1], position: 1 })
  })
})
