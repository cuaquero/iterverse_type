// Fail-closed gate for /admin (functions/admin/**). Verifies the actual
// signed Cf-Access-Jwt-Assertion instead of trusting the edge to have
// already gated the request — defense-in-depth on top of the Access
// Application configured in the Zero Trust dashboard (see docs/ACCESS.md),
// not a replacement for it: this protects against a misconfigured Access
// Application, a preview-deployment URL it doesn't cover, or a future
// route added without remembering to wire it up.
import { verifyAccessJwt } from "./access.js";

/**
 * Mount from a directory's _middleware.js:
 *   export const onRequest = (context) => requireAccess(context, "ACCESS_AUD_ADMIN");
 *
 * audEnvVar names the wrangler.toml var holding this route group's Access
 * Application audience tag - each gated area gets its own Access
 * Application, so its own audience, same convention every other Iterverse
 * service uses.
 */
export async function requireAccess(context, audEnvVar) {
  const { request, env, next } = context;
  const teamDomain = env.ACCESS_TEAM_DOMAIN;
  const expectedAud = env[audEnvVar];
  const jwt = request.headers.get("Cf-Access-Jwt-Assertion");

  if (!teamDomain || !expectedAud || !jwt) {
    return new Response("Sign-in required", { status: 401 });
  }

  const email = await verifyAccessJwt(jwt, teamDomain, expectedAud);
  if (!email) {
    return new Response("Sign-in required", { status: 401 });
  }

  context.data.adminEmail = email;
  return next();
}
