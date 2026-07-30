/**
 * Every claim here is checkable.
 *
 * No line counts, commit counts, or file counts — those measure typing, not
 * engineering. What's left is the stuff that survives scrutiny: what the thing
 * actually does, whether it shipped, and what the training logs recorded.
 *
 *  - npm figures: registry.npmjs.org (verified 2026-07-30)
 *  - model numbers: logs/phase15-500m/** and MODEL_CARD.md in the LLM repo
 *  - screenshots in /public/shots: captured from these apps running locally
 *  - the Codexa startup screen: read out of the Codexa source, see `startup`
 *
 * Don't add a number here you can't point at a source for.
 */

export const profile = {
  name: "Jordan Vorster",
  role: "Computer Science student",
  location: "Eastern Cape, South Africa",
  education: "BSc Computer Science, University of London",
  email: "jordanvorster404@gmail.com",
  resumeUrl: "/Resume.pdf",
  github: "https://github.com/golba98",
};

/** Caption for the map. The marker is the province label point — see za-map.js. */
export const place = {
  caption: "Eastern Cape, South Africa",
  note: "Outline from Natural Earth 1:50m, public domain.",
};

export const navItems = [
  ["Work", "#work"],
  ["Model", "#model"],
  ["GitHub", "#github"],
  ["Toolkit", "#toolkit"],
  ["Contact", "#contact"],
];

/**
 * Codexa's startup screen, stored as parts rather than pre-drawn box art so the
 * component redraws the borders and the character grid can't drift.
 *
 * Read out of the Codexa v1.0.8 source on 2026-07-30:
 *   logo      src/ui/render/logoVariants.ts      — CODEXA_WORDMARK, 6 rows, 49 cols each
 *   layout    src/ui/timeline/timelineMeasure.ts — meta sits right of the logo on a
 *             2-column gap, vertically centred, so it starts on logo row 1
 *   composer  src/ui/chrome/BottomComposer.tsx   — round border, "❯ " prefix, placeholder
 *   footer    src/ui/render/runtimeDisplay.ts    — "Context: 0 / ~200K" at zero tokens
 *
 * No status row: getStatusLine() returns null while idle. "✧ Claude ready" is the
 * responding state, so putting it on a startup screen would be quietly false.
 *
 * The logo rows must never render bold — logoVariants.ts warns that bolding the
 * block and box-drawing glyphs changes their advance width and opens gaps.
 */
export const startup = {
  // A 100x22 window. At startup the transcript is empty and Ink pins the
  // composer to the bottom, so the space between logo and composer is blank.
  cols: 100,
  rows: 22,
  logoWidth: 49,
  gap: 2,
  logo: [
    " ██████╗ ██████╗ ██████╗ ███████╗██╗  ██╗ █████╗ ",
    "██╔════╝██╔═══██╗██╔══██╗██╔════╝╚██╗██╔╝██╔══██╗",
    "██║     ██║   ██║██║  ██║█████╗   ╚███╔╝ ███████║",
    "██║     ██║   ██║██║  ██║██╔══╝   ██╔██╗ ██╔══██║",
    "╚██████╗╚██████╔╝██████╔╝███████╗██╔╝ ██╗██║  ██║",
    " ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝",
  ],
  // Three tones by row index, mirroring logoPrimary / logoSecondary / logoShadow.
  logoTone: [1, 1, 2, 2, 3, 3],
  meta: ["Codexa v1.0.8", "Workspace: Codexa", "Provider: Claude Code CLI"],
  prompt: "❯ ",
  placeholder: "Ask Codexa, run !shell, or use /command",
  footerLeft: "Claude Code CLI / Sonnet 4.6 (Low)",
  footerRight: "Context: 0 / ~200K",
};

