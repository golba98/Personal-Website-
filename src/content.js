/**
 * Every claim here is checkable.
 *
 * No line counts, commit counts, or file counts — those measure typing, not
 * engineering. What's left is the stuff that survives scrutiny: what the thing
 * actually does, whether it shipped, and what the training logs recorded.
 *
 *  - npm figures: registry.npmjs.org (verified 2026-09-04)
 *  - model numbers: logs/codexa-900m-base-v1/**, logs/codexa-900m-sft-v2/**,
 *    and configs/1b.yaml in the LLM repo
 *  - screenshots in /public/shots: captured from these apps running locally
 *  - the Ubume startup screen: read out of the Ubume source, see `startup`
 *  - SyncroEdit's architecture: wrangler.toml bindings and src-worker/ in
 *    SyncroEdit; the two-user collaboration claim is what
 *    tests/e2e/collaboration.test.js actually drives
 *  - the RPG engine: the "ENGINE FEATURES" section of the Game_Development
 *    README for the generation algorithms, game.html lines 91-93 for the
 *    pinned PixiJS and p5 versions, wrangler.jsonc for the Cloudflare target,
 *    and `npm test` there for the test count
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
 * Ubume's startup screen, stored as parts rather than pre-drawn box art so the
 * component redraws the borders and the character grid can't drift.
 *
 * Read out of the Ubume v0.1.0 source on 2026-09-13:
 *   logo      src/ui/render/logoVariants.ts      — UBUME_WORDMARK, 6 rows, 45 cols each
 *   layout    src/ui/timeline/timelineMeasure.ts — meta sits right of the logo on a
 *             2-column gap, vertically centred, so it starts on logo row 1
 *   composer  src/ui/chrome/BottomComposer.tsx   — round border, "❯ " prefix, placeholder
 *   footer    src/ui/render/runtimeDisplay.ts    — buildActiveRuntimeDisplay() at zero tokens
 *
 * The screen shows the local route, so the footer is derived rather than copied
 * from the Claude Code one it used to show. runtimeDisplay.ts drops the
 * reasoning tag when providerId is "local" — local runtimes own that setting and
 * Ubume cannot adjust it — so there is no "(Low)" after the model, and the
 * model is the raw id LM Studio reports rather than a prettified name. The "~"
 * is gone with it: it marks an *estimated* context length, and a local model's
 * length comes back from /v1/models as verified. formatContextCompact() then
 * rounds 131,072 to "131K".
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
  logoWidth: 45,
  gap: 2,
  logo: [
    "██╗   ██╗██████╗ ██╗   ██╗███╗   ███╗███████╗",
    "██║   ██║██╔══██╗██║   ██║████╗ ████║██╔════╝",
    "██║   ██║██████╔╝██║   ██║██╔████╔██║█████╗  ",
    "██║   ██║██╔══██╗██║   ██║██║╚██╔╝██║██╔══╝  ",
    "╚██████╔╝██████╔╝╚██████╔╝██║ ╚═╝ ██║███████╗",
    " ╚═════╝ ╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚══════╝",
  ],
  // Three tones by row index, mirroring logoPrimary / logoSecondary / logoShadow.
  logoTone: [1, 1, 2, 2, 3, 3],
  meta: ["Ubume v0.1.0", "Workspace: Ubume", "Provider: Local"],
  prompt: "❯ ",
  placeholder: "Ask Ubume, run !shell, or use /command",
  footerLeft: "Local / qwen/qwen3.8-27b",
  footerRight: "Context: 0 / 131K",
};

/**
 * The same screen in a narrow terminal. Not a mobile compromise — Ubume really
 * does this: selectLogoVariant() in src/ui/render/logoVariants.ts returns the
 * 6-row wordmark at >= 72 columns (LOGO_LARGE_MIN_COLS) and the one-row
 * LOGO_COMPACT, "✦ UBUME", from 48 (LOGO_COMPACT_MIN_COLS) up to that.
 * 48x14 is the smallest honest window: LOGO_COMPACT_MIN_ROWS is 12.
 *
 * The placeholder does not shorten: getPlaceholder() in BottomComposer.tsx returns
 * the 38-column idle text, which fits the 46-column composer whole.
 */
