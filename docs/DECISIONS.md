# Decisions

A record of the key product and technical decisions behind Memento Mori, and the reasoning behind each one. New entries are added as the project evolves.

## Product

### An hourglass instead of a grid

The classic "life in weeks" visualization is a grid of ~4,000 boxes. It's effective, but it's static and familiar. An hourglass carries the same information and adds motion, so time visibly passes while you look at it. It's a single object that people instantly understand as "time running out", and it feels physical rather than statistical.

It started as a flat 2D drawing and became a low-poly 3D object after the first release (see "A low-poly 3D hourglass" below), which made it feel even more like a thing you hold.

### Sand is proportional, not literal

The amount of sand in each bulb always matches the real ratio of time lived to time remaining, recalculated from the user's actual dates. One grain passes through the neck every second as a visual heartbeat, but the pile levels are never driven by the animation itself.

At the scale of a lifetime, one second is a vanishingly small fraction, so a literal one-grain-per-unit model would either look frozen or need thousands of particles. Separating the animation (always flowing) from the data (always accurate) keeps the hourglass alive without misrepresenting anything.

The stream itself is a fine continuous trickle, with one slightly larger grain dropped at the start of every second. It reads as a real hourglass while keeping the one-second rhythm.

### Sand is measured by volume, not height

A bulb is narrow near the neck and wide at the ends, so filling it to 40% of its height would hold far less than 40% of its sand. The levels are computed so that the amount of sand in each bulb matches the share of life it represents, using a precomputed table of the bulb's cumulative size and a binary search. In 3D that amount is volume: every slice of the faceted glass is the same polygon scaled by its radius, so volume grows with the integral of r². The 2D fallback uses area. Tests check both against an independent numeric integration.

A side effect is that the pile can look smaller than expected: 40% of a bulb's sand only reaches a modest height, because the bottom of the bulb is its widest part. That is the honest picture.

### Tilting moves sand, never time

The hourglass leans when the phone tilts or when it's dragged like a joystick, forward, back or sideways, but never more than 20°, so it can't come close to being turned over. The sand's surface stays level as the glass leans, and sand never travels back up through the neck. A real hourglass can be flipped to start over; a life cannot. The interaction invites play and delivers the app's message at the same moment.

### Named weeks become sediment

Each week can be named. As the weeks pass, they settle into the bottom bulb, sized in proportion to the time they cover, so the pile becomes a record of the user's life. The data keeps every week's layer, ready for a planned view that shows the history of a period.

This keeps every feature inside the one central metaphor, instead of adding a second visualization (such as a grid) for the data-entry features.

### The Sunday ritual gives you one chance

When the app is opened on a Sunday (local time), it asks:

> This week will not come again. Name it, or let it go.

The prompt stays available for the rest of that Sunday, until the user either names the week or chooses "Let it go". Both choices are final. If the user never opens the app that Sunday, the week is recorded as missed, permanently.

- **Why unforgiving:** most habit apps let you backfill missed days. Here, missing a week can't be undone, which mirrors how time works. The app practices what it preaches.
- **Why not stricter:** consuming the chance the moment the prompt appears would make an accidental reload or an interruption cost a week. Harshness should come from the user's own choice, not from a technical accident.
- **Why an honor system:** all data lives in the browser, so a determined user could change their device clock or edit storage. For a personal, local-only tool, adding server-side enforcement would cost privacy and simplicity for no real benefit.
- **The first Sunday counts:** if someone starts using the app on a Sunday, the ritual opens right after onboarding. Every Sunday is a chance, with no exceptions, which keeps the rule simple to explain and to test.

A week runs Monday to Sunday and belongs to the Sunday that ends it, so the ritual always names the week that is just finishing.

### How the ritual works

