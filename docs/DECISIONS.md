# Decisions

A record of the key product and technical decisions behind Memento Mori, and the reasoning behind each one. New entries are added as the project evolves.

## Product

### An hourglass instead of a grid

The classic "life in weeks" visualization is a grid of ~4,000 boxes. It's effective, but it's static and familiar. An hourglass carries the same information and adds motion, so time visibly passes while you look at it. It's a single object that people instantly understand as "time running out", and it feels physical rather than statistical.

### Sand is proportional, not literal

The amount of sand in each bulb always matches the real ratio of time lived to time remaining, recalculated from the user's actual dates. One grain passes through the neck every second as a visual heartbeat, but the pile levels are never driven by the animation itself.

At the scale of a lifetime, one second is a vanishingly small fraction, so a literal one-grain-per-unit model would either look frozen or need thousands of particles. Separating the animation (always flowing) from the data (always accurate) keeps the hourglass alive without misrepresenting anything.

### Tilting moves sand, never time

On a phone, tilting the device shifts the sand within each bulb, but sand never travels back up through the neck. A real hourglass can be flipped to start over; a life cannot. The interaction invites play and delivers the app's message at the same moment.

### Painted weeks become sediment

Each week can be named with a word and a color. As the weeks pass, they settle into the bottom bulb as colored strata, sized in proportion to the time they cover, so the bottom bulb becomes a geological record of the user's life. Tapping a layer shows the history of that period.

This keeps every feature inside the one central metaphor, instead of adding a second visualization (such as a grid) for the data-entry features.

### The Sunday ritual gives you one chance

When the app is opened on a Sunday (local time), it asks:

> This week will not come again. Name it, or let it go.

The prompt stays available for the rest of that Sunday, until the user either names the week or chooses "Let it go". Both choices are final. If the user never opens the app that Sunday, the week settles as grey sand permanently.

- **Why unforgiving:** most habit apps let you backfill missed days. Here, missing a week can't be undone, which mirrors how time works. The app practices what it preaches.
- **Why not stricter:** consuming the chance the moment the prompt appears would make an accidental reload or an interruption cost a week. Harshness should come from the user's own choice, not from a technical accident.
- **Why an honor system:** all data lives in the browser, so a determined user could change their device clock or edit storage. For a personal, local-only tool, adding server-side enforcement would cost privacy and simplicity for no real benefit.

### Grey means "missed", not "before"

Weeks lived before the user first opened the app are shown in a separate, fainter tone. Without that distinction, a 30-year-old's bottom bulb would be almost entirely grey on day one, burying their future strata and diluting what grey means. Grey is reserved for weeks the user had the chance to name and didn't.

### Letters to future weeks

Users can write a sealed note to a specific future week. The note glints as a grain in the top bulb and opens once that week arrives. It gives the future bulb meaning beyond "time you're losing": it also holds things to look forward to.

### A minimal home screen

The home screen shows only the hourglass. Tapping it briefly reveals a single line of text (for example "10:12 AM of your life", which maps your lifespan onto a 24-hour day) and a menu, both of which fade away after a few seconds. A one-time hint after onboarding ("Touch the glass.") teaches the gesture without adding permanent UI.

### One question per screen during onboarding

Birthday and expected lifespan are asked on separate full screens. The first minute sets the tone of the app, and a slow, deliberate sequence fits the subject better than a form. It's also more comfortable on a small screen.

### Tail End counters

Big totals like "2,000 weeks" are abstract. Counting things that actually repeat, like summers or visits home, makes the remaining time concrete. Users can define their own counters (for example "I see my parents twice a year").

## Visual design

### Nocturne

Three directions were prototyped as standalone pages with a working hourglass: Nocturne (dark and contemplative, serif), Parchment (a classical still life with an engraved frame) and Stark mono (black and white, monospace). Nocturne was chosen because its quiet, near-empty screen suits the subject and puts all the attention on the hourglass.

- **Type:** Cormorant Garamond, with light-weight headings. A thin classical serif gives the app a timeless tone, fitting a phrase that dates back to antiquity.
- **Surfaces:** near-black (`#0B0B0C`) in dark mode and warm grey (`#E9E6E0`) in light mode, with a faint hairline for the glass and no decorative frame.

### Pure monochrome sand

The sand is pure white in dark mode and pure black in light mode, with no grain texture. Maximum contrast makes remaining time the most prominent thing on the screen, and flat shapes keep the hourglass abstract instead of trying to look realistic. Color appears only in the strata, so the painted weeks stand out as the only part of the hourglass the user has shaped.

### The glint inverts the sand

A sealed letter appears as a sparkle in the inverse of the sand color: black in dark mode, white in light mode. It's visible against the sand without adding a new accent color, which keeps the palette strictly monochrome outside the strata.

### A curated strata palette

Painted weeks use a fixed palette of ten muted tones (Ember, Rose, Moss, Tide, Dusk, Ochre, Clay, Sage, Plum, Slate), each with a tuned variant for light and dark mode. A free color picker would let clashing colors turn the sediment into noise. A curated set keeps any combination of choices looking coherent.

### Light and dark modes follow the system

Both modes are designed deliberately rather than generated by inverting colors, and the app follows the operating system's setting.

## Technical

### Local-only storage

All data stays in the browser. There is no account, no server and no tracking. The subject matter is personal, so privacy is a feature rather than an afterthought.

### React + TypeScript + Vite

TypeScript documents the app's data shapes (the profile, the painted weeks, the letters) and catches date-math mistakes at compile time. Vite is the standard React build tool, with fast development builds and minimal configuration.

### Bun

Bun serves as the package manager and script runner because it's fast, and it works as a drop-in replacement for npm-based tooling.

### Tailwind CSS v4

Utility classes keep the styles next to the markup and remove the need to name one-off classes. Version 4 is configured in CSS through its Vite plugin, so the project has no Tailwind config file.

### oxlint + Prettier

The official Vite template ships with oxlint, a Rust-based linter that is much faster than ESLint and needs very little configuration. Prettier handles formatting, and its Tailwind plugin sorts class names consistently.

### Vitest + Testing Library, without globals

Vitest shares Vite's config and transform pipeline, so tests run the same code the app does. Test globals are disabled, so each test file imports `describe`, `it` and `expect` explicitly. That makes dependencies visible and keeps the global scope clean.

### Progressive Web App

The app is meant to be opened on a phone, often on a Sunday, possibly offline. Installing it as a PWA puts it on the home screen, and the service worker makes it work without a connection.

### Continuous integration

GitHub Actions runs lint, format check, typecheck, tests and a production build on every push and pull request, so the main branch is always in a releasable state.

### LF line endings

A `.gitattributes` file forces LF line endings in the repository. Without it, Windows checkouts can convert files to CRLF, and Prettier's format check then fails locally even though CI passes.