export const startupCompact = {
  ...startup,
  cols: 48,
  rows: 14,
  logo: ["✦ UBUME"],
  logoTone: [1],
  logoWidth: 7,
  placeholder: "Ask Ubume, run !shell, or use /command",
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
    year: "Dec 2025 — Current",
    role: "Real-time collaborative editor",
    summary:
      "A document workspace you sign into. Several people can be in the same document at once, each typing wherever they like — every keystroke lands on the other screens, alongside a chat panel for the conversation around the text, and no one overwrites anyone.",
    note: "A long project, and years of it still ahead. It isn't aimed at becoming a real product — it is the place where each new skill gets applied to something already running: tighter security, DevOps, CI/CD, whatever comes next.",
    proof:
      "Yjs CRDTs over WebSockets. A Durable Object owns each room, keeps its state in sync, relays presence, and persists to D1 on a debounce; a second Durable Object class holds the abuse counters, and the socket opens on a short-lived ticket rather than the session token. Hono routes and authenticates on Cloudflare, with email-verified signup. A Playwright test drives two browsers through one document, takes one offline mid-edit, and asserts both converge.",
    stack: ["Yjs / CRDT", "Quill 2", "Durable Objects", "Cloudflare D1", "Hono", "WebSockets"],
    shot: "/shots/syncroedit.webp",
    shotAlt:
      "A SyncroEdit document open in the editor, under the ribbon: paragraphs typed by two accounts in the same room, and the document chat panel open beside them holding a message from each",
    caption: "Screenshot of the app running locally.",
    repo: "https://github.com/golba98/SyncroEdit",
  },
  {
    id: "ubume",
    title: "Ubume",
    year: "Apr 2026 — Current",
    role: "Terminal UI for coding agents",
    summary:
      "One terminal for the Codex, Claude Code, Gemini, Mistral Vibe, and Antigravity CLIs, and for local models. History, workspace locks, TOML config, themes, and slash commands. TypeScript, Bun, Ink.",
    note: "The other long project, on the same footing as SyncroEdit — kept alive and rebuilt as the tooling around it changes, rather than finished and shelved.",
    proof:
      "On npm as ubume, now v0.1.0 — renamed from @golba98/codexa, which shipped 27 releases from May to September 2026 (1.0.1 to 1.0.28). Six provider routes work — those five CLIs plus any OpenAI-compatible local server — with two Codexa Native runtimes held behind a dev build.",
    stack: ["TypeScript", "Bun", "Ink", "npm"],
    npm: {
      name: "ubume",
      version: "0.1.0",
      url: "https://www.npmjs.com/package/ubume",
      install: "npm install -g ubume",
    },
    startup,
    startupCompact,
    caption:
      "Recreated from the Ubume v0.1.0 source — logo from logoVariants.ts, layout from timelineMeasure.ts, composer from BottomComposer.tsx. Not a screenshot.",
    repo: "https://github.com/golba98/Ubume",
  },
  {
    id: "movies",
    title: "Fedora Movies",
    year: "Jul 2026",
    role: "Account-based streaming client",
    summary:
      "A private movie and TV library you sign into. Browse what's trending, search the catalogue, open a title for its details and trailer, and save the ones you want later. Accounts are issued by an admin, and a group can watch something together in a synced room.",
    note: "Not a product for the public. It was built for my family, so we get private, secure movie viewing at home — which also means real people using something I maintain, close enough that I can watch for problems and fix them before anyone has a bad evening with it.",
    proof:
      "The TMDB token stays server-side behind an authenticated Worker proxy. First sign-in forces a password change; admins can revoke sessions, and every action lands in an audit log. Playwright tests cover Chromium, Firefox, Android, iPhone, and iPad. Hosts no media.",
    stack: ["React 19", "TypeScript", "Cloudflare Workers", "D1", "Playwright"],
    shot: "/shots/fedora-movies.webp",
    shotAlt:
      "The Fedora Movies home screen: a featured title across the top and a row of trending film posters below it",
    caption: "Screenshot of the app running locally.",
    repo: "https://github.com/golba98/Movie_App",
  },
  {
    id: "game",
    title: "Forest RPG",
    year: "Nov 2025 — Aug 2026",
    role: "Top-down RPG engine, written from scratch",
    summary:
      "A browser game that builds its own world — forest, rivers, hills, weather, and a day that turns into night. You walk a character through it, fight what lives there, collect what it drops, and save a world you liked so you can come back to it.",
    proof:
      "Terrain comes from Perlin noise, hills from noise run through cellular-automata smoothing, and rivers from a walker that starts at a map edge and is jittered along its path by more noise, widening and branching as it goes. A BFS from the spawn point then prunes whatever the water cut off, and a second pass bridges any barrier that still blocks the route. PixiJS 7.4.3 draws the world with p5 1.6.0 layered over it for HUD and input; sixteen tests under Node's built-in runner cover the map server and the runtime contracts. It runs four ways — Node server, Live Server, Docker, or Cloudflare Workers static assets — and save/load is deliberately off on the deployed build, which has no server to save to.",
    stack: ["JavaScript", "p5.js", "PixiJS", "Node.js", "Docker", "Cloudflare Workers"],
    shot: "/shots/game.webp",
    shotAlt:
      "A generated Forest RPG world: a bridge crossing the river that cuts the map in two, sand banks along its edge, a mob tagged with its health bar and distance, and the health, stamina, gold, objective, minimap and XP panels around the edge of the screen",
    caption: "Screenshot of the game running locally.",
    repo: "https://github.com/golba98/Game_Development",
  },
  {
    id: "llm",
    title: "Codexa v1",
    year: "Jul 2026 — Current",
    role: "934M-parameter transformer, trained from scratch",
    summary:
      "A 24-layer decoder-only transformer built from scratch in Python and PyTorch, with a 16,384-token BPE tokenizer, memory-mapped data pipeline, mixed-precision training, and native conversational SFT.",
    note: "Named after Codexa, the terminal UI now called Ubume — it is the model Ubume is meant to run on its own rather than routing out to someone else's CLI.",
    proof:
      "The base run completed 10,000 optimizer steps and 655,360,000 tokens on CUDA with bf16 and AdamW8bit. Conversational SFT v2 then completed 6,000 steps and 103,459,920 tokens, reaching 1.5768 training loss and 2.0316 validation loss.",
    stack: ["PyTorch", "Python", "bf16", "BPE tokenizer", "CUDA"],
    repo: "https://github.com/golba98/LLM-Codexa-v1",
  },
];