- **It blocks the app.** On a Sunday, the app opens to the prompt and nothing else, until the week is named or let go. A "Not now" button would offer an easy way to avoid the question, which defeats its purpose.
- **A name is a short phrase.** Up to 40 characters, trimmed and with repeated spaces collapsed. A single word felt too narrow for weeks like "moved to Lisbon", and the limit still forces the week to be distilled.
- **Only a name, no color.** An earlier version also asked for one of ten colors, shown as colored strata. Once all sand became pure white, a choice that showed up nowhere would have been a false promise, so it was removed. Names saved with a color before then still load; the color is simply ignored.
- **"Let it go" doesn't ask for confirmation.** An "Are you sure?" dialog would undercut the gravity the prompt sets up. The button sits quietly below "Keep it", so it's hard to hit by accident.
- **The answer settles into the sand.** After "Keep it", the prompt fades out and the hourglass fades in with the week's name shown underneath for a few seconds.
- **Answers are checked at the moment of saving.** If someone is still typing when Sunday ends, the answer is refused and the app moves on to Monday. Otherwise it would be filed under the next week.

### Every week is white sand

The data keeps every week's story apart: named, released (the user chose "Let it go"), missed (the Sunday passed without an answer), and unrecorded (lived before the app was first used). Keeping unrecorded apart from missed matters: otherwise a 30-year-old would start with decades of "missed" weeks they never had a chance to name.

On screen, all of them are the same pure white sand. Earlier designs gave each its own tone (grey for missed, a faint tone for the unrecorded past, colors for named weeks), but the final design is strictly black and white, and the hourglass reads as one object rather than a chart. Each outcome still has its own theme token, and the distinctions stay in the data, ready for a future history view.

### Letters to future weeks

Users can write a sealed note to a specific future week. The note glints as a grain in the top bulb and opens once that week arrives. It gives the future bulb meaning beyond "time you're losing": it also holds things to look forward to.

- **Writing.** Letters are written from the menu that appears when the glass is tapped, and hold up to 2,000 characters: about a page, enough for a real letter without turning into a journal. The button says "Seal it", echoing "Keep it" and "Let it go" from the ritual.
- **Choosing the week.** Presets (next birthday, in a year, in five years, in ten years) cover the common cases with their dates shown, and "On a date" uses the same three fields as onboarding for anniversaries and other specific days. The letter opens at the start of that date's week.
- **Only within the expected lifespan.** A letter's glint sits at its week's place in the remaining sand, so a week beyond the expected age has nowhere to be. Presets that would land past it are shown but disabled.
- **Sealed means sealed.** Until its week arrives, a letter can't be read, edited, deleted or even listed. It exists only as a glint. That keeps the act of sealing meaningful, in the same spirit as the ritual's final answers.
- **Arrival is quiet.** When a letter arrives, a white dot appears in the top-right corner and pulses while anything is unread. Once everything is read, it stays still. It only appears after the first letter arrives, so that first arrival is a surprise, and then it stays as the way back to past letters.
- **Arrived letters can be deleted, never edited.** A past self's words shouldn't be rewritten, but the user can choose to let a letter go. Unlike "Let it go" in the ritual, deleting asks for confirmation, because a letter is something that can never be written again.
- **Glints are placed by area,** like the sand levels: a letter halfway through the remaining time sits where half of the remaining sand lies above it. Each glint's horizontal position and twinkle come from a hash of the letter's id, so they stay put between visits.

### A reflection each time the app opens

Every time the app is launched, it opens on a black screen with a single white line: a question or a short reflection about what matters, like "Who haven’t you called in a while?" A tap moves on, or it fades by itself after eight seconds. It comes before everything else, including the Sunday ritual, so it sets the mood for naming the week. It isn't shown on the very first visit, before anything is set up.

- **1,000 original prompts, no quotes.** They are written for the app in one voice, across ten themes of 100 (people, time, work, body, presence, courage, gratitude, forgiveness, meaning and mortality). Avoiding famous quotes avoids attribution questions and keeps the tone consistent. Every prompt stands on its own, since any of them can appear first. Tests check the count, that none repeat, and that each is short and complete.
- **A shuffled deck, not a coin toss.** The prompts are shuffled once, like a deck of cards, and dealt in that order. The position is saved, so none repeats until all 1,000 have been seen. A fresh deck never starts with the one just shown. Truly random picks would start repeating within a few dozen launches.
- **Once per launch.** A message is drawn once per page load, outside React, so rendering twice (as React does in development) can never skip one. Returning to the app from the background doesn't count as a launch.

### A minimal home screen

