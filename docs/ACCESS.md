# Cloudflare Access setup

`/admin` (the content-sources editor) sits behind Cloudflare Access. This is a
Cloudflare Zero Trust dashboard configuration step — it is not expressed in
this repo beyond the `wrangler.toml` vars that name the Access Application
once it exists.

## 1. Create the Access group (if it doesn't already exist)

In **Zero Trust → My Team → Groups**, create a group for whoever should be
able to edit Kiosk/Local History content — e.g. `Type Content Editors` — and
add the appropriate BTECH staff emails, or map it to an existing IdP group
(Google Workspace/Azure AD) if one already covers this.

## 2. Create the Access Application

In **Zero Trust → Access → Applications → Add an application → Self-hosted**:

- Domain: `type.iterverse.net/admin*`
- Policy: Allow, Include → group created above
- Session duration: staff's usual (this app has no separate idle timeout of
  its own — whatever Access grants is how long a signed-in session lasts)

Cloudflare Pages auto-creates its own Access Application for `*.pages.dev`
preview URLs on this project (`iterverse-type - Cloudflare Pages` or similar)
— leave that one alone; it protects preview deployments, not this route.

## 3. Verification is done in-app, not just at the edge

`functions/admin/_middleware.js` cryptographically verifies the
`Cf-Access-Jwt-Assertion` header (signature, expiry, issuer, and audience) via
`functions/_utils/require-access.js` before any request under `/admin/*`
reaches a handler — the same pattern every other Iterverse service uses,
copied from `ad_labs/platform-auth/access.ts`. This is defense-in-depth on
top of the Access Application above, not a replacement for it: it means a
request that reaches this origin *without* going through Access (a
misconfigured Application, a route added later without remembering to gate
it) gets rejected here too, instead of silently falling through.

Once verified, `functions/admin/whoami.js` surfaces the authenticated email
back to the page (`AdminPage.jsx`'s "Signed in as ..." line and its "Log
out" link, which calls Access's own `/cdn-cgi/access/logout`).

Wire it up by pasting the real Audience (AUD) tag into `wrangler.toml`'s
`ACCESS_AUD_ADMIN` var (Zero Trust dashboard → Access → Applications → this
app → Overview → Application Audience (AUD) Tag) and redeploying. Until a
real value replaces `REPLACE_WITH_REAL_AUD`, `/admin` fails closed — every
request is rejected, rather than silently open.

## Access gates by path, not by HTTP method

The Content Sources API (`functions/api/content-sources/` and `functions/
admin/api/content-sources/`) needed a public read alongside a staff-only
write, and there's no way to get both on the *same* path through a single
Access Application — Access either covers a path or it doesn't, regardless
of GET vs. POST. The fix: reads live at `/api/content-sources` (no Access
Application covers it, genuinely public), and writes live at `/admin/api/
content-sources` specifically so they inherit the Access Application above
instead of needing a second one. Learned the hard way: the first version
put both at `/api/content-sources` with an app-level method check
(`_middleware.js` calling `requireAccess` only for non-GET) — that looked
right in testing (an unauthenticated POST correctly got a 401) but was
actually broken for everyone, since Access never attached a `Cf-Access-
Jwt-Assertion` header to that path at all, for anyone, so even a real
signed-in instructor's write got rejected by the very same check. If you
add another gated write endpoint, nest it under `/admin/` (or another
already-Access-covered prefix) rather than trying to gate a path Access
itself never touches.

## The PWA service worker can silently swallow Access entirely

`vite-plugin-pwa`'s generated service worker serves the cached app shell
for any navigation it doesn't otherwise recognize, entirely client-side,
before a request ever reaches the network. That includes `/admin` itself
(the gated page loads from cache with no login prompt — the request never
even reaches Cloudflare's edge, let alone this app's origin) and
Cloudflare's own Access login callback (`/cdn-cgi/access/authorized?...`),
which needs to hit the real network to get the cookie-setting redirect
Access issues on a real sign-in. Both are excluded via `vite.config.js`'s
`navigateFallbackDenylist` — see that file's comment. Any new Access-gated
route needs the same exclusion, or it'll silently work for nobody (or
worse, look like it's gating correctly while actually serving cached
content to everyone) the same way both of these did before that fix.

## Local development

`npm run dev` (plain Vite) doesn't run Pages Functions at all, so `/admin`
loads with no gate whatsoever locally under that command — the middleware
only exists in the Cloudflare Pages runtime.

`wrangler pages dev` does run the Functions, but its requests never carry a
real, validly-signed `Cf-Access-Jwt-Assertion` (there's no way to fake
Cloudflare's signature), so `/admin` will correctly reject everything with
"Sign-in required" there too — same limitation every other Iterverse
product's Access-gated routes have. A real deployment is required to test
the gate end-to-end.
