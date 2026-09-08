<div align="center">
  <img src="src/assets/iterverse/mark.svg" width="96px" height="96px" alt="Iterverse logo" />
</div>

<h1 align="center">Iterverse Type</h1>

<h3 align="center">
  A typing test for Bridgerland Technical College's classrooms and events
</h3>

Practice typing, or run it as a no-login kiosk station at a BTECH event —
type on the giant keyboard, see your words-per-minute, learn a fact about
BTECH, Cache Valley, Box Elder County, or Utah while you're at it.

It's part of **Iterverse**, BTECH IT's umbrella platform alongside
[Reader](https://github.com/cuaquero/iterverse_reader),
[Hub](https://github.com/cuaquero/iterverse_hub),
[Labs](https://github.com/cuaquero/iterverse_labs),
[Simulations](https://github.com/cuaquero/iterverse_simulations),
[CLI](https://github.com/cuaquero/iterverse_cli),
[Packets](https://github.com/cuaquero/iterverse_packets),
[Scripts](https://github.com/cuaquero/iterverse_scripts), and
[HelpDesk](https://github.com/cuaquero/iterverse_helpdesk) — see
`iterverse_labs`'s `design-system/` for the shared brand tokens and
Iterverse mark every product draws from (copied locally into
`src/assets/iterverse/`, per the family convention of no shared build
across projects).

## What's here

A React 18 + Vite single-page app with no backend of its own — the only
external service it talks to is an optional Supabase-backed leaderboard,
which degrades gracefully to "no leaderboard" if unconfigured. Everything
else (practice history, themes, custom word lists) lives in the browser's
`localStorage`.

## Modes

- **Typing test** — English & Chinese (Pinyin), word and sentence modes,
  timed or untimed, pacing styles, custom word lists
- **Kiosk mode** (`/kiosk`) — a stripped-down, no-login typing test for
  walk-up use at events, using a local-history sentence pack about BTECH,
  Cache Valley, Box Elder County, and Utah. See
  [`src/constants/LOCAL_HISTORY_GUIDE.md`](src/constants/LOCAL_HISTORY_GUIDE.md)
  for how to add more sentences and how new content gets checked before
  it ships.
- **QWERTY trainer** — guided touch-typing practice
- **Keyboard Lab** (`/keyboardlab`, beta) — design custom 3D keyboards in
  the browser. See
  [`src/components/features/KeyboardLab/KEYBOARD_LAB.md`](src/components/features/KeyboardLab/KEYBOARD_LAB.md).
- **Markdown editor** (`/markdown`) — live preview, syntax highlighting
- **Vocab cards** — GRE/TOEFL/CET4/CET6 flashcard decks *(under review —
  see Known housekeeping below)*

Plus: a no-signup leaderboard, badges/ranks, stats and session history,
custom themes, and challenge links (share a deterministic seeded test).

## Local development

```bash
npm install
npm run dev      # localhost:3000
npm run build    # production bundle to build/
npm run preview  # serve the production bundle locally
```

Copy `.env.example` to `.env` and fill in `SUPABASE_URL`/`SUPABASE_ANON_KEY`
to enable the leaderboard locally (see `src/services/supabase.js`).

## Content safety

Any public-facing sentence/word pack (like the Kiosk mode local-history
pack) should be checked before committing:

```bash
npm run check-content
```

See [`src/constants/LOCAL_HISTORY_GUIDE.md`](src/constants/LOCAL_HISTORY_GUIDE.md)
for the full review checklist — the script is a heuristic aid, not a
substitute for reading new content yourself.

## Deployment

Deployed on **Cloudflare Pages** (build command `npm run build`, build
output directory `build/`). `public/_redirects` already carries the
SPA-fallback rewrite Pages needs for the client-side routes
(`/keyboardlab`, `/markdown`, `/kiosk`). Set `SUPABASE_URL` and
`SUPABASE_ANON_KEY` as Pages build-time environment variables to enable
the leaderboard in production.

## Known housekeeping

- Vocab cards (GRE/TOEFL/CET4/CET6 decks) are under review for removal —
  they're test-prep flashcards, not obviously in scope for this project.
- All outbound links to third-party websites (donation links, social
  share buttons, Discord/GitHub widgets, an embedded Spotify player, a
  third-party survey form) have been removed to keep this a clean,
  ad-free tool appropriate for a school kiosk.

## License

[GPL-3.0](LICENSE).
