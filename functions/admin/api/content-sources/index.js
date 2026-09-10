// Write side of the Content Sources store. Lives under /admin/ on purpose:
// Cloudflare Access gates by path, not HTTP method, so there's no way to
// have a public GET and a gated POST on the exact same path via the Access
// Application alone - putting writes under the /admin* prefix means they
// inherit the same Access Application (and its already-verified JWT check
// in functions/admin/_middleware.js) for free, no separate Application or
// AUD var needed. The public read side stays at /api/content-sources
// (functions/api/content-sources/index.js), a path no Access Application
// covers at all.
import { jsonResponse } from "../../../_utils/json.js";
import { isSameOriginRequest } from "../../../_utils/csrf.js";
import { checkEntryText } from "../../../../src/scripts/contentValidation.js";

export async function onRequestPost({ request, env }) {
  if (!isSameOriginRequest(request)) return jsonResponse({ error: "Forbidden" }, 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const problems = checkEntryText(text, topic);
  if (problems.length > 0) {
    return jsonResponse({ error: "Failed content checks", problems }, 400);
  }

  const id = crypto.randomUUID();
  await env.DB
    .prepare("INSERT INTO content_sources (id, topic, text) VALUES (?, ?, ?)")
    .bind(id, topic, text)
    .run();

  return jsonResponse({ id, topic, text }, 201);
}
