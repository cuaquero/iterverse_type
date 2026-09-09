// Backs the /admin content editor. Who can reach this editor at all is
// Cloudflare Access's job (functions/admin/_middleware.js, docs/ACCESS.md)
// — this file only handles what the content itself looks like once
// they're in. There's still no backend for the content (see CLAUDE.md):
// an instructor's edits are stored as an override layered on top of the
// shipped LocalHistorySentences.json, scoped to whatever browser/device
// they're using, exactly like Kiosk's own settings and leaderboard.
import LOCAL_HISTORY_SENTENCES_BASE from "../assets/Vocab/LocalHistorySentences.json";

const OVERRIDES_KEY = "admin-content-overrides";

const EMPTY_OVERRIDES = { edits: {}, deletes: [], additions: [] };

const readOverrides = () => {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    if (!raw) return { ...EMPTY_OVERRIDES };
    const parsed = JSON.parse(raw);
    return { ...EMPTY_OVERRIDES, ...parsed };
  } catch {
    return { ...EMPTY_OVERRIDES };
  }
};

const writeOverrides = (overrides) => {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
};

const generateId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// The shipped JSON has no ids of its own, so each entry gets a stable
// "base-<index>" id (positional — fine as long as edits/deletes are only
// ever resolved against this same build's array) that edits and deletes
// key against; instructor-added entries carry their own generated id.
export const getEffectiveSentences = () => {
  const overrides = readOverrides();
  const base = LOCAL_HISTORY_SENTENCES_BASE.map((e, i) => ({
    id: `base-${i}`,
    topic: e.topic,
    text: e.text,
  }));
  const merged = base
    .filter((e) => !overrides.deletes.includes(e.id))
    .map((e) => (overrides.edits[e.id] ? { ...e, ...overrides.edits[e.id] } : e));
  const additions = overrides.additions.filter((e) => !overrides.deletes.includes(e.id));
  return [...merged, ...additions];
};

export const addSentence = (topic, text) => {
  const overrides = readOverrides();
  overrides.additions.push({ id: generateId(), topic, text });
  writeOverrides(overrides);
};

export const editSentence = (id, topic, text) => {
  const overrides = readOverrides();
  if (id.startsWith("base-")) {
    overrides.edits[id] = { topic, text };
  } else {
    overrides.additions = overrides.additions.map((a) =>
      a.id === id ? { ...a, topic, text } : a
    );
  }
  writeOverrides(overrides);
};

export const deleteSentence = (id) => {
  const overrides = readOverrides();
  if (id.startsWith("base-")) {
    if (!overrides.deletes.includes(id)) overrides.deletes.push(id);
    delete overrides.edits[id];
  } else {
    overrides.additions = overrides.additions.filter((a) => a.id !== id);
  }
  writeOverrides(overrides);
};

export const hasOverrides = () => {
  const o = readOverrides();
  return Object.keys(o.edits).length > 0 || o.deletes.length > 0 || o.additions.length > 0;
};

// Reverts every edit/delete/addition on this device — the shipped content
// pack becomes live again exactly as it ships in the repo.
export const resetOverrides = () => {
  localStorage.removeItem(OVERRIDES_KEY);
};