/**
 * The same screen in a narrow terminal. Not a mobile compromise — Codexa really
 * does this: selectLogoVariant() in src/ui/render/logoVariants.ts returns the
 * 6-row wordmark at >= 72 columns (LOGO_LARGE_MIN_COLS) and the one-row
 * LOGO_COMPACT, "✦ CODEXA", from 48 (LOGO_COMPACT_MIN_COLS) up to that.
 * 48x14 is the smallest honest window: LOGO_COMPACT_MIN_ROWS is 12.
 *
 * The placeholder shortens because the real composer truncates to fit its box.
 */
export const startupCompact = {
  ...startup,
  cols: 48,
  rows: 14,
  logo: ["✦ CODEXA"],
  logoTone: [1],
  logoWidth: 8,
  placeholder: "Ask Codexa or use /command",
};

/**
 * My actual shell, so the install line is shown the way it really looks.
 *
 * From ~/.zshrc on 2026-07-30: `show_banner()` (lines 30-35) prints the three
 * banner rows, and `precmd()` (lines 37-48) sets the prompt — on success
 *   PROMPT='%F{green}OK%f %F{cyan}%1~%f > '
 * and on failure `ERR <code>` in red instead of `OK`. zsh %1~ is the current
 * directory's tail, so `~` in the home directory.
 *
 * The page is monochrome, so the real colours map onto the ink ramp: green OK
 * to --text, cyan directory to --dim, the caret and banner to --dimmer.
 */
export const shell = {
  banner: ["  ▄▀▄ ▄▀▄    Developer Environment", "  █▄███▄█", "   ▀▄▄▄▀     Ready to Ship"],
  ok: "OK",
  dir: "~",
  caret: ">",
};

export const projects = [
  {
    id: "syncroedit",
    title: "SyncroEdit",
    year: "Dec 2025 — Jul 2026",
    role: "Real-time collaborative editor",
    summary:
      "Several people edit one document at once. Yjs CRDTs run over WebSockets. A Durable Object owns each room, syncs state, tracks cursors, and writes to D1.",
    proof:
      "Runs on Cloudflare: Hono for routing and auth, D1 for users and documents, Durable Objects for live rooms.",
    stack: ["Yjs / CRDT", "Durable Objects", "Cloudflare D1", "Hono", "WebSockets"],
    shot: "/shots/syncroedit.png",
    shotAlt: "SyncroEdit sign-in screen running locally",
    caption: "Screenshot of the app running locally.",
    repo: "https://github.com/golba98/SyncroEdit",
  },
  {
    id: "codexa",
    title: "Codexa",
    year: "Apr 2026 — Jul 2026",
    role: "Terminal UI for coding agents",
    summary:
      "One terminal for Codex, Claude Code, Gemini, and local models. History, workspace locks, TOML config, themes, and slash commands. TypeScript, Bun, Ink.",
    proof:
      "On npm as @golba98/codexa. Eight releases since May 2026; now v1.0.8. Four backends, each with auth, streaming, and cancellation.",
    stack: ["TypeScript", "Bun", "Ink", "npm"],
    npm: {
      name: "@golba98/codexa",
      version: "1.0.8",
      url: "https://www.npmjs.com/package/@golba98/codexa",
      install: "npm install -g @golba98/codexa",
    },
    startup,
    startupCompact,
    caption:
      "Recreated from the Codexa v1.0.8 source — logo from logoVariants.ts, layout from timelineMeasure.ts, composer from BottomComposer.tsx. Not a screenshot.",
    repo: "https://github.com/golba98/Codexa",
  },
  {
    id: "llm",
    title: "Codexa v1",
    year: "Jul 2026",
    role: "248M-parameter transformer, trained from scratch",
    summary:
      "A decoder-only transformer built from scratch in Python and PyTorch. Own tokenizer, data pipeline, and training loop.",
    proof:
      "The 500M-token run finished 7,630 steps: no non-finite loss, CUDA failure, or thermal fault. Loss 3.6861 → 0.9931; perplexity 2.699; 28,045 tokens/sec on one 16 GB GPU.",
    stack: ["PyTorch", "Python", "bf16", "BPE tokenizer"],
    repo: "https://github.com/golba98/LLM-Codexa-v1",
  },
  {
    id: "movies",
    title: "Fedora Movies",
    year: "Jul 2026",
    role: "Account-based streaming client",
    summary:
      "A private movie and TV app with accounts, first-sign-in password changes, admin controls, session revocation, an audit log, and watch-party rooms.",
    proof:
      "The TMDB token stays server-side behind an authenticated Worker proxy. Playwright tests cover Chromium, Firefox, Android, iPhone, and iPad. Hosts no media.",
    stack: ["React 19", "TypeScript", "Cloudflare Workers", "D1", "Playwright"],
    shot: "/shots/fedora-movies.webp",
    shotAlt:
      "A Fedora Movies watch-party room: the shared player, the in-sync indicator, and two connected participants",
    caption: "Screenshot of a watch-party room running locally.",
    repo: "https://github.com/golba98/Movie_App",
  },
  {
    id: "inequality",
    title: "SA Inequality",
    year: "Jun 2026 — Jul 2026",
    role: "Survey platform and data story",
    summary:
      "A South African cost-of-living survey and data story. The survey uses Turnstile, a field allowlist, and a 16 KB request cap. The story uses WID.world, World Bank, Stats SA, and the 2017 Land Audit.",
    proof:
      "No IP address or user agent is stored. Every chart names its source file. Placeholder survey data is labelled.",
    stack: ["Cloudflare Workers", "D1", "Turnstile", "Data visualisation"],
    shot: "/shots/dataviz.png",
    shotAlt: "The Gini coefficient chart from the inequality data story",
    caption: "Screenshot of the app running locally.",
    repo: "https://github.com/golba98/Survey-App",
    secondaryRepo: { label: "Data story", url: "https://github.com/golba98/Data-Visualizer" },
  },
];

