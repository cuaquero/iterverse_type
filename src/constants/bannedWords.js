// Heuristic list of terms that should never appear in public-facing content
// — sentence/word bank entries (see scripts/checkLocalContent.mjs) or
// user-submitted text (see the Kiosk leaderboard name check). Not
// exhaustive — extend it if something slips past. Plain data, no Node or
// browser-specific APIs, so both a Node script and browser code can import
// it directly.
export const BANNED_WORDS = [
  "damn", "hell", "crap", "ass", "asshole", "bastard", "bitch", "bullshit",
  "shit", "fuck", "fucking", "fucker", "motherfucker", "dick", "cock",
  "pussy", "cunt", "whore", "slut", "nigger", "nigga", "faggot", "retard",
  "retarded", "spic", "chink", "kike", "tranny", "porn", "sex", "sexy",
  "nude", "naked", "orgasm", "masturbate", "rape", "molest", "kill", "murder",
  "suicide", "terrorist", "bomb", "gun", "shoot", "shooting", "nazi", "hitler",
  "kkk", "cocaine", "heroin", "meth", "marijuana", "weed", "drunk", "alcohol",
  "beer", "vodka", "cigarette", "vape",
];

export const BANNED_WORD_PATTERN = new RegExp(
  `\\b(${BANNED_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "i"
);
