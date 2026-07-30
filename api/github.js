// Vercel-style adapter. All GitHub logic lives in shared/github.js so this and
// the Cloudflare Pages Function (functions/api/github.js) answer identically.
import { CACHE_CONTROL, METHOD_NOT_ALLOWED, resolveGithubPayload } from "../shared/github.js";

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", statusCode === 200 ? CACHE_CONTROL : "no-store");
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  if (req.method && req.method !== "GET") {
    res.setHeader("Allow", "GET");
    json(res, METHOD_NOT_ALLOWED.status, METHOD_NOT_ALLOWED.body);
    return;
  }

  const { status, body } = await resolveGithubPayload({
    requestedUsername: typeof req.query?.username === "string" ? req.query.username : undefined,
    env: process.env,
  });

  json(res, status, body);
}
