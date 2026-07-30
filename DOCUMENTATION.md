# Transition Portfolio Technical Documentation

## System overview

This project is a compact Vite/React portfolio with one optional Vercel-style serverless endpoint. The React application owns all page content, transitions, project selection, responsive behavior, and live GitHub presentation. `api/github.js` protects a server-side GitHub token, normalizes REST and GraphQL responses into one browser contract, caches successful responses at the edge, and falls back from pinned GraphQL repositories to recent public REST repositories.

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

`index.html` is the Vite HTML shell; `src/main.jsx` mounts the root component. `src/App.jsx` is intentionally monolithic: it contains static content arrays, reusable local components, portfolio sections, GitHub state, navigation, keyboard/pointer behavior, and transition effects. `src/styles.css` owns layout, typography, animation, responsive states, and the terminal-inspired visual language. `public/Resume.pdf` is copied unchanged into the build output.

There is no client-side router. Page sections are rendered by one React tree and navigated through document state and anchors. React state tracks the active project, fetched GitHub payload, loading/error states, and transient interaction. AbortController-based effects prevent obsolete GitHub work from updating an unmounted/currently replaced view.

## GitHub endpoint contract

`api/github.js` accepts GET only and validates the requested username against a conservative GitHub username pattern and the configured account. This prevents the deployment from becoming an unrestricted GitHub proxy. When `GITHUB_TOKEN` is present, the handler requests the configured user's profile and pinned repositories through GraphQL. Without a token it requests the public profile and recent non-fork repositories through REST. GraphQL errors trigger the same REST fallback.

Both paths normalize profile and repository fields to a stable response with a `source` marker. Successful responses use shared-cache and stale-while-revalidate headers; errors are no-store. If the deployed endpoint fails, the client has a final public REST fallback so portfolio content can still load without pinned-repository fidelity.

`VITE_GITHUB_USERNAME` is public configuration and selects the allowed portfolio account. `GITHUB_TOKEN` is server-only and must never use a `VITE_` prefix. It should be a minimally privileged read token. The endpoint returns only display metadata; no authentication/session state is stored.

## Build, security, and operations

Use `npm run dev`, `npm run build`, and `npm run preview`. Vite produces a static `dist/` directory. The `api/` route requires a host that supports the repository's serverless-function convention (such as Vercel); purely static hosts will exercise the browser's direct REST fallback instead. There is no database, test runner, or persistent browser state.

React escapes repository text, and the API constrains account selection and HTTP method. External links, images, and the downloadable résumé remain browser trust boundaries. GitHub rate limits and stale cache windows are expected operational behavior. Manual verification should cover GraphQL-with-token, REST-without-token, complete API failure, mobile layouts, reduced motion, keyboard navigation, and resume download.

Keep content/presentation changes in `src/App.jsx` and `src/styles.css` unless a feature gains enough independent state to justify extraction. Preserve the normalized GitHub response shape when changing provider logic. New server-side integrations must validate inputs, limit the proxy target, normalize output, and keep credentials outside Vite-exposed variables.
