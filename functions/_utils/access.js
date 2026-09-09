// Cloudflare Access sits in front of Access-protected routes (see
// docs/ACCESS.md) and populates this header on every authenticated
// request. Only safe to read on its own once verifyAccessJwt (below) has
// confirmed the request actually carries a validly-signed Access JWT —
// see functions/_utils/require-access.js, which every admin route runs
// through first.
export function getAccessEmail(request) {
  return request.headers.get("Cf-Access-Authenticated-User-Email") || "unknown@btech.edu";
}

// Iterverse's platform auth (Cloudflare Access, One-Time PIN) - copied from
// ad_labs/platform-auth/access.ts (see its README for the identity model).
// Copy-paste-and-keep-in-sync convention across every Iterverse service, not
// a shared package - this is the same plain-JS translation already living in
// iterverse_hub, koodo-bridge, cli_box, emu_print, and btech-ticketing.

function base64UrlToBytes(b64url) {
  const padded = b64url + "=".repeat((4 - (b64url.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function decodeJson(b64url) {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(b64url)));
}

let cachedKeys = null;
let cachedTeamDomain = null;

async function loadKeys(teamDomain) {
  if (cachedKeys && cachedTeamDomain === teamDomain) return cachedKeys;
  const response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`);
  if (!response.ok) throw new Error(`Failed to fetch Access certs: ${response.status}`);
  const { keys } = await response.json();

  const map = new Map();
  for (const jwk of keys) {
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    map.set(jwk.kid, key);
  }
  cachedKeys = map;
  cachedTeamDomain = teamDomain;
  return map;
}

/**
 * Verifies signature, expiry, issuer, and audience. Returns the
 * authenticated email on success, null on *any* failure - callers should
 * treat null exactly like "no session" and never surface which check
 * failed, so a prober can't distinguish "expired" from "wrong audience"
 * from "not signed in at all".
 */
export async function verifyAccessJwt(jwt, teamDomain, expectedAud) {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;

    const header = decodeJson(headerB64);
    if (!header.kid || header.alg !== "RS256") return null;

    let keys = await loadKeys(teamDomain);
    let key = keys.get(header.kid);
    if (!key) {
      cachedKeys = null;
      keys = await loadKeys(teamDomain);
      key = keys.get(header.kid);
    }
    if (!key) return null;

    const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlToBytes(sigB64);
    const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, signature, signedData);
    if (!valid) return null;

    const payload = decodeJson(payloadB64);
    if (!payload.exp || payload.exp * 1000 < Date.now()) return null;
    if (payload.iss !== `https://${teamDomain}`) return null;

    const audList = Array.isArray(payload.aud) ? payload.aud : payload.aud ? [payload.aud] : [];
    if (!audList.includes(expectedAud)) return null;

    return payload.email ?? null;
  } catch {
    return null;
  }
}
