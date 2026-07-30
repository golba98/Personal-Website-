# Transition Portfolio Technical Documentation

## System overview

This project is a compact Vite/React portfolio with one optional serverless endpoint, deployable to either Vercel or Cloudflare Pages. The React application owns all page content, transitions, project selection, responsive behavior, and live GitHub presentation. `shared/github.js` protects a server-side GitHub token, normalizes REST and GraphQL responses into one browser contract, caches successful responses at the edge, and falls back from pinned GraphQL repositories to recent public REST repositories.

```mermaid
flowchart LR
  Browser --> Vite[Vite static application]
  Vite --> App[src/App.jsx]
  App --> API[/api/github]
  API -->|token available| GraphQL[GitHub GraphQL pinned repos]
  API -->|no token or fallback| REST[GitHub REST profile/repos]
  App -->|final fallback| PublicREST[Direct public GitHub REST]
  Vite --> Resume[public/Resume.pdf]
```

## Source organization and rendering

`index.html` is the Vite HTML shell; `src/main.jsx` mounts the root component. `src/App.jsx` is composition only — it calls the hooks and lays out the sections in order. The rest is split by responsibility: `src/github.js` owns the client tier of the GitHub path, `src/motion.js` owns the scroll-motion system, `src/components/` holds the two pieces with more than one consumer (`Words`, and the terminals), and `src/sections/` holds one file per page section. A component used by exactly one section lives in that section's file rather than in `components/`. `src/styles.css` remains a single file — it owns layout, typography, animation, responsive states, and the terminal-inspired visual language, and its cascade order is load-bearing. `public/Resume.pdf` is copied unchanged into the build output.

There is no client-side router. Page sections are rendered by one React tree and navigated through document state and anchors. React state tracks the active project, fetched GitHub payload, loading/error states, and transient interaction. AbortController-based effects prevent obsolete GitHub work from updating an unmounted/currently replaced view.

## GitHub endpoint contract

The endpoint accepts GET only and validates the requested username against a conservative GitHub username pattern and the configured account. This prevents the deployment from becoming an unrestricted GitHub proxy. When `GITHUB_TOKEN` is present, it requests the configured user's profile and pinned repositories through GraphQL. Without a token it requests the public profile and recent non-fork repositories through REST. GraphQL errors trigger the same REST fallback.

That contract lives entirely in `shared/github.js`, whose `resolveGithubPayload({ requestedUsername, env })` returns a host-neutral `{ status, body }` and reads configuration from the passed `env` rather than a global. Two thin adapters supply the host's I/O: `api/github.js` for Vercel's Node `(req, res)` convention, and `functions/api/github.js` for Cloudflare Pages Functions, which speak Fetch API `Request`/`Response`, receive bindings on `env` instead of `process.env`, and must cache through the Cache API because Cloudflare does not apply `s-maxage` to Function responses on its own. Only one adapter is live per host; the other is inert.

Both paths normalize profile and repository fields to a stable response with a `source` marker. Successful responses use shared-cache and stale-while-revalidate headers; errors are no-store. If the deployed endpoint fails, the client has a final public REST fallback so portfolio content can still load without pinned-repository fidelity.

`VITE_GITHUB_USERNAME` is public configuration and selects the allowed portfolio account. `GITHUB_TOKEN` is server-only and must never use a `VITE_` prefix. It should be a minimally privileged read token. The endpoint returns only display metadata; no authentication/session state is stored.

## Build, security, and operations

Use `npm run dev`, `npm run build`, and `npm run preview`. Vite produces a static `dist/` directory, which is the complete deployable site on any static host; purely static hosts simply exercise the browser's direct REST fallback instead of the endpoint. Vercel picks up `api/github.js` by convention. Cloudflare Pages uses build command `npm run build`, output directory `dist`, and mounts `functions/api/github.js` at `/api/github` by its path, with `VITE_GITHUB_USERNAME` set as a build variable and `GITHUB_TOKEN` as a secret; `npx wrangler pages dev dist` serves that route locally. A `_redirects` SPA catch-all must not be added, as it would shadow the endpoint with HTML. There is no database, test runner, or persistent browser state.

React escapes repository text, and the API constrains account selection and HTTP method. External links, images, and the downloadable résumé remain browser trust boundaries. GitHub rate limits and stale cache windows are expected operational behavior. Manual verification should cover GraphQL-with-token, REST-without-token, complete API failure, mobile layouts, reduced motion, keyboard navigation, and resume download.

Keep a section's markup in its own file under `src/sections/`, and promote a component into `src/components/` only once a second consumer exists. Preserve the normalized GitHub response shape when changing provider logic. New server-side integrations must validate inputs, limit the proxy target, normalize output, and keep credentials outside Vite-exposed variables.
