#!/usr/bin/env node
// Heuristic content check for public-facing sentence/word banks (e.g. the
// Kiosk mode local-history pack). Run before committing new content:
//   npm run check-content
//   npm run check-content -- path/to/other-file.json
//
// This is an aid, not a substitute for a human read-through — see
// src/constants/LOCAL_HISTORY_GUIDE.md for the review checklist.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { BANNED_WORD_PATTERN } from "../src/constants/bannedWords.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_TARGET = path.join(
  __dirname,
  "..",
  "src",
  "assets",
  "Vocab",
  "LocalHistorySentences.json"
);

const MIN_LENGTH = 10;
const MAX_LENGTH = 220;

const URL_PATTERN = /\bhttps?:\/\/|www\./i;
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const PHONE_PATTERN = /\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/;

function checkEntry(entry, index) {
  const problems = [];
  const text = typeof entry === "string" ? entry : entry?.text;

  if (typeof text !== "string" || text.trim().length === 0) {
    problems.push("missing or empty `text`");
    return problems;
  }
  if (typeof entry === "object" && (typeof entry.topic !== "string" || entry.topic.trim().length === 0)) {
    problems.push("missing or empty `topic`");
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

function main() {
  const targetPath = process.argv[2]
    ? path.resolve(process.cwd(), process.argv[2])
    : DEFAULT_TARGET;

  let raw;
  try {
    raw = readFileSync(targetPath, "utf-8");
  } catch (err) {
    console.error(`Could not read ${targetPath}: ${err.message}`);
    process.exit(1);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    console.error(`Invalid JSON in ${targetPath}: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(data)) {
    console.error(`Expected ${targetPath} to contain a JSON array.`);
    process.exit(1);
  }

  let violationCount = 0;
  data.forEach((entry, index) => {
    const problems = checkEntry(entry, index);
    if (problems.length > 0) {
      violationCount += 1;
      const preview = typeof entry === "string" ? entry : entry?.text;
      console.error(`[entry ${index}] "${preview}"`);
      problems.forEach((p) => console.error(`  - ${p}`));
    }
  });

  console.log(`Checked ${data.length} entries in ${path.relative(process.cwd(), targetPath)}.`);
  if (violationCount > 0) {
    console.error(`${violationCount} entr${violationCount === 1 ? "y" : "ies"} flagged. Fix or confirm these are false positives before committing.`);
    process.exit(1);
  }
  console.log("No issues found by the automated check. Still give it a human read-through before committing.");
}

main();