The home screen shows only the hourglass. Tapping it briefly reveals a single line of text and a menu, both of which fade away after a few seconds. The line counts the days left ("17,403 days left"), or, past the expected age, the days borrowed so far. It first mapped the lifespan onto a 24-hour day ("10:12 AM of your life"), which was poetic but had to be decoded; a plain count of days is immediate, and a day is a unit everyone feels. A one-time hint after onboarding ("Touch the glass.") teaches the gesture without adding permanent UI.

### One question per screen during onboarding

Birthday and expected lifespan are asked on separate full screens. The first minute sets the tone of the app, and a slow, deliberate sequence fits the subject better than a form. It's also more comfortable on a small screen.

### Expected lifespan in whole years

The user picks their expected age in whole years, from 1 to 120, starting at 80. Suggesting a number from national life-expectancy tables would add a dataset and a country picker, and it would still be an estimate. Letting the user choose keeps the app simple and makes the number theirs. It can be changed later.

### Borrowed time

If someone outlives the age they chose, the app doesn't break or nag them to raise the number. The top bulb is empty, the stream stops and the hourglass sits still, with the line "Every week now is borrowed." The Sunday ritual keeps working, and new weeks keep settling on top of the strata.

### Slow fades between onboarding steps

Each onboarding step fades out and the next fades in over 0.7 seconds. A slide would suggest a quick wizard to click through, while a slow fade matches the deliberate tone of the questions. When the operating system asks for reduced motion, steps switch instantly.

### Three fields for the birthday

The birthday is entered in three fields (day, month, year) instead of the browser's date picker. Native pickers look different on every platform, clash with the theme, and are slow for picking a date decades in the past. The fields are always in DD / MM / YYYY order, with a label under each one so the order is never ambiguous. Focus moves to the next field automatically once one is full, so the date can be typed in one go, and impossible dates like 31 February are rejected.

### A big number for the expected age

The expected age is shown as one large number with − and + buttons. It can also be dragged left or right (one year per 10 pixels) or tapped to type a value directly, so every kind of user has a comfortable way to set it. It's built as an accessible spin button: screen readers announce it as "80 years", and the arrow, Page Up/Down, Home and End keys all work.

### Tail End counters

Big totals like "2,000 weeks" are abstract. Counting things that actually repeat, like summers or visits home, makes the remaining time concrete. Users can define their own counters (for example "I see my parents twice a year").

- **Built-ins plus custom ones.** Summers, Sundays, birthdays and full moons are computed from the user's own dates, so the screen means something from the first visit. Any of them can be hidden and shown again.
- **Custom counters are "N times a week, month or year".** One number and a unit covers everything from weekly calls to yearly trips.
- **They can end before the user does.** Visits to parents are limited by the parents' lifetime, not only the user's, so a counter can run "until they turn 90 (born 1962)" or until a date. Only a birth year is asked for, so the middle of that year stands in for the birthday. Without an end, a counter runs to the user's expected age, and it never runs past it.
- **A number, plus dots when there are few.** Up to 200 remaining, one dot per occurrence is drawn under the number: 51 visits become 51 dots you can see. Beyond that, a field of dots stops meaning anything, so 2,486 Sundays stays a number.
- **Counters can be edited and deleted freely.** Unlike the ritual's answers or a letter's words, a counter is an estimate about the future, and it should change when life does.
- **How each is counted.** Sundays and birthdays are counted exactly. The birthday at the expected age itself isn't counted. Summers are counted by midsummer on 21 June, which is within one of the right answer in either hemisphere. Full moons use a known full moon and the average lunar cycle of 29.53 days. Custom counters spread their frequency evenly over the time left.

## Visual design

### From Nocturne to pure black and white

Three directions were prototyped as standalone pages with a working hourglass: Nocturne (dark and contemplative, serif), Parchment (a classical still life with an engraved frame) and Stark mono (black and white, monospace). Nocturne was chosen and built: near-black and warm grey surfaces, a faint glass outline, softer grey for secondary text, and matching light and dark modes.

Before the first release, it was simplified to its essence: **pure black, and pure white for everything on it.** There is no grey text, no faint outline and no light mode. Hierarchy comes only from size, weight and spacing. The subject is stark, and the design now is too.

