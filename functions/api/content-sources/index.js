// Public read side of the Content Sources store (see migrations/
// 0001_init.sql) - Kiosk mode and Local History mode fetch this with no
// login. Deliberately not under /admin/ or gated by any Access
// Application: Cloudflare Access gates by path, not HTTP method, so a
// public GET and a staff-only write can't share one path through Access
// alone. Writes live at /admin/api/content-sources instead (functions/
// admin/api/content-sources/), inheriting that path's existing Access
// gate for free.
import { jsonResponse } from "../../_utils/json.js";

export async function onRequestGet({ env }) {
  const { results } = await env.DB
    .prepare("SELECT id, topic, text FROM content_sources ORDER BY topic, id")
    .all();
  return jsonResponse({ sources: results });
}
