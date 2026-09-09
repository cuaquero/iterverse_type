// Client-side gateway to the shared Content Sources store
// (functions/api/content-sources, backed by Cloudflare D1 — see
// migrations/). This is the single source of truth for Kiosk mode and
// Local History mode's sentence bank: an instructor's edit through
// /admin applies everywhere immediately, no per-device state and no code
// change or deploy needed. Falls back to the shipped JSON (LocalHistory
// Sentences.js) only if the fetch itself fails (offline, cold start) so
// a visitor never sees an empty pool.
import { LOCAL_HISTORY_SENTENCES } from "../constants/LocalHistorySentences";

const API_BASE = "/api/content-sources";

export const fetchContentSources = async () => {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const { sources } = await res.json();
    if (!Array.isArray(sources) || sources.length === 0) throw new Error("empty response");
    return sources;
  } catch {
    return LOCAL_HISTORY_SENTENCES;
  }
};

export const addSentence = async (topic, text) => {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ topic, text }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Save failed (${res.status})`);
  }
  return res.json();
};

export const editSentence = async (id, topic, text) => {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ topic, text }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Save failed (${res.status})`);
  }
  return res.json();
};

export const deleteSentence = async (id) => {
  const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete failed (${res.status})`);
  return res.json();
};