/** Architecture, from MODEL_CARD.md in LLM-Codexa-v1. One home for each number. */
export const modelSpec = {
  rows: [
    ["Parameters", "934,356,480"],
    ["Layers", "24"],
    ["Hidden size", "1,536"],
    ["Attention heads", "24"],
    ["Context length", "2,048 tokens"],
    ["Vocabulary", "16,384"],
    ["Feed-forward", "SwiGLU"],
    ["Normalisation", "RMSNorm"],
    ["Embeddings", "Tied input/output"],
    ["Tokenizer", "Byte-level BPE"],
    ["Precision", "bf16 mixed"],
  ],
  source: "configs/1b.yaml and logs/codexa-900m-base-v1/run_metadata.json",
};

/**
 * Real conversational-SFT validation loss, read from
 * logs/codexa-900m-sft-v2/train_metrics.jsonl.
 *
 * `gpu` keeps `value` and `display` apart so a count-up can interpolate the number
 * but land on the exact figure from the logs rather than a rounded reconstruction.
 */
export const lossCurve = {
  points: [
    { step: 100, loss: 2.3052, ppl: 10.026 },
    { step: 1000, loss: 2.2307, ppl: 9.307 },
    { step: 2000, loss: 2.1706, ppl: 8.765 },
    { step: 3000, loss: 2.1031, ppl: 8.191 },
    { step: 4000, loss: 2.0654, ppl: 7.887 },
    { step: 5000, loss: 2.0311, ppl: 7.623 },
    { step: 6000, loss: 2.0316, ppl: 7.626 },
  ],
  gpu: [
    {
      value: 7700.7,
      display: "7,700.7",
      unit: "tok/s",
      label: "median base throughput",
    },
    {
      value: 12920,
      display: "12,920",
      unit: "MiB",
      label: "peak reserved VRAM",
    },
    {
      value: 10000,
      display: "10,000",
      unit: "steps",
      label: "completed base steps",
    },
    {
      value: 6000,
      display: "6,000",
      unit: "steps",
      label: "completed SFT steps",
    },
  ],
  caveat:
    "Native PyTorch inference works, but conversational quality is still being evaluated. The GGUF/LM Studio export failed its behavioral compatibility gate, so the native checkpoint is the only build that runs correctly.",
};

