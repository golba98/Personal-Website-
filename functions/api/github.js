// Cloudflare Pages Function adapter, mounted at /api/github by its path in
// functions/. All GitHub logic lives in shared/github.js so this and the Vercel
// handler (api/github.js) answer identically.
//
// Three things differ from the Vercel handler, and all three are runtime, not
// policy: the Workers runtime speaks Fetch API Request/Response instead of
// Node's (req, res); there is no process.env, so config arrives on `env`; and
// Cloudflare does not apply `s-maxage` to Function responses on its own, so the
// documented one-hour edge cache is done explicitly through the Cache API.
import { CACHE_CONTROL, METHOD_NOT_ALLOWED, resolveGithubPayload } from "../../shared/github.js";

function json(status, payload, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": status === 200 ? CACHE_CONTROL : "no-store",
      ...extraHeaders,
    },
  });
}

export async function onRequest({ request, env, waitUntil }) {
  if (request.method !== "GET") {
    return json(METHOD_NOT_ALLOWED.status, METHOD_NOT_ALLOWED.body, { Allow: "GET" });
  }

  // Unauthenticated GitHub REST is rate-limited per caller IP, and here the
  // caller is a shared Cloudflare edge address rather than the visitor — so the
  // cache is what keeps a token-less deployment under the limit.
  const cache = caches.default;
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const requestedUsername = new URL(request.url).searchParams.get("username");
  const { status, body } = await resolveGithubPayload({
    requestedUsername: requestedUsername ?? undefined,
    env,
  });

  const response = json(status, body);

  if (status === 200) {
    // The Cache API honours s-maxage for its own TTL but ignores
    // stale-while-revalidate, so this is a plain one-hour entry.
    waitUntil(cache.put(request, response.clone()));
  }

  return response;
}
