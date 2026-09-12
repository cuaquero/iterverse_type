<div align="center">
  <img src="src/assets/iterverse/mark.svg" width="96px" height="96px" alt="Iterverse logo" />
</div>

<h1 align="center">Iterverse Type</h1>

<h3 align="center">
  A typing test for Bridgerland Technical College's classrooms and events
</h3>

Practice typing, or run it as a no-login kiosk station at a BTECH event:
type on the giant keyboard, see your words-per-minute, and learn a fact
about BTECH, Cache Valley, Box Elder County, or Utah while you're at it.
Visitors who'd rather not read sentences (young kids, students with
special needs, or anyone just passing by) get their own simplified,
always-encouraging Tap Mode.

It's part of **Iterverse**, BTECH IT's umbrella platform alongside
[Reader](https://github.com/cuaquero/iterverse_reader),
[Hub](https://github.com/cuaquero/iterverse_hub),
[Labs](https://github.com/cuaquero/iterverse_labs),
[Simulations](https://github.com/cuaquero/iterverse_simulations),
[Terminal](https://github.com/cuaquero/iterverse_terminal),
[Packets](https://github.com/cuaquero/iterverse_packets),
[Scripts](https://github.com/cuaquero/iterverse_scripts), and
[HelpDesk](https://github.com/cuaquero/iterverse_helpdesk). See
`iterverse_labs`'s `design-system/` for the shared brand tokens and
Iterverse mark every product draws from (copied locally into
`src/assets/iterverse/`, per the family convention of no shared build
across projects).

## What's here

A React 18 + Vite single-page app with no accounts. Practice history,
themes, and Kiosk mode's daily leaderboard live in the browser's
`localStorage` and never leave the device. The one exception is the
Kiosk/Local History sentence bank, which lives in a small shared
Cloudflare D1 database (see "Content administration" below) so an
instructor's edit through `/admin` applies everywhere immediately.

This app has intentionally stayed narrow in scope: it's a typing-practice
tool and an event kiosk, not a general-purpose platform. Features that
drifted outside that (a 3D keyboard designer, a markdown editor, user
accounts, badges/stats history, vocab flashcard decks, Chinese Pinyin
practice content, social share buttons, third-party widgets) have been
removed. See git history if you need to resurrect any of it.

## Modes

- **Typing test**: word, sentence, and local-history modes, timed or
  untimed, pacing styles (pulse/caret). Word mode always draws from the
  built-in random word list. Local History mode reuses Kiosk's own
  BTECH/Cache Valley/Box Elder County/Utah sentence pack.
- **QWERTY trainer**: guided touch-typing practice on an on-screen
  keyboard.
- **Kiosk mode** (`/kiosk`): a no-login typing test for walk-up use at
  events, styled and paced identically to the regular sentence-typing
  view (same caret indicator, same correct/error color scheme), using a
  local-history sentence pack about BTECH, Cache Valley, Box Elder
  County, and Utah. See
  [`src/constants/LOCAL_HISTORY_GUIDE.md`](src/constants/LOCAL_HISTORY_GUIDE.md)
  for how to add more sentences and how new content gets checked before
  it ships. Includes a same-day, arcade-style leaderboard (3-letter
  initials, resets daily) shown right on the kiosk screen. Obvious
  profanity is rejected outright, and long-pressing "Today's Top Typists"
  reveals a delete button per row for anything that slips past.
- **Tap Mode** (toggle from the Kiosk banner): repurposes the QWERTY
  trainer's press-the-highlighted-key mechanic into a simple round
  (staff-configurable 15s/30s/60s from Customize Kiosk Session) for
  visitors who'd rather not read sentences (young kids, students with
  special needs, or anyone just passing by): no sentences to read, no
  leaderboard, a shower of letters on every correct press, and it always
  ends on an encouraging note regardless of how it went.

Plus: a single fixed dark theme built on BTECH's own brand tokens (no
theme picker), typing sounds, and PWA install support.

## Content administration

`/admin` (reachable from a small icon at the top of the main page) is an
editor for the local-history sentence pack that backs Kiosk mode and Local
History mode. It sits behind **Cloudflare Access** — the same
platform-auth pattern every other Iterverse product uses (see
[`docs/ACCESS.md`](docs/ACCESS.md) for the Zero Trust setup and
`functions/admin/`/`functions/_utils/access.js` for the verification code).
Signing in is real staff SSO, not an app-level password.

Once signed in, edits go straight to the shared content store (Cloudflare
D1). Reads and writes are deliberately split across two paths, since
Cloudflare Access gates by path rather than HTTP method: `GET
/api/content-sources` is public (no Access Application covers it) so
Kiosk and Local History mode can read it with no login, while
add/edit/delete live at `/admin/api/content-sources` and inherit the same
Access gate as the `/admin` page itself. Edits apply everywhere
immediately, with no code change or deploy ever needed.
`src/assets/Vocab/LocalHistorySentences.json` still ships in the build as
an offline fallback if the read fetch ever fails, but it's not the source
of truth anymore.

## Local development

```bash
npm install
npm run dev      # localhost:3000
npm run build    # production bundle to build/
npm run preview  # serve the production bundle locally
```

## Content safety

Any public-facing sentence/word pack (like the Kiosk mode local-history
pack) should be checked before committing:

```bash
npm run check-content
```

See [`src/constants/LOCAL_HISTORY_GUIDE.md`](src/constants/LOCAL_HISTORY_GUIDE.md)
for the full review checklist. The script is a heuristic aid, not a
substitute for reading new content yourself.

## Deployment

Live at **type.iterverse.net**, deployed on **Cloudflare Pages** (build
command `npm run build`, build output directory `build/`) via `npx
wrangler pages deploy build --project-name=iterverse-type`, which also
picks up `functions/` (the Content Sources API and Access verification)
and `wrangler.toml`'s D1 binding and Access vars automatically.
`public/_redirects` carries the SPA-fallback rewrite Pages needs for
client-side routes like `/kiosk` and `/admin`.

## License

[GPL-3.0](LICENSE).