export const repoBlurbs = {
  SyncroEdit:
    "Collaborative document workspace with in-document chat. Yjs CRDTs over WebSockets, coordinated by Cloudflare Durable Objects.",
  Ubume:
    "Ubume, a terminal UI for coding agents — the Codex, Claude Code, Gemini, Mistral Vibe, and Antigravity CLIs, and local models. Published on npm as ubume.",
  "LLM-Codexa-v1":
    "A 934M-parameter decoder-only transformer trained from scratch in PyTorch, with native conversational SFT inference.",
  Movie_App:
    "Account-based movie and TV app. React 19 and a Cloudflare Worker proxying TMDB, with D1-backed accounts.",
  Game_Development:
    "Top-down RPG engine in p5.js and PixiJS. Perlin-noise terrain, carved rivers, cellular-automata hills, and a flood fill that checks the world is playable.",
  // Cue, the survey, and the data story are no longer listed projects, but the
  // repos are still public and still show up as live GitHub cards, so they keep
  // their blurbs.
  "Cue-Helper":
    "Fedora-first desktop assistant driving already-authenticated coding CLIs, with local whisper.cpp transcription.",
  "Survey-App":
    "Cloudflare Worker and D1 survey on South African cost of living, with Turnstile and no IP retention.",
  "CM1040-Survey-App-Final":
    "Getting Online in South Africa, 2006-2026. CM1040 coursework: three chapters built from validated JSON with no framework or third-party runtime script, checked with Playwright, axe-core, and the Nu HTML validator.",
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
  "weasel-sentence-simulator":
    "Implementation of Dawkins' weasel program — cumulative selection over random mutation.",
  Venn_Call: "Adds Venn diagram visualisation to the HP Prime calculator.",
  "Karnaugh-Map-Generator-HP-Prime": "Karnaugh map generator for the HP Prime calculator.",
  "hp-prime-ppl-python": "Python tooling for HP Prime PPL programs.",
  Aesthetic_Login: "Styled desktop login interface built in Python.",
  "Transition-Personal-Website": "Earlier iteration of this portfolio.",
  "Personal-Website-": "Earlier iteration of this portfolio.",
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

/**
 * Everything here is in a repo, not on a course syllabus. Each item was checked
 * against a manifest or a source file before it went in — package.json and
 * requirements.txt across ~35 projects, plus the CDN pins in the game's HTML and
 * the CMake build under the NumPy LLM. Nothing is here because it looks good.
 */
export const toolkitGroups = [
  {
    label: "Languages",
    items: ["Python", "JavaScript", "TypeScript", "C++", "SQL", "Bash"],
  },
  {
    label: "Frontend",
    items: [
      "React 19",
      "Next.js",
      "React Router",
      "Tailwind CSS",
      "Vite",
      "p5.js",
      "PixiJS",
      "Quill",
      "Yjs / CRDT",
    ],
  },
  {
    label: "Backend & cloud",
    items: [
      "Cloudflare Workers",
      "Pages Functions",
      "Durable Objects",
      "D1",
      "Workers AI",
      "Wrangler",
      "Hono",
      "Node.js",
      "Bun",
      "Express",
      "FastAPI",
      "Supabase",
    ],
  },
  {
    label: "Testing & quality",
    items: ["Playwright", "Vitest", "Jest", "node:test", "ESLint", "Prettier", "axe-core"],
  },
  {
    label: "AI & ML",
    items: [
      "PyTorch",
      "NumPy",
      "CuPy",
      "CUDA",
      "Hugging Face tokenizers",
      "safetensors",
      "faster-whisper",
      "whisper.cpp",
      "Ollama",
      "LM Studio",
      "MCP",
    ],
  },
  {
    label: "Systems & tooling",
    items: [
      "Linux / Fedora",
      "Docker",
      "Git",
      "CMake",
      "Electron",
      "PipeWire",
      "AppImage / RPM",
      "Cloudflare Pages",
      "Vercel",
    ],
  },
];
