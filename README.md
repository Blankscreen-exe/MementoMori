# Memento Mori

A mobile-friendly web app that visualizes the time you have left. Everything is stored locally in your browser.

## Tech stack

- React 19 + TypeScript, built with Vite
- Tailwind CSS
- Installable as a PWA (works offline)
- Vitest + Testing Library
- oxlint + Prettier
- GitHub Actions CI

## Getting started

Requires [Bun](https://bun.sh).

```bash
bun install
bun dev
```

## Scripts

| Command                | Description                        |
| ---------------------- | ---------------------------------- |
| `bun dev`              | Start the dev server               |
| `bun run build`        | Typecheck and build for production |
| `bun run preview`      | Preview the production build       |
| `bun run typecheck`    | Run the TypeScript compiler        |
| `bun run lint`         | Lint with oxlint                   |
| `bun run format`       | Format with Prettier               |
| `bun run format:check` | Check formatting without writing   |
| `bun run test`         | Run the test suite once            |
| `bun run test:watch`   | Run tests in watch mode            |