- **Type:** Cormorant Garamond, with light-weight headings. A thin classical serif gives the app a timeless tone, fitting a phrase that dates back to antiquity.
- **Two deliberate exceptions:** placeholders and disabled buttons are dimmed. In pure white they would look identical to typed text and active buttons, so people would type over what looks like an answer or tap buttons that don't respond.
- **A step indicator without color:** onboarding's current step is shown by a longer line, since a brighter one is no longer possible.

### One theme, always black

The app ignores the system's light or dark setting. A mirrored light mode would have doubled the design surface for little gain, and the hourglass reads best as white sand in a dark room.

### Pure white sand

All the sand is flat, pure white, with no grain texture. Maximum contrast makes the remaining time the most prominent thing on the screen, and flat shapes keep the hourglass abstract instead of trying to look realistic.

### The glint is a hole in the sand

A sealed letter appears as a small black spark on the surface of the white sand. It uses the background color rather than adding a new one, which keeps the screen strictly black and white. In 3D, the sand is opaque, so a spark sits on its outer surface where it can be seen, at the height where its week lies.

### No color at all

For a while, named weeks were the one place color was allowed: a curated palette of ten muted tones, chosen in the ritual and shown as colored strata. When the 3D hourglass arrived, the sand became pure white throughout, and the palette went with it. The app is now black and white throughout; the only variation is the two deliberate dims above.

### A low-poly 3D hourglass

After the first release, the flat hourglass was replaced by a stylized 3D one: deliberately not realistic.

- **Faceted glass, drawn only as its outline.** The glass is the same curve as before, spun into a 12-sided solid. Only the edges on its silhouette are drawn, the ones where one facet faces the viewer and the next faces away, so it reads as glass rather than a wireframe. Which edges those are changes as it turns, so they're recomputed every frame (a pure, tested function).
- **A line like ink on glass.** The outline is drawn as thin camera-facing ribbons whose width varies: heaviest at the neck and the rims and on the side away from the light, a hairline on the lit flank. WebGL lines can't vary in width, which is why ribbons are used.
- **A white frame with soft shading.** Two thin 12-sided plates and three pillars, pure white and flat-shaded under a bright ambient light and a soft key light, so faces turned away are only a little darker.
- **Pure white sand that stays level.** Each bulb's sand is cut by a plane that stays horizontal in the world, so it settles flat when the glass leans. A white floor inside the pile keeps it looking solid when seen from above.
- **A line of black between sand and base.** The glass sits a sliver above each plate, with a black spacer in the gap, so the white pile never melts into the white base.
- **It turns on its own.** It rotates slowly and sways a little, keeps turning while you lean it, and springs back upright when you let go.

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

### Self-hosted fonts

Cormorant Garamond is bundled with the app through the `@fontsource` package instead of being loaded from Google Fonts. The installed app works fully offline with the right typeface, and visitors' browsers never contact a third party. That keeps the app's privacy promise literally true.

### Theme tokens as CSS variables

All colors are CSS variables with semantic names, and Tailwind exposes them as utilities (`bg-canvas`, `text-ink`, `text-muted`). Components describe a role ("secondary text"), not a value, and the canvas-drawn hourglass reads the same variables, so there's a single source of truth. That paid off when the theme moved to pure black and white: the whole restyle was a change to one file, plus two spots that had relied on a difference in color.

### Vitest + Testing Library, without globals

Vitest shares Vite's config and transform pipeline, so tests run the same code the app does. Test globals are disabled, so each test file imports `describe`, `it` and `expect` explicitly. That makes dependencies visible and keeps the global scope clean.

### Progressive Web App

The app is meant to be opened on a phone, often on a Sunday, possibly offline. Installing it as a PWA puts it on the home screen, and the service worker makes it work without a connection.

### A pure domain layer

All of the app's rules live in `src/domain` as plain functions with no React and no storage: how much of a life has passed, which week a date belongs to, whether the ritual is open, and how the strata are laid out. Each function takes the current time as an argument instead of reading the clock, so tests can pin exact moments, like the last millisecond of a Sunday. The rules the app depends on most are also the easiest to test.

### date-fns

Week boundaries, time zones and daylight saving time are easy to get subtly wrong with the native `Date` API. date-fns provides tested helpers for exactly these operations and is tree-shakeable, so only the functions used end up in the bundle. The newer Temporal API was considered, but it would still need a polyfill for full browser support.

### Zustand with persistence

