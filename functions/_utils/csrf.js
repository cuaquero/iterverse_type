// Defense-in-depth against CSRF on Access-protected mutation endpoints, which
// otherwise rely solely on the ambient Access session cookie. Sec-Fetch-Site is set
// by the browser itself on every request and cannot be overridden by page script or
// a cross-site form, so it reliably distinguishes a same-origin call (our own
// dashboard JS) from one initiated by another site. Requests with no such header
// (non-browser clients, e.g. curl, or older browsers that predate Fetch Metadata)
// are let through, since they're not the browser-mediated CSRF threat this guards
// against.
//
// Copy-paste-and-keep-in-sync convention across every Iterverse service (see
// functions/_utils/access.js) - same helper as btech-ticketing's
// functions/_utils/csrf.js, not a shared package.
export function isSameOriginRequest(request) {
  const site = request.headers.get("Sec-Fetch-Site");
  if (site === null) return true;
  return site === "same-origin" || site === "none";
}
