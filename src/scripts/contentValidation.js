// Shared content-safety rules for public-facing sentence/word banks (the
// Kiosk mode local-history pack, and anything an instructor adds through
// the /admin content editor). Used by both scripts/checkLocalContent.mjs
// (Node, checked at commit time) and the browser-side admin editor, so the
// two never drift apart — see src/constants/LOCAL_HISTORY_GUIDE.md for the
// full review checklist this backs.
import { BANNED_WORD_PATTERN } from "../constants/bannedWords.js";

export const MIN_LENGTH = 10;
export const MAX_LENGTH = 220;

const URL_PATTERN = /\bhttps?:\/\/|www\./i;
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_PATTERN = /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/;

// Returns a list of human-readable problems with `text` (and, if provided,
// `topic`) — empty array means it passed every automated check. Still a
// heuristic aid, not a substitute for a human read-through.
export function checkEntryText(text, topic) {
  const problems = [];

  if (typeof text !== "string" || text.trim().length === 0) {
    problems.push("missing or empty text");
    return problems;
  }
  if (topic !== undefined && (typeof topic !== "string" || topic.trim().length === 0)) {
    problems.push("missing or empty topic");
  }
  if (text.length < MIN_LENGTH) {
    problems.push(`too short (${text.length} chars, minimum ${MIN_LENGTH})`);
  }
  if (text.length > MAX_LENGTH) {
    problems.push(`too long (${text.length} chars, maximum ${MAX_LENGTH})`);
  }

  const bannedMatch = text.match(BANNED_WORD_PATTERN);
  if (bannedMatch) {
    problems.push(`contains a flagged word: "${bannedMatch[0]}"`);
  }
  if (URL_PATTERN.test(text)) {
    problems.push("contains a URL");
  }
  if (EMAIL_PATTERN.test(text)) {
    problems.push("contains an email address");
  }
  if (PHONE_PATTERN.test(text)) {
    problems.push("contains a phone number");
  }

  return problems;
}
