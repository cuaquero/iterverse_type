// Backs AdminPage's "Signed in as ..." line — the verified email is
// already resolved by functions/admin/_middleware.js and handed down via
// context.data, so this just surfaces it to the page.
import { jsonResponse } from "../_utils/json.js";

export async function onRequestGet({ data }) {
  return jsonResponse({ email: data.adminEmail });
}
