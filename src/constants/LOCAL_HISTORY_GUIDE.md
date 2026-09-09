# Local History Content Guide

This pack (`src/assets/Vocab/LocalHistorySentences.json`, exposed as
`LOCAL_HISTORY_SENTENCES` via `src/constants/LocalHistorySentences.js`) feeds
**Kiosk mode** (`/kiosk`) and the main app's **Local History** typing mode.
It's meant for kids and community members walking up with no context, so
content needs to be short, factual, and appropriate for all ages.

An instructor can also add, edit, or remove entries at runtime — without
touching code — through the Cloudflare Access-gated editor at `/admin`
(see `docs/ACCESS.md` and its own in-page notice for how those edits are
scoped). Editing the JSON directly, as below, is still how content
actually ships to everyone.

## Adding a new sentence

Open `src/assets/Vocab/LocalHistorySentences.json` and add another object to
the array:

```json
{ "topic": "Cache Valley", "text": "Your new sentence here." }
```

That's it — no other file needs to change. `topic` is free text; use an
existing one (`"Bridgerland Technical College"`, `"Cache Valley"`,
`"Box Elder County"`, `"Utah"`) or introduce a new one if the sentence covers
a different local topic.

## Style rules

- One factual, verifiable sentence per entry — cite a source in your PR/commit
  description if the fact isn't common knowledge.
- Keep it to roughly 40–140 characters (checker allows 10–220).
- Family-friendly and neutral in tone — no profanity, violence, sexual
  content, drugs/alcohol, or political commentary.
- No promotional language, pricing, or calls to action (this isn't an ad).
- No personal contact info: no phone numbers, emails, URLs, or addresses.
- Avoid naming private living individuals; public historical figures are fine.
- Plain punctuation only (periods, commas) — avoid curly quotes/apostrophes,
  since the typing test matches characters exactly and smart quotes typed on
  a physical keyboard won't match straight ones.

## Before committing

Run the automated checker — it scans for a heuristic list of flagged words,
URLs, emails, phone numbers, and length bounds:

```bash
npm run check-content
```

It's a heuristic aid, not a guarantee: it can both miss things (sarcasm,
context-dependent issues) and flag harmless text (e.g. a sentence mentioning
a historical "gun" battle). Always read new entries aloud yourself before
committing, and use judgment on any flagged line rather than blindly
rewording to dodge the checker.

To check a different file with the same rules (e.g. a future new pack), pass
its path: `npm run check-content -- src/assets/Vocab/SomeOtherPack.json`.
