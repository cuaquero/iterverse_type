// Backs the /admin content editor. There's no backend (see CLAUDE.md) —
// an instructor's edits are stored as an override layered on top of the
// shipped LocalHistorySentences.json, scoped to whatever browser/device
// they're using, exactly like Kiosk's own settings and leaderboard. The
// passcode gate is a light deterrent against casual tampering on a public
// kiosk, not real security: the check runs entirely client-side, so anyone
// determined enough to read the bundle can bypass it.
import LOCAL_HISTORY_SENTENCES_BASE from "../assets/Vocab/LocalHistorySentences.json";

const PASSCODE_KEY = "admin-passcode";
const AUTH_KEY = "admin-authenticated";
const OVERRIDES_KEY = "admin-content-overrides";

export const DEFAULT_PASSCODE = "bridgerland";

const EMPTY_OVERRIDES = { edits: {}, deletes: [], additions: [] };

export const getPasscode = () => {
  try {
    return localStorage.getItem(PASSCODE_KEY) || DEFAULT_PASSCODE;
  } catch {
    return DEFAULT_PASSCODE;
  }
};

export const setPasscode = (newPasscode) => {
  localStorage.setItem(PASSCODE_KEY, newPasscode);
};

export const isAuthenticated = () => {
  try {
    return sessionStorage.getItem(AUTH_KEY) === "true";
  } catch {
    return false;
  }
};

// Returns true/false rather than throwing so the login form can just show
// an inline error on a wrong passcode.
export const login = (input) => {
  if (input !== getPasscode()) return false;
  sessionStorage.setItem(AUTH_KEY, "true");
  return true;
};

export const logout = () => {
  sessionStorage.removeItem(AUTH_KEY);
};

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
