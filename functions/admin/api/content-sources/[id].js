// Update/delete a single Content Sources entry - see index.js in this same
// directory for why writes live under /admin/ (inherits the existing
// Access gate from functions/admin/_middleware.js automatically).
import { jsonResponse } from "../../../_utils/json.js";
import { checkEntryText } from "../../../../src/scripts/contentValidation.js";

export async function onRequestPatch({ request, env, params }) {
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

  const { success } = await env.DB
    .prepare(
      "UPDATE content_sources SET topic = ?, text = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    )
    .bind(topic, text, params.id)
    .run();

  if (!success) return jsonResponse({ error: "Not found" }, 404);
  return jsonResponse({ id: params.id, topic, text });
}

export async function onRequestDelete({ env, params }) {
  await env.DB.prepare("DELETE FROM content_sources WHERE id = ?").bind(params.id).run();
  return jsonResponse({ ok: true });
}
