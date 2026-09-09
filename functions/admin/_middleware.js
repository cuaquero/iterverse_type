// Gates the whole /admin/* subtree behind a verified Cloudflare Access
// identity (see functions/_utils/require-access.js and docs/ACCESS.md).
// Cloudflare Pages Functions middleware cascades to the whole subtree, so
// this one file covers both the page itself and functions/admin/whoami.js.
import { requireAccess } from "../_utils/require-access.js";

export async function onRequest(context) {
  return requireAccess(context, "ACCESS_AUD_ADMIN");
}
