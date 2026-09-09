import { ENGLISH_MODE } from "../constants/Constants";

export const CUSTOM_WORDS_KEY = "custom-word-lists";
export const CUSTOM_WORDS_ACTIVE_KEY = "custom-word-list-active";
export const CUSTOM_WORDS_PREFIX = "custom_words__";

export const CUSTOM_WORDS_MAX_TEXT = 20000;

// Mechanical-keyboard themed sample text. Used as one-click "fill with
// example" content in the editor — placeholder text isn't selectable, so a
// button that inserts this gives users a real starting point they can edit.
export const SAMPLE_WORDS_EN = `mechanical keyboard switch keycap layout hotswap
linear tactile clicky silent lube film foam
plate gasket stabilizer profile cherry topre
hhkb qmk via pcb gateron kailh akko
backlight rgb tenkeyless compact ergonomic custom`;

export const loadCustomWordLists = () => {
  try {
    const raw = window.localStorage.getItem(CUSTOM_WORDS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
};

export const saveCustomWordLists = (lists) => {
  window.localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(lists));
};

export const getActiveCustomListId = () => {
  try {
    const raw = window.localStorage.getItem(CUSTOM_WORDS_ACTIVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

export const setActiveCustomListId = (id) => {
  if (id == null) {
    window.localStorage.removeItem(CUSTOM_WORDS_ACTIVE_KEY);
  } else {
    window.localStorage.setItem(CUSTOM_WORDS_ACTIVE_KEY, JSON.stringify(id));
  }
};

const genId = () =>
  CUSTOM_WORDS_PREFIX +
  Date.now().toString(36) +
  Math.random().toString(36).slice(2, 8);

export const newCustomWordList = ({ name = "", language = ENGLISH_MODE, text = "" } = {}) => ({
  id: genId(),
  name,
  language,
  text,
  resolved: null,
});

// Resolve a list's text to [{key, val}] — whitespace-split, drop empty.
export const parseCustomWordsText = (record) => {
  if (!record) return [];
  const { text } = record;
  if (typeof text !== "string") return [];
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => ({ key: w, val: w }));
};

// Generate `count` words from the parsed list, preserving the user's typed
// order. The list loops back to entry 0 when exhausted so timed tests still
// run indefinitely. The `rng` arg is accepted but unused — order is fixed
// by the list itself, so seed/challenge-link reproducibility is automatic.
// eslint-disable-next-line no-unused-vars
export const customWordsGenerator = (parsed, count, rng) => {
  if (!Array.isArray(parsed) || parsed.length === 0) return [];
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(parsed[i % parsed.length]);
  }
  return out;
};

export const resolveActiveCustomList = (lists, activeId) => {
  if (!activeId || !Array.isArray(lists)) return null;
  return lists.find((l) => l.id === activeId) || null;
};

// ---------------------------------------------------------------------------
// Import / export
//
// File format: { format: "eletypes-word-lists", version: 1, lists: [...] }.
// Each list keeps name/language/text/resolved — we drop ids on export so two
// users sharing the same file don't end up with the same internal id. Import
// regenerates ids and de-dupes names against the user's existing lists.

const EXPORT_FORMAT = "eletypes-word-lists";
const EXPORT_VERSION = 1;

export const serializeWordListsForExport = (lists) => {
  const arr = Array.isArray(lists) ? lists : [lists];
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    lists: arr.map(({ name, language, text, resolved }) => ({
      name,
      language,
      text,
      resolved: resolved || null,
    })),
  };
};

export const exportWordListsToJsonString = (lists) =>
  JSON.stringify(serializeWordListsForExport(lists), null, 2);

const dedupeName = (name, existingNames) => {
  if (!existingNames.includes(name)) return name;
  let i = 2;
  while (existingNames.includes(`${name} (${i})`)) i++;
  return `${name} (${i})`;
};

// Parse a JSON string from an exported file. Throws on malformed input so the
// caller can show a friendly message. Returns an array of new list records
// with fresh ids and de-duped names.
export const parseImportedWordListsJson = (jsonString, existingLists = []) => {
  let data;
  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new Error("invalid_json");
  }
  // Two accepted shapes:
  //   1. { format, version, lists: [...] } (wrapped)
  //   2. raw array of records (legacy / hand-edited)
  const rawLists = Array.isArray(data)
    ? data
    : Array.isArray(data?.lists)
    ? data.lists
    : null;
  if (!rawLists) throw new Error("unknown_format");

  if (!Array.isArray(data) && data.format && data.format !== EXPORT_FORMAT) {
    throw new Error("unknown_format");
  }

  const existingNames = existingLists.map((l) => l.name);
  const out = [];
  for (const raw of rawLists) {
    if (!raw || typeof raw !== "object") continue;
    const language = ENGLISH_MODE;
    const text = typeof raw.text === "string" ? raw.text : "";
    const name = dedupeName(
      (typeof raw.name === "string" && raw.name.trim()) || "Imported list",
      [...existingNames, ...out.map((l) => l.name)]
    );
    const item = newCustomWordList({ name, language, text });
    if (Array.isArray(raw.resolved)) item.resolved = raw.resolved;
    out.push(item);
  }
  if (out.length === 0) throw new Error("no_lists");
  return out;
};

// Trigger a browser download for the given JSON string. Lives here rather
// than inline in the UI so it can be reused (e.g., single-list and bulk
// export both go through the same path).
export const downloadJsonFile = (filename, jsonString) => {
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const sanitizeFilename = (s) =>
  (s || "wordlist").replace(/[^\w一-龥-]+/g, "_").slice(0, 60);

export const buildExportFilename = (lists) => {
  const arr = Array.isArray(lists) ? lists : [lists];
  if (arr.length === 1) {
    return `eletypes-wordlist-${sanitizeFilename(arr[0].name)}.json`;
  }
  return `eletypes-wordlists-${arr.length}.json`;
};
