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
import { checkEntryText } from "../src/scripts/contentValidation.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_TARGET = path.join(
  __dirname,
  "..",
  "src",
  "assets",
  "Vocab",
  "LocalHistorySentences.json"
);

function checkEntry(entry) {
  if (typeof entry === "string") {
    return checkEntryText(entry);
  }
  // Object entries always carry a topic check (empty string still trips
  // checkEntryText's "missing or empty topic" problem); plain-string
  // entries have no topic concept at all, so that check is skipped above.
  return checkEntryText(entry?.text, entry?.topic ?? "");
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
