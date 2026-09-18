import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom has no matchMedia. Reporting reduced motion makes fades instant,
// which keeps UI tests fast and deterministic.
window.matchMedia = (query: string) =>
  ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) satisfies MediaQueryList

// jsdom doesn't implement pointer capture.
HTMLElement.prototype.setPointerCapture = () => {}
HTMLElement.prototype.releasePointerCapture = () => {}
HTMLElement.prototype.hasPointerCapture = () => false

// jsdom has no canvas or ResizeObserver. Components render their accessible
// markup; the drawing itself is covered by the pure geometry tests.
HTMLCanvasElement.prototype.getContext = (() =>
  null) as typeof HTMLCanvasElement.prototype.getContext
window.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Vitest globals are disabled, so Testing Library can't register its own cleanup.
afterEach(() => {
  cleanup()
  localStorage.clear()
})
