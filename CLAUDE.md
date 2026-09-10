# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workflow

- Work autonomously to fulfill requested features.
- Create, modify, and delete files as necessary.
- **DO NOT** ask for permission for file edits or running bash commands.
- **ONLY** ask for input when you are ready to `git add` / `git commit`, or if a build/lint fails persistently.

### Commit Behavior

- After implementing a cohesive piece of logic, pause.
- Propose a `git commit` message and list the files to be staged.
- Wait for user approval before executing `git add` and `git commit`.

### Verification

- There is **no test runner configured** in this repo (no `npm test`, no Jest/Vitest setup). Do not invent test commands.
- Before committing, verify with `npm run build` (Vite type/parse errors will surface there) and manually exercise the affected feature in `npm run dev`.
- If you get stuck, present the code for review.

## Project Overview

Eletypes is a typing-test web app built with **React 18 + Vite**. Kiosk mode's same-day leaderboard, practice history, and settings live in `localStorage` — no backend for those. The one exception: the Kiosk/Local History sentence bank lives in a shared Cloudflare D1 database, edited through the Cloudflare Access-gated `/admin` page. Reads (`GET /api/content-sources`) and writes (`/admin/api/content-sources`) are split across two paths on purpose — see "Content Sources API" below, `docs/ACCESS.md`, and `src/constants/LOCAL_HISTORY_GUIDE.md`.

Source files use `.jsx` extension (not `.js`) for React components.

## Commands

- **Dev server:** `npm run dev` or `npm start` — Vite on `localhost:3000`, auto-opens browser
- **Build:** `npm run build` — outputs to `build/` (note: not the Vite default `dist/`)
- **Preview:** `npm run preview` — serve production build locally
- **Deploy:** `npm run deploy` — runs build (no separate Firebase step despite the name; Firebase deploy is invoked manually or via CI)

## Architecture

### Routing & Entry Points

- `src/index.jsx` is the entry point — wraps everything in `BrowserRouter` and registers three routes:
  - `/kiosk` → `src/pages/KioskPage.jsx` (walk-up event kiosk — see its own section below)
  - `/admin` → `src/pages/AdminPage.jsx` (Content Sources editor, gated by Cloudflare Access — see its own section below)
  - `/*` → `src/App.jsx` (the regular typing test)
- `App.jsx` conditionally renders the active mode based on local-persist state (`gameMode`: word/sentence/local-history, `isTrainerMode`). No custom word lists, no coffee/music/focused/ultra-zen modes — those were part of the upstream fork and were stripped out; see git history if any need resurrecting.
- `DefaultKeyboard` (the QWERTY trainer) is loaded with `React.lazy` + `Suspense`.

### State Management

No Redux, no app-level Context for state (Context is used only for locale/i18n).
- `useLocalPersistState` (`src/hooks/useLocalPersistState.js`) — `useState` + `useEffect` that syncs to `localStorage`. This is the canonical pattern for any user preference (sound, mode toggles, etc.). Always use this hook rather than reading/writing `localStorage` directly when adding a new persisted preference.

### Game Modes (under `src/components/features/`)

