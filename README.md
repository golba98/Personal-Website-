# Jordan L Vorster Portfolio

## Project tree

```text
14-Transition Website/
├── public/
│   └── Resume.pdf           # Downloadable CV, served at /Resume.pdf
├── src/
│   ├── App.jsx              # All page content, data arrays, and components
│   ├── main.jsx             # React entry point — mounts App into #root
│   └── styles.css           # Full visual system, layout, and animations
├── .claude/
│   └── launch.json          # Dev-server config for Claude Code preview
├── index.html               # Vite HTML shell
├── vite.config.js           # Vite build config
└── package.json             # Dependencies and npm scripts
```

`node_modules/`, `dist/`, `package-lock.json`, log files, and other generated or local-only output are intentionally omitted.

## What matters where

- `src/App.jsx` holds the page content and data.
- `src/styles.css` handles the full visual system.
- `src/main.jsx` mounts the React app.
- `public/Resume.pdf` is the downloadable CV.

## Run

```bash
npm install
npm run dev
```

The local server is configured for `http://127.0.0.1:5173/`.

## GitHub data

The GitHub section loads live profile and repository data. Set `VITE_GITHUB_USERNAME`
to choose the public account, or leave it unset to use `golba98`.

Exact pinned repositories require a server-only `GITHUB_TOKEN` in the deployment
environment so the Vercel API route can call GitHub GraphQL. Without that token,
the site falls back to recent public non-fork repositories from GitHub REST. Never
expose `GITHUB_TOKEN` with a `VITE_` prefix. Use a read-only token with the
minimum permissions needed for public GraphQL profile data.