/** Architecture, from MODEL_CARD.md in LLM-Codexa-v1. One home for each number. */
export const modelSpec = {
  rows: [
    ["Parameters", "248M"],
    ["Layers", "34"],
    ["Hidden size", "768"],
    ["Attention heads", "12"],
    ["Context length", "2,048 tokens"],
    ["Vocabulary", "8,192"],
    ["Feed-forward", "SwiGLU"],
    ["Normalisation", "RMSNorm"],
    ["Embeddings", "Tied input/output"],
    ["Tokenizer", "Byte-level BPE"],
    ["Precision", "bf16 mixed"],
  ],
  source: "MODEL_CARD.md, LLM-Codexa-v1",
};

/**
 * Real validation loss, read from logs/phase15-500m/evaluations/step_*.json.
 * Tokens = optimizer step × gradient_accumulation(16) × micro_batch(2) × context(2048).
 *
 * `gpu` keeps `value` and `display` apart so a count-up can interpolate the number
 * but land on the exact figure from the logs rather than a rounded reconstruction.
 */
export const lossCurve = {
  points: [
    { step: 1000, loss: 1.7469, ppl: 5.737 },
    { step: 2000, loss: 1.349, ppl: 3.853 },
    { step: 3000, loss: 1.2081, ppl: 3.347 },
    { step: 4000, loss: 1.1212, ppl: 3.069 },
    { step: 5000, loss: 1.0659, ppl: 2.904 },
    { step: 6000, loss: 1.0206, ppl: 2.775 },
    { step: 7000, loss: 1.0016, ppl: 2.723 },
    { step: 7630, loss: 0.9931, ppl: 2.699 },
  ],
  gpu: [
    { value: 85.2, display: "85.2", unit: "%", label: "mean GPU utilisation" },
    { value: 11840, display: "11,840", unit: "MiB", label: "peak memory" },
    { value: 260, display: "260", unit: "W", label: "peak power draw" },
    { value: 65, display: "65", unit: "°C", label: "peak temperature" },
  ],
  caveat:
    "Trained on TinyStories. It writes short stories; code, instructions, and long context are weak. The model card says the same.",
};