- **TypeBox/TypeBox.jsx** — word-typing mode (~1000 lines). Owns the countdown timer, WPM math, error tracking, pacing styles (pulse/caret via `SmoothCaret.jsx` in `EnglishModeWords.jsx`), and history. Always draws from the built-in random word list — no custom word list UI. The biggest, most fragile file in the codebase — read carefully before changing.
- **SentenceBox/** — sentence-typing mode, separate stats pipeline. Takes a `contentSource` prop (`"general"` | `"local"`) — general mode uses `sentencesGenerator` (the built-in English sentence bank); local mode uses `localHistorySentencesGenerator` against the live Content Sources API (see below), which is what backs the app's "local history" mode.
- **Keyboard/DefaultKeyboard.jsx** — QWERTY touch-typing trainer.
- **Kiosk/** — supports `KioskPage.jsx`: `TapMode.jsx` (simplified key-mashing game, an alternative to the sentence-typing challenge) and `CustomizeKioskModal.jsx` (staff-facing settings: content sources, word/sentence mode, session length, pacing style).
- **sound/**, **CapsLockSnackbar.jsx** — supporting features.

### Web Workers

Offloaded heavy work lives in `src/worker/`:
- `calculateWpmWorker.js` / `calculateRawWpmWorker.js` — WPM formulas
- `trackCharsErrorsWorker.js` / `trackHistoryWorker.js` — error and history tracking

Instantiated in `TypeBox` via `new Worker(new URL("../../../worker/...", import.meta.url))`. Keep that URL form — it's what Vite's worker bundling relies on.

### Services Layer (`src/services/`)

Mostly thin wrappers around browser APIs (`localStorage`), with one exception:
- `leaderboard.js` — Kiosk mode's same-day high score board (read/submit WPM scores), `localStorage`
- `kioskSettings.js` — Kiosk's staff-configurable settings (content sources, mode, session length, pacing style), `localStorage`
- `chime.js` — the Web Audio-synthesized "time's up" cue for Kiosk mode and Tap Mode (no shipped sound file)
- `contentAdmin.js` — the one real backend client in the app: reads/writes the Kiosk/Local History sentence bank via the Content Sources API (Cloudflare D1 — see "Content Sources & /admin" below), falling back to the shipped `LocalHistorySentences.json` only if the read fetch fails

### i18n

Custom, lightweight — no `i18next`.
- `src/context/LocaleContext.jsx` — provider + `useLocale()` hook
- `src/translations/translations.js` — English only (the Chinese dictionary that shipped with the upstream fork was removed along with the features it labeled)

`index.jsx`'s `App` route is wrapped in `LocaleProvider`; `KioskPage` and `AdminPage` don't use it — their copy is all hardcoded English.

### Theming

A single fixed dark theme (`src/style/theme.js`, `defaultTheme`) built on BTECH's own brand tokens — no theme picker, no per-user theme choice. Applied via styled-components `ThemeProvider`. Global styles in `src/style/global.js`. Kiosk mode and `/admin` don't use this theme system at all — they style directly against the vendored Iterverse design tokens (`src/assets/iterverse/tokens.css`) instead, with a dark-mode override layered on via each page's own `createGlobalStyle` block.

### Styling

Material-UI (`@mui/material` + `@mui/icons-material`) for primitive UI in the main app, **styled-components** for everything custom (including all of Kiosk mode and `/admin`, which use no MUI at all). No Tailwind, no CSS modules. Emotion is present only because MUI requires it.

### Word / Sentence Generation

`src/scripts/` contains generators that consume datasets in `src/constants/` (`WordsMostCommon.js`, `SentencesCollection.js`, `DictionaryConstants.js`). `localHistorySentencesGenerator.js` is the odd one out — it takes the live Content Sources list as a parameter rather than importing a static dataset (see below). Challenge links use `seedrandom` via `src/scripts/seedUtils.js` for deterministic shuffles.

### Kiosk Mode (`/kiosk`)

A no-login, standalone page for walk-up use at events — see `src/pages/KioskPage.jsx`'s own header comment and `src/constants/LOCAL_HISTORY_GUIDE.md`. Two view modes toggled from its banner: the sentence-typing challenge (continuous flow, no per-sentence pause, gated behind the visitor's first keystroke) and Tap Mode (`components/features/Kiosk/TapMode.jsx`, a lighter key-mashing game). Staff configure it via `CustomizeKioskModal.jsx`, persisted through `kioskSettings.js`.

### Content Sources & `/admin`

The Kiosk/Local History sentence bank is the one piece of this app with a real backend: a Cloudflare D1 database, fronted by Pages Functions under `functions/`. **Reads and writes are deliberately split across two paths** — Cloudflare Access gates by path, not HTTP method, so a public read and a staff-only write can't share one path through Access alone:
- `GET /api/content-sources` (`functions/api/content-sources/index.js`) — public, no Access Application covers it. Kiosk mode and Local History mode fetch this directly.
- `/admin/api/content-sources` (`functions/admin/api/content-sources/`) — add/edit/delete, nested under `/admin` so it inherits that path's existing Access gate for free rather than needing its own Access Application.

`src/pages/AdminPage.jsx` is the editor UI; real authentication happens before it ever loads, via `functions/admin/_middleware.js` verifying a Cloudflare Access JWT (see `docs/ACCESS.md` and `functions/_utils/access.js` — the same platform-auth pattern copied from `ad_labs/platform-auth/access.ts` that every other Iterverse product uses). `src/scripts/contentValidation.js` holds the content-safety rules shared between the in-browser editor and the commit-time `npm run check-content` script, so the two can't drift apart.

Schema lives in `migrations/` (plain numbered `.sql` files, same convention as `btech-ticketing`). Add a new migration and apply it with `npx wrangler d1 migrations apply iterverse-type-content --remote` (omit `--remote` to apply to a local dev copy instead, though that's rarely useful here since `npm run dev` doesn't run Pages Functions at all — see `docs/ACCESS.md`'s "Local development" section). `wrangler.toml`'s `[[d1_databases]]` binding is `DB`, so Functions read/write it via `env.DB.prepare(...)`.

### PWA

`vite-plugin-pwa` is configured in `vite.config.js` with `registerType: "autoUpdate"` and a Workbox glob that caches JS/CSS/HTML/PNG/WAV/JSON up to 5 MB per file. Service worker is generated at build time — changes to caching strategy belong in `vite.config.js`.

**`navigateFallbackDenylist` must cover any path that needs a real network round-trip, not a cached response** — currently `/admin` and `/cdn-cgi/` (Cloudflare Access's own login/logout endpoints). The generated service worker's `NavigationRoute` serves the cached app shell for any unmatched navigation entirely client-side, before a request ever reaches the network — which silently defeats path-based Cloudflare Access gating (a gated page loads from cache with no login prompt) and breaks the Access login callback itself (it never gets Cloudflare's real redirect + cookie-setting response). Both were real, live bugs before this exclusion was added. If you add another Access-gated route, add it here too.

### Keyboard Shortcuts

- **Tab + Space** — Redo current test
- **Tab + Enter** — Restart with new words

These are handled in `TypeBox.jsx` (and the equivalent for SentenceBox). If you add new global shortcuts, document them here.
