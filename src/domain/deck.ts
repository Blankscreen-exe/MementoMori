/**
 * A shuffled deck of indices: every item is drawn once before any repeats,
 * like dealing cards. The deck is plain data, so it can be saved and resumed.
 */
export interface Deck {
  order: number[]
  /** How many have been drawn so far. */
  position: number
}

/** The indices 0 to count - 1 in random order (Fisher–Yates). */
export function shuffle(count: number, random = Math.random): number[] {
  const order = Array.from({ length: count }, (_, i) => i)
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

/**
 * Draws the next index from `deck`, dealing a fresh one when it's used up,
 * missing, or was built for a different number of items. A fresh deck never
 * starts with the item that was just shown.
 */
export function draw(
  deck: Deck | null,
  count: number,
  random = Math.random,
): { index: number; deck: Deck } {
  let current = deck
  if (!current || current.order.length !== count || current.position >= count) {
    const last =
      current && current.order.length === count && current.position > 0
        ? current.order[current.position - 1]
        : undefined
    const order = shuffle(count, random)
    if (count > 1 && order[0] === last)
      [order[0], order[1]] = [order[1], order[0]]
    current = { order, position: 0 }
  }
  return {
    index: current.order[current.position],
    deck: { order: current.order, position: current.position + 1 },
  }
}