export const repoBlurbs = {
  SyncroEdit:
    "Real-time collaborative editor. Yjs CRDTs over WebSockets, coordinated by Cloudflare Durable Objects.",
  Codexa:
    "Terminal UI for coding agents — Codex, Claude Code, Gemini, and local models. Published on npm.",
  "LLM-Codexa-v1":
    "A 248M-parameter decoder-only transformer written from scratch in PyTorch, tokenizer to release export.",
  Movie_App:
    "Account-based movie and TV app. React 19 and a Cloudflare Worker proxying TMDB, with D1-backed accounts.",
  // Cue is no longer a listed project, but the repo is still public and still
  // shows up as a live GitHub card, so it keeps its blurb.
  "Cue-Helper":
    "Fedora-first desktop assistant driving already-authenticated coding CLIs, with local whisper.cpp transcription.",
  "Survey-App":
    "Cloudflare Worker and D1 survey on South African cost of living, with Turnstile and no IP retention.",
  "Data-Visualizer":
    "A data story on South African inequality, built from WID.world, World Bank, and Stats SA figures.",
  "Data-Visualizer-": "Earlier TypeScript pass at the inequality data story, kept for reference.",
  "Video-Transcriber":
    "Local video and audio transcription GUI. FastAPI and faster-whisper, no paid APIs.",
  Internship_Finder:
    "Scrapes six South African job boards for CS internships and scores each listing against your profile.",
  "Snake-and-leader-cloudflare":
    "Canvas arcade game in TypeScript — delta-time loop, high-DPI rendering, and a local leaderboard.",
  Logical_Gate_Representation:
    "Educational tool for digital logic — verifies truth tables and demonstrates De Morgan's laws.",
  IT_Pixel_Generator: "Pixel art and sprite generation tool written in Python.",
  image_converter: "Batch image format converter with a Python GUI.",
  "PNG-to-JPEG": "Small utility for converting PNG images to JPEG.",
  Truth_Table_Generator: "Converts a logical expression into its full truth table.",
  Base_Converter_Expression: "Converts input between any two bases from 2 to 16.",
  Cloud_ChatBot: "Chatbot running on Cloudflare's edge.",
  Drawing_Project: "Browser drawing app with a canvas-based brush engine.",
  Game_Development: "Game development experiments in JavaScript.",
  "weasel-sentence-simulator":
    "Implementation of Dawkins' weasel program — cumulative selection over random mutation.",
  Venn_Call: "Adds Venn diagram visualisation to the HP Prime calculator.",
  "Karnaugh-Map-Generator-HP-Prime": "Karnaugh map generator for the HP Prime calculator.",
  "hp-prime-ppl-python": "Python tooling for HP Prime PPL programs.",
  Aesthetic_Login: "Styled desktop login interface built in Python.",
  "Transition-Personal-Website": "Earlier iteration of this portfolio.",
  "Personal-Website": "Earlier iteration of this portfolio.",
};

export const background = [
  {
    title: "BSc Computer Science — University of London",
    detail: "Full-time. Data structures, algorithms, discrete maths, web development.",
  },
  {
    title: "CS50x and Coursera coursework",
    detail: "Finished CS50x, plus Coursera courses in cloud computing, calculus, and algorithms.",
  },
  {
    title: "Intern — Pam Golding Properties",
    detail: "Listings, photography, and documentation.",
  },
  {
    title: "Co-leader — school programming team",
    detail: "Ran practice sessions and helped the group debug competition problems.",
  },
  {
    title: "Hospitality and summer crew work",
    detail: "Waiting tables and summer crew. Learned to stay calm when it's busy.",
  },
];

export const toolkitGroups = [
  { label: "Languages", items: ["Python", "JavaScript", "TypeScript", "Java", "PHP", "SQL", "C#"] },
  { label: "Web", items: ["React", "Node.js", "Cloudflare Workers", "D1", "Hono", "Vite"] },
  {
    label: "Systems & tooling",
    items: ["Linux / Fedora", "Docker", "Git", "Bun", "Electron", "Playwright"],
  },
  { label: "AI & ML", items: ["PyTorch", "Ollama", "LM Studio", "whisper.cpp", "Local LLMs"] },
];
