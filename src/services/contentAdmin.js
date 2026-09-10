// Client-side gateway to the shared Content Sources store, backed by
// Cloudflare D1 (see migrations/). This is the single source of truth for
// Kiosk mode and Local History mode's sentence bank: an instructor's edit
// through /admin applies everywhere immediately, no per-device state and
// no code change or deploy needed. Falls back to the shipped JSON
// (LocalHistorySentences.js) only if the read fetch itself fails (offline,
// cold start) so a visitor never sees an empty pool.
//
// Reads and writes deliberately hit different paths. Cloudflare Access
// gates by path, not HTTP method, so a public GET and a staff-only write
// can't share one path through Access alone - reads stay at
// /api/content-sources (functions/api/content-sources/, no Access
// Application covers it, genuinely public), writes go to
// /admin/api/content-sources (functions/admin/api/content-sources/),
// inheriting the existing /admin* Access gate for free.
import { LOCAL_HISTORY_SENTENCES } from "../constants/LocalHistorySentences";

const READ_BASE = "/api/content-sources";
const WRITE_BASE = "/admin/api/content-sources";

export const fetchContentSources = async () => {
  try {
    const res = await fetch(READ_BASE);
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const { sources } = await res.json();
    if (!Array.isArray(sources) || sources.length === 0) throw new Error("empty response");
    return sources;
  } catch {
    return LOCAL_HISTORY_SENTENCES;
  }
};

export const addSentence = async (topic, text) => {
  const res = await fetch(WRITE_BASE, {
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
  const res = await fetch(`${WRITE_BASE}/${encodeURIComponent(id)}`, {
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
  const res = await fetch(`${WRITE_BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete failed (${res.status})`);
  return res.json();
};
