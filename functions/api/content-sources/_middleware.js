// Reads are public - Kiosk mode and Local History mode fetch this with no
// login, same as the old static JSON they replace. Only writes (POST here,
// PATCH/DELETE in [id].js) need the same verified Cloudflare Access
// identity that gates /admin itself (see functions/admin/_middleware.js
// and docs/ACCESS.md) - the editor UI lives behind Access, but the API it
// calls has to make that same guarantee at the API layer too, since a
// request here doesn't have to come from that page.
import { requireAccess } from "../../_utils/require-access.js";

export async function onRequest(context) {
  if (context.request.method === "GET") return context.next();
  return requireAccess(context, "ACCESS_AUD_ADMIN");
}