App state lives in a small Zustand store, and its persist middleware saves it to localStorage. The stored data has a schema version, so future changes to its shape can be migrated instead of breaking existing users' history. The data is small (a few thousand weeks at most), so a full database like IndexedDB isn't needed.

### No router

The app has no meaningful URLs: it has onboarding, a home screen and a few sheets. Screens are driven by app state instead of a routing library. Opening a sheet pushes a browser history entry, so the Android back gesture closes the sheet instead of leaving the app.

The home screen owns a single history entry for "a sheet is open", rather than each sheet adding its own. Moving from the menu to "Write a letter" swaps what is shown without touching history, and closing by button removes the entry again. An earlier version gave every sheet its own entry, which raced when one sheet closed as another opened.

### A three.js hourglass, with a 2D fallback

The 3D hourglass is drawn with plain three.js rather than React Three Fiber. It's one dependency instead of three, and it keeps the renderer an imperative module like the 2D one before it, easy to follow and to test. three.js is loaded lazily in its own chunk, so it downloads only once the hourglass is actually shown and doesn't slow down onboarding.

The code is split into layers:

- **Geometry** (`geometry3d.ts`) is pure math: the glass shape, the volume calculations, the silhouette and the stroke widths, all unit-tested.
- **Motion** (`motion.ts`) is pure too: the joystick-style lean, the 20° limit, the phone's tilt, the idle sway and the spring back upright.
- **The scene** (`scene3d.ts`) turns a frame description (life lived, sparks, motion, time) into three.js objects. Colors are read from the theme's CSS variables.
- **The component** (`Hourglass3D.tsx`) owns the animation loop, resizing, pausing, input and preferences. It keeps the latest data in a ref, so new data doesn't restart the loop, and it tells a tap (reveal the days left) from a drag (lean the glass).

Because a canvas is invisible to assistive technology, the same information is provided as text for screen readers ("40% of your expected life has passed, and about 2,486 weeks remain"), shared by both versions. The animation pauses while the tab is hidden. When the operating system asks for reduced motion, the same 3D hourglass is drawn once, still and upright. Browsers without WebGL get the original 2D canvas hourglass, which is kept for exactly that. iOS only reports device orientation after the user grants permission, so the app asks on the first tap of the glass, which is also when the hint retires.

### Continuous integration

GitHub Actions runs lint, format check, typecheck, tests and a production build on every pull request and on every push to `develop` and `main`, so both branches are always in a releasable state.

### Branching

Work happens on feature branches, one per milestone. Each is merged into `develop` through a pull request, and `develop` is merged into `main` through another pull request. `main` only ever receives reviewed, CI-verified changes.

### LF line endings

A `.gitattributes` file forces LF line endings in the repository. Without it, Windows checkouts can convert files to CRLF, and Prettier's format check then fails locally even though CI passes.

### Deployment on Vercel

The app is deployed on Vercel. `main` is the production branch, and every other branch gets a preview deployment, so each pull request can be tried out before it's merged.

Vercel's default caching is overridden in `vercel.json` in two places:

- **The service worker and manifest are always revalidated.** If a browser or CDN cached an old `sw.js`, users could be stuck on an outdated version of the app long after a new deploy.
- **Built assets are cached forever.** Files in `/assets` have a content hash in their names, so a changed file always gets a new URL, and the old one can safely be cached indefinitely.

### An icon rendered from the 3D hourglass

The app icon is the hourglass itself, rendered by the app's own 3D scene. `bun run icons` serves a one-page scene with Vite, captures a still frame in headless Chrome, and `@vite-pwa/assets-generator` makes every size from that image. The icon can't drift from what the app draws, and regenerating it is one command. Maskable and Apple icons get a little extra padding, so the hourglass stays inside the safe zone that launchers crop to.

### A black splash screen

The installed app's splash screen, title bar and browser theme color are all black, the same as the app and its icon, so opening it goes from icon to splash to hourglass without a flash of another color.

### Deferred: a history of named weeks

Each week is a hairline of a whole life, and every week is now the same white sand, so the pile can't show which weeks were named or what they were called. The planned answer is a readable history of recent weeks and their names, opened from the pile. It is deliberately left out for now: new users won't have much history for months, and it deserves its own design pass.
