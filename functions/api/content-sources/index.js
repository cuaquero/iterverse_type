// Backs the Content Sources store (see migrations/0001_init.sql) - the
// shared replacement for the old per-device localStorage override.
// GET is public (Kiosk mode and Local History mode read this with no
// login); POST is gated by _middleware.js.
import { jsonResponse } from "../../_utils/json.js";
import { checkEntryText } from "../../../src/scripts/contentValidation.js";

export async function onRequestGet({ env }) {
  const { results } = await env.DB
    .prepare("SELECT id, topic, text FROM content_sources ORDER BY topic, id")
    .all();
  return jsonResponse({ sources: results });
}

export async function onRequestPost({ request, env }) {
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
