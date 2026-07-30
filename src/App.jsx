import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  background,
  lossCurve,
  modelSpec,
  navItems,
  place,
  profile,
  projects,
  repoBlurbs,
  shell,
  toolkitGroups,
} from "./content";
import { lengths, lesotho, marker, outline, provinces, viewBox } from "./za-map";

const DEFAULT_GITHUB_USERNAME = "golba98";
const GITHUB_USERNAME = import.meta.env.VITE_GITHUB_USERNAME?.trim() || DEFAULT_GITHUB_USERNAME;
const GITHUB_PROFILE_FALLBACK = `https://github.com/${GITHUB_USERNAME}`;
const REPO_CARD_LIMIT = 6;

const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ── GitHub plumbing ─────────────────────────────────────────────────────── */

function formatCount(value) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatRepoDate(value) {
  if (!value) return "Recently updated";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently updated";
  return `Updated ${new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(date)}`;
}

function normalizeGithubProfile(user) {
  return {
    login: user.login || GITHUB_USERNAME,
    name: user.name || "",
    url: user.html_url || user.url || GITHUB_PROFILE_FALLBACK,
    publicRepos: user.public_repos ?? user.publicRepos ?? 0,
  };
}

function normalizeGithubRepo(repo) {
  return {
    name: repo.name,
    url: repo.html_url || repo.url,
    description: repo.description || "",
    language: repo.language || "",
    stars: repo.stargazers_count ?? repo.stars ?? 0,
    updatedAt: repo.updated_at || repo.updatedAt || "",
    pushedAt: repo.pushed_at || repo.pushedAt || "",
    fork: Boolean(repo.fork),
  };
}

async function fetchGithubRestFallback(signal) {
  const [profileResponse, reposResponse] = await Promise.all([
    fetch(`https://api.github.com/users/${GITHUB_USERNAME}`, {
      signal,
      headers: { Accept: "application/vnd.github+json" },
    }),
    fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated&type=owner`,
      { signal, headers: { Accept: "application/vnd.github+json" } },
    ),
  ]);

  if (!profileResponse.ok || !reposResponse.ok) throw new Error("GitHub REST fallback failed");

  const [profileData, repoData] = await Promise.all([
    profileResponse.json(),
    reposResponse.json(),
  ]);

  return {
    profile: normalizeGithubProfile(profileData),
    repos: Array.isArray(repoData)
      ? repoData.filter((repo) => !repo.fork).map(normalizeGithubRepo)
      : [],
    source: "client-rest",
  };
}

function useGithubData() {
  const [data, setData] = useState({ profile: null, repos: [], source: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(
          `/api/github?username=${encodeURIComponent(GITHUB_USERNAME)}`,
          { signal: controller.signal, headers: { Accept: "application/json" } },
        );
        if (!response.ok) throw new Error(`GitHub endpoint failed with ${response.status}`);

        const payload = await response.json();
        if (!controller.signal.aborted) {
          setData({
            profile: payload.profile ? normalizeGithubProfile(payload.profile) : null,
            repos: Array.isArray(payload.repos) ? payload.repos.map(normalizeGithubRepo) : [],
            source: payload.source || "server",
          });
        }
      } catch (requestError) {
        if (requestError.name === "AbortError") return;
        try {
          const fallback = await fetchGithubRestFallback(controller.signal);
          if (!controller.signal.aborted) setData(fallback);
        } catch (fallbackError) {
          if (fallbackError.name !== "AbortError") {
            setError("GitHub is not reachable right now.");
            setData({ profile: null, repos: [], source: "" });
          }
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, []);

  return { data, loading, error };
}

/* ── Motion ──────────────────────────────────────────────────────────────── */

/** Flips .in on first intersection; children with [data-stagger] cascade off --i. */
function useReveal() {
  useEffect(() => {
    const nodes = document.querySelectorAll("[data-reveal]");

    if (reduced()) {
      nodes.forEach((node) => node.classList.add("in"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
    );

    nodes.forEach((node) => {
      node.querySelectorAll("[data-stagger]").forEach((child, index) => {
        // Don't clobber an index the component set itself.
        if (!child.style.getPropertyValue("--i")) child.style.setProperty("--i", index);
      });
      observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);
}

/**
 * One rAF-throttled scroll pass drives everything positional:
 *  --scroll   page progress, for the nav rule
 *  --hero     hero exit progress, for the fade/lift as you leave it
 *  --py/--pr  per-element parallax offset and rotation
 *  --fill     per-project rail progress
 */
function useScrollMotion() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const registry = useRef({ sections: [], reveals: [], parallax: [], rails: [] });

  useEffect(() => {
    const isReduced = reduced();
    let frame = 0;
    let lastY = window.scrollY;
    let velocity = 0;
    let targetVelocity = 0;

    const collect = () => {
      registry.current = {
        sections: [...document.querySelectorAll("main section[id]")],
        reveals: [...document.querySelectorAll("[data-reveal]:not(.in)")],
        parallax: [...document.querySelectorAll("[data-parallax]")],
        rails: [...document.querySelectorAll("[data-rail]")],
      };
    };
    collect();

    let collectFrame = 0;
    const observer = new MutationObserver(() => {
      if (!collectFrame) collectFrame = requestAnimationFrame(() => {
        collectFrame = 0;
        collect();
      });
    });
    const main = document.querySelector("main");
    if (main) observer.observe(main, { childList: true, subtree: true });

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const vh = window.innerHeight;
      const root = document.documentElement;

      setScrolled(y > 24);

      const max = root.scrollHeight - vh;
      root.style.setProperty("--scroll", max > 0 ? (y / max).toFixed(4) : "0");
      root.style.setProperty("--hero", Math.min(y / (vh * 0.9), 1).toFixed(4));
      targetVelocity = Math.max(-1, Math.min(1, (y - lastY) / Math.max(vh, 1)));
      lastY = y;
      velocity += (targetVelocity - velocity) * 0.2;
      root.style.setProperty("--vel", velocity.toFixed(3));
      root.style.setProperty("--speed", Math.abs(velocity).toFixed(3));

      // Which section owns the viewport centre — drives the nav underline.
      let current = "";
      registry.current.sections.forEach((section) => {
        if (section.offsetTop <= y + vh * 0.35) current = section.id;
      });
      setActive(current);

      /*
       * Safety net for the reveal observer. IntersectionObserver samples rather
       * than integrating, so a fast jump — an anchor link, a flung trackpad —
       * can carry an element through the viewport between two deliveries and
       * leave it stuck at opacity 0. Anything on screen right now gets revealed
       * regardless of whether the observer saw it.
       */
      registry.current.reveals = registry.current.reveals.filter((node) => {
        const rect = node.getBoundingClientRect();
        if (rect.top < vh * 0.92 && rect.bottom > 0) {
          node.classList.add("in");
          return false;
        }
        return true;
      });

      if (isReduced) return;

      registry.current.parallax.forEach((node) => {
        const rect = node.getBoundingClientRect();
        if (rect.bottom < -240 || rect.top > vh + 240) return;
        const centre = (rect.top + rect.height / 2 - vh / 2) / vh; // -1 above, +1 below
        const depth = Number(node.dataset.parallax) || 1;
        node.style.setProperty("--py", `${(centre * -26 * depth).toFixed(2)}px`);
        node.style.setProperty("--pr", `${(centre * 1.1 * depth).toFixed(3)}deg`);
        if (node.hasAttribute("data-scale")) {
          node.style.setProperty("--sc", (0.94 + (1 - Math.min(Math.abs(centre), 1)) * 0.06).toFixed(3));
        }
      });

      registry.current.rails.forEach((node) => {
        const rect = node.getBoundingClientRect();
        const progress = (vh * 0.5 - rect.top) / rect.height;
        node.style.setProperty("--fill", Math.max(0, Math.min(progress, 1)).toFixed(3));
      });

      if (Math.abs(velocity) > 0.002 && !frame) frame = requestAnimationFrame(update);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
      if (collectFrame) cancelAnimationFrame(collectFrame);
      observer.disconnect();
    };
  }, []);

  return { scrolled, active };
}

/** One delegated, rAF-throttled pointer listener powers card spotlights. */
function usePointerMagnet() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return undefined;
    let frame = 0;
    let event;
    const move = (next) => {
      event = next;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const target = event.target.closest("[data-magnet]");
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        target.style.setProperty("--gx", `${x.toFixed(1)}%`);
        target.style.setProperty("--gy", `${y.toFixed(1)}%`);
        target.style.setProperty("--mx", `${((x - 50) * 0.16).toFixed(2)}px`);
        target.style.setProperty("--my", `${((y - 50) * 0.16).toFixed(2)}px`);
      });
    };
    document.addEventListener("pointermove", move, { passive: true });
    return () => {
      document.removeEventListener("pointermove", move);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
}

/**
 * Ticks up to a metric, then lands on the exact sourced string rather than a
 * reconstruction from the interpolated float — the figures come from the
 * training logs and have to survive the animation intact.
 */
function useCountUp(metric, active) {
  const [display, setDisplay] = useState(metric.display);
  useEffect(() => {
    if (!active || reduced()) {
      setDisplay(metric.display);
      return undefined;
    }
    const started = performance.now();
    let frame = 0;
    const tick = (now) => {
      const progress = Math.min((now - started) / 900, 1);
      setDisplay(progress === 1 ? metric.display : Math.round(metric.value * progress).toLocaleString("en"));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, metric]);
  return display;
}

/**
 * Splits a string into per-word masks so a heading can cascade in.
 * The separating space must sit *outside* the mask — trailing whitespace inside
 * an overflow-hidden inline-block gets collapsed, and the words run together.
 */
function Words({ text, from = 0 }) {
  const words = text.split(" ");

  return words.map((word, index) => (
    <Fragment key={`${word}-${index}`}>
      <span className="w">
        <span className="w-in" style={{ "--wd": `${from + index * 42}ms` }}>
          {word}
        </span>
      </span>
      {index < words.length - 1 ? " " : null}
    </Fragment>
  ));
}

/* ── Sections ────────────────────────────────────────────────────────────── */

function Nav({ scrolled, active }) {
  return (
    <header className={`nav${scrolled ? " nav-on" : ""}`}>
      <div className="nav-inner">
        <a className="nav-brand" href="#top">
          {profile.name}
        </a>
        <nav aria-label="Sections">
          <ul className="nav-links">
            {navItems.map(([label, href]) => (
              <li key={label}>
                <a
                  href={href}
                  className={active === href.slice(1) ? "is-active" : ""}
                  aria-current={active === href.slice(1) ? "true" : undefined}
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <span className="nav-progress" aria-hidden="true" />
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="hero">
      <div className="aurora" aria-hidden="true">
        <span className="aurora-a" />
        <span className="aurora-b" />
      </div>

      <div className="hero-inner">
        <p className="hero-eyebrow rise" style={{ "--d": "80ms" }}>
          {profile.role} · {profile.location}
        </p>

        <h1 className="hero-title">
          <span className="hero-line">
            <Words text="I build editors, dev tools," from={220} />
          </span>
          <span className="hero-line">
            <Words text="and language models." from={430} />
          </span>
        </h1>

        <p className="hero-lede rise" style={{ "--d": "680ms" }}>
          BSc Computer Science student, University of London. Everything below is a repo you can
          clone and run.
        </p>

        <div className="hero-actions rise" style={{ "--d": "780ms" }}>
          <a className="button button-primary" href={profile.resumeUrl} download>
            Download CV
          </a>
          <a className="button" href={`mailto:${profile.email}`}>
            Email
          </a>
          <a className="button" href={profile.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>

        <div className="scroll-hint rise" style={{ "--d": "1020ms" }} aria-hidden="true">
          <span className="scroll-track">
            <span className="scroll-dot" />
          </span>
          Scroll
        </div>
      </div>
    </section>
  );
}

function Shot({ src, alt, depth = 1 }) {
  return (
    <figure className="shot" data-parallax={depth} data-scale>
      <div className="frame-bar" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="shot-img">
        <img src={src} alt={alt} loading="lazy" decoding="async" />
      </div>
    </figure>
  );
}

/** Live media-query match, so a component can pick a layout rather than scroll. */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);
    setMatches(list.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

/**
 * The install command in my own shell — the zsh banner and prompt from
 * ~/.zshrc, verbatim. Only the command is shown: it is verifiable as written,
 * whereas its output would have to be captured to be honest.
 */
function Install({ pkg }) {
  return (
    <figure className="install">
      <div className="term">
        <div className="frame-bar" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div
          className="term-scroll"
          tabIndex="0"
          role="group"
          aria-label={`Installing ${pkg.name} in a terminal. Scroll horizontally on small screens.`}
        >
          <pre className="term-body">
            <span className="tl term-banner" aria-hidden="true">
              {shell.banner.join("\n")}
              {"\n\n"}
            </span>
            <span className="tl">
              <span className="sh-ok">{shell.ok}</span>{" "}
              <span className="sh-dir">{shell.dir}</span>{" "}
              <span className="sh-caret">{shell.caret}</span> {pkg.install}
            </span>
          </pre>
        </div>
      </div>
      <figcaption className="caption install-meta">
        <a className="link" href={pkg.url} target="_blank" rel="noreferrer">
          {pkg.name}
        </a>{" "}
        v{pkg.version} on the npm registry.
      </figcaption>
    </figure>
  );
}

/** Faithful startup recreation from Codexa v1.0.8 source; never presented as CLI output. */
function Terminal({ screen, compact, depth = 1 }) {
  /*
   * Below 72 columns the real Codexa swaps the 6-row wordmark for the one-row
   * compact logo, so the recreation does the same rather than making a phone
   * scroll a 100-column grid sideways. 760px is where 100 columns stops fitting.
   */
  const narrow = useMediaQuery("(max-width: 760px)");
  if (narrow && compact) screen = compact;

  // Only advertise horizontal scrolling when the grid actually overflows.
  const scroller = useRef(null);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const node = scroller.current;
    if (!node) return undefined;
    const measure = () => setOverflows(node.scrollWidth > node.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [screen]);
  /*
   * The declared width has to hold the logo plus its widest metadata line, and
   * leave at least one space between the two footer halves. If an edit to
   * content.js breaks that, widen to fit rather than throwing — a portfolio
   * that renders a slightly wide box beats one that renders a blank page.
   */
  const metaWidth = Math.max(...screen.meta.map((line) => line.length));
  const width = Math.max(screen.cols, screen.logoWidth + screen.gap + metaWidth);
  const composerWidth = width - 2;
  /*
   * The footer holds both halves on one row when they fit with a gap; a narrow
   * window puts the context readout on its own row instead of truncating it.
   */
  const footerFits = screen.footerLeft.length + screen.footerRight.length + 1 <= width;
  const footerRows = footerFits ? 1 : 2;
  const footerSlack = width - screen.footerLeft.length - screen.footerRight.length;
  /*
   * timelineMeasure.ts centres the metadata against the logo. Whichever block
   * is shorter gets centred against the taller one, so this holds for the
   * 6-row wordmark with 3 metadata lines and for the 1-row compact logo alike.
   */
  const blockRows = Math.max(screen.logo.length, screen.meta.length);
  const logoStart = Math.floor((blockRows - screen.logo.length) / 2);
  const metaStart = Math.floor((blockRows - screen.meta.length) / 2);
  /*
   * Rows used by the fixed furniture: a leading blank, the logo/metadata block,
   * a blank after it, the three composer rows, and the footer. Whatever is left
   * is the empty transcript, which is what the real TUI shows before you type.
   * Clamp at zero so a small `rows` can't produce a negative repeat count.
   */
  const fillerRows = Math.max(0, (screen.rows ?? 0) - (blockRows + 5 + footerRows));
  return (
    <div className="term" data-parallax={depth} data-scale>
      <div className="frame-bar" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div
        className="term-scroll"
        ref={scroller}
        tabIndex={overflows ? 0 : -1}
        role="group"
        aria-label={
          overflows
            ? "Codexa startup screen, scrollable horizontally"
            : "Codexa startup screen"
        }
      >
        <span className="sr-only">CODEXA</span>
        <pre className="term-body" aria-hidden="true" style={{ "--cols": width }}>
          <span className="tl">{"\n"}</span>
          {/* Own line box: the block glyphs only stack solid at line-height 1. */}
          <span className="term-logo">
            {Array.from({ length: blockRows }, (_, index) => {
              const logoRow = screen.logo[index - logoStart];
              const tone = screen.logoTone[index - logoStart] ?? 1;
              return (
                <span className={`tl tl-logo-${tone}`} key={index} style={{ "--tn": index }}>
                  {(logoRow ?? "").padEnd(screen.logoWidth)}
                  {" ".repeat(screen.gap)}
                  {screen.meta[index - metaStart] || ""}
                  {"\n"}
                </span>
              );
            })}
          </span>
          <span className="tl" style={{ "--tn": 6 }}>{"\n"}</span>
          {/* Empty transcript. Nothing has been typed yet, so there is nothing here. */}
          {fillerRows > 0 && <span className="tl">{"\n".repeat(fillerRows)}</span>}
          <span className="tl" style={{ "--tn": 7 }}>{`╭${"─".repeat(composerWidth)}╮\n`}</span>
          <span className="tl term-composer" style={{ "--tn": 8 }}>
            <span>│</span>
            <span>
              {screen.prompt}
              {screen.placeholder}
            </span>
            <span>│</span>
            {"\n"}
          </span>
          <span className="tl" style={{ "--tn": 9 }}>{`╰${"─".repeat(composerWidth)}╯\n`}</span>
          <span className="tl tl-footer" style={{ "--tn": 10 }}>
            {footerFits ? (
              <>
                {screen.footerLeft}
                {" ".repeat(footerSlack)}
                {screen.footerRight}
              </>
            ) : (
              <>
                {screen.footerLeft}
                {"\n"}
                {screen.footerRight}
              </>
            )}
          </span>
        </pre>
      </div>
      {overflows && (
        <p className="term-scroll-note" aria-hidden="true">
          scroll →
        </p>
      )}
    </div>
  );
}

function Project({ project, index }) {
  return (
    <article className="project" data-reveal data-rail>
      <div className="project-rail" aria-hidden="true">
        <span className="project-num">{String(index + 1).padStart(2, "0")}</span>
        <span className="project-track">
          <span className="project-fill" />
        </span>
      </div>

      <div className="project-main">
        <header className="project-head" data-stagger>
          <h3>{project.title}</h3>
          <span className="project-year">{project.year}</span>
        </header>

        <p className="project-role" data-stagger>
          {project.role}
        </p>
        <p className="project-summary" data-stagger>
          {project.summary}
        </p>
        <p className="project-proof" data-stagger>
          {project.proof}
        </p>

        {project.npm && (
          <div data-stagger>
            <Install pkg={project.npm} />
          </div>
        )}

        <ul className="stack" data-stagger>
          {project.stack.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        <div className="project-links" data-stagger>
          <a href={project.repo} target="_blank" rel="noreferrer">
            View source<span className="arrow">→</span>
          </a>
          {project.secondaryRepo && (
            <a href={project.secondaryRepo.url} target="_blank" rel="noreferrer">
              {project.secondaryRepo.label}
              <span className="arrow">→</span>
            </a>
          )}
        </div>

        {/*
          One visual per project. A real screenshot always wins over the
          recreated terminal, so dropping a `shot` on the Codexa entry upgrades
          it with no code change — and never renders both.
        */}
        {(project.shot || project.startup) && (
          <div data-stagger>
            {project.shot ? (
              <Shot src={project.shot} alt={project.shotAlt} depth={index % 2 ? 0.6 : 1} />
            ) : (
              <Terminal
                screen={project.startup}
                compact={project.startupCompact}
                depth={index % 2 ? 0.6 : 1}
              />
            )}
            <p className="caption">
              {project.caption}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

function Work() {
  return (
    <section id="work" className="section">
      <div className="section-head" data-reveal>
        <p className="eyebrow" data-stagger>
          Work
        </p>
        <h2 data-stagger>
          <Words text="What I built" />
        </h2>
        <p className="lede" data-stagger>
          Five projects. All of them run.
        </p>
      </div>

      <div className="projects">
        {projects.map((project, index) => (
          <Project key={project.id} project={project} index={index} />
        ))}
      </div>
    </section>
  );
}

/** Real validation-loss curve, drawn from lossCurve.points. */
function LossChart() {
  const { points } = lossCurve;
  const w = 720;
  const h = 320;
  const pad = { top: 24, right: 28, bottom: 62, left: 52 };

  const xMax = Math.max(...points.map((p) => p.step));
  const yMin = 0.8;
  const yMax = Math.max(...points.map((p) => p.loss));

  const px = (v) => pad.left + (v / xMax) * (w - pad.left - pad.right);
  const py = (v) => pad.top + (1 - (v - yMin) / (yMax - yMin)) * (h - pad.top - pad.bottom);

  const line = points.map((p, i) => `${i ? "L" : "M"}${px(p.step)},${py(p.loss)}`).join(" ");
  const area = `${line} L${px(xMax)},${h - pad.bottom} L${px(points[0].step)},${h - pad.bottom} Z`;

  return (
    <figure className="chart" data-reveal>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Validation loss falling from 1.75 to 0.99 over 7,630 optimizer steps"
      >
        {[1.8, 1.5, 1.2, 0.9].map((t) => (
          <g key={t}>
            <line className="grid" x1={pad.left} y1={py(t)} x2={w - pad.right} y2={py(t)} />
            <text className="axis" x={pad.left - 10} y={py(t) + 4} textAnchor="end">
              {t.toFixed(1)}
            </text>
          </g>
        ))}

        {[0, 2000, 4000, 6000, 7630].map((t) => (
          <text className="axis" key={t} x={px(t)} y={h - pad.bottom + 22} textAnchor="middle">
            {t.toLocaleString("en")}
          </text>
        ))}

        <path className="chart-area" d={area} />
        <path className="chart-line" d={line} />

        {points.map((p, i) => (
          <circle
            className="chart-dot"
            key={p.step}
            cx={px(p.step)}
            cy={py(p.loss)}
            r="3.5"
            style={{ "--dn": i }}
          >
            <title>{`step ${p.step.toLocaleString("en")} · loss ${p.loss} · perplexity ${p.ppl}`}</title>
          </circle>
        ))}

        <text
          className="chart-final"
          x={px(xMax) - 6}
          y={py(points.at(-1).loss) - 14}
          textAnchor="end"
        >
          0.9931
        </text>
        <text className="axis axis-title" x={w / 2} y={h - 14} textAnchor="middle">
          optimizer step
        </text>
      </svg>
      <figcaption>
        Validation loss, phase15-500m. Read from{" "}
        <code>logs/phase15-500m/evaluations/step_*.json</code>.
      </figcaption>
    </figure>
  );
}

function Model() {
  return (
    <section id="model" className="section section-model">
      <div className="section-head" data-reveal>
        <p className="eyebrow" data-stagger>
          Model
        </p>
        <h2 data-stagger>
          <Words text="I trained a model" />
        </h2>
        <p className="lede" data-stagger>
          248M parameters, trained from scratch on one 16 GB GPU. 7,630 steps, bf16, no crashes.
        </p>
      </div>

      <dl className="spec" data-reveal aria-label={`Model architecture from ${modelSpec.source}`}>
        {modelSpec.rows.map(([label, value]) => (
          <div key={label} data-stagger>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>

      <LossChart />

      <dl className="gpu" data-reveal>
        {lossCurve.gpu.map((metric) => <Counter key={metric.label} metric={metric} />)}
      </dl>

      <p className="caveat" data-reveal>
        <strong>What it can't do.</strong> {lossCurve.caveat}
      </p>
    </section>
  );
}

function Counter({ metric }) {
  const [active, setActive] = useState(reduced());
  const ref = useRef(null);
  const display = useCountUp(metric, active);
  useEffect(() => {
    if (reduced() || !ref.current) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setActive(true);
        observer.disconnect();
      }
    }, { threshold: 0.45 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  /*
   * Screen readers get the real figure once, from the .sr-only span. The
   * animating copy is hidden from them so a count-up doesn't get announced as
   * dozens of wrong intermediate numbers.
   */
  return (
    <div ref={ref} data-stagger>
      <dt>
        <span className="sr-only">
          {metric.display} {metric.unit}
        </span>
        <span aria-hidden="true">
          {display} {metric.unit}
        </span>
      </dt>
      <dd>{metric.label}</dd>
    </div>
  );
}

function Github({ data, loading, error }) {
  const githubProfile = data.profile ?? {
    login: GITHUB_USERNAME,
    url: GITHUB_PROFILE_FALLBACK,
    publicRepos: 0,
  };
  const profileUrl = githubProfile.url || GITHUB_PROFILE_FALLBACK;

  const repos = useMemo(
    () =>
      data.repos
        // Drop the profile-README repo (GitHub names it after the user) and forks.
        .filter((repo) => repo.name.toLowerCase() !== GITHUB_USERNAME.toLowerCase() && !repo.fork)
        .slice(0, REPO_CARD_LIMIT)
        .map((repo) => ({
          name: repo.name,
          url: repo.url,
          description:
            repoBlurbs[repo.name] || repo.description || `${repo.language || "Public"} repository.`,
          language: repo.language,
          stars: repo.stars,
          updated: formatRepoDate(repo.pushedAt || repo.updatedAt),
        })),
    [data.repos],
  );

  return (
    <section id="github" className="section">
      <div className="section-head" data-reveal>
        <p className="eyebrow" data-stagger>
          Public code
        </p>
        <h2 data-stagger>
          <Words text="On GitHub" />
        </h2>
        <p className="lede" data-stagger>
          Live from{" "}
          <a className="link" href={profileUrl} target="_blank" rel="noreferrer">
            @{githubProfile.login}
          </a>
          {!loading && githubProfile.publicRepos
            ? ` · ${formatCount(githubProfile.publicRepos)} public repos`
            : ""}
          .
        </p>
      </div>

      <div className="repo-grid" data-reveal aria-live="polite">
        {loading &&
          Array.from({ length: REPO_CARD_LIMIT }, (_, index) => (
            <div className="repo repo-skeleton" key={`skeleton-${index}`} aria-hidden="true">
              <span className="sk sk-title" />
              <span className="sk" />
              <span className="sk sk-short" />
            </div>
          ))}

        {!loading &&
          !error &&
          repos.map((repo, index) => (
            <a
              className="repo"
              href={repo.url}
              key={repo.name}
              target="_blank"
              rel="noreferrer"
              data-stagger
              data-magnet
              // These mount after the reveal observer has run, so set the
              // cascade index here rather than relying on it to assign one.
              style={{ "--i": index }}
            >
              <h3>{repo.name}</h3>
              <p>{repo.description}</p>
              <div className="repo-meta">
                {repo.language && <span className="repo-lang">{repo.language}</span>}
                {repo.stars > 0 && <span>{formatCount(repo.stars)} stars</span>}
                <span>{repo.updated}</span>
              </div>
            </a>
          ))}

        {!loading && (error || repos.length === 0) && (
          <p className="repo-empty">
            {error || "No public repositories to show right now."}{" "}
            <a className="link" href={profileUrl} target="_blank" rel="noreferrer">
              Open GitHub directly
            </a>
            .
          </p>
        )}
      </div>

      <div className="section-foot" data-reveal>
        <a className="button" href={profileUrl} target="_blank" rel="noreferrer">
          View all repositories
        </a>
      </div>
    </section>
  );
}

function Toolkit() {
  return (
    <section id="toolkit" className="section">
      <div className="section-head" data-reveal>
        <p className="eyebrow" data-stagger>
          Toolkit
        </p>
        <h2 data-stagger>
          <Words text="What I work with" />
        </h2>
        <p className="lede" data-stagger>
          All of it is used above. I run Fedora.
        </p>
      </div>

      <div className="toolkit" data-reveal>
        {toolkitGroups.map((group) => (
          <div className="toolkit-group" key={group.label} data-stagger>
            <h3>{group.label}</h3>
            <ul>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="section-head section-head-tight" data-reveal>
        <p className="eyebrow" data-stagger>
          Background
        </p>
        <h2 data-stagger>
          <Words text="How I got here" />
        </h2>
      </div>

      <ol className="timeline" data-reveal>
        {background.map((entry) => (
          <li key={entry.title} data-stagger>
            <h3>{entry.title}</h3>
            <p>{entry.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="section section-contact">
      <div className="contact-layout">
        <Where />
        <div className="contact" data-reveal>
        <h2 data-stagger>
          <Words text="Get in touch." />
        </h2>
        <div className="contact-actions" data-stagger>
          <a className="button button-primary" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
          <a className="button" href={profile.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a className="button" href={profile.resumeUrl} download>
            Download CV
          </a>
        </div>
        </div>
      </div>
    </section>
  );
}

function Where() {
  return (
    <figure className="where" data-reveal>
      <svg
        viewBox={viewBox}
        role="img"
        aria-label="Map of South Africa divided into its nine provinces, with the Eastern Cape filled"
      >
        {/* Internal borders first, so the heavier coastline draws over them. */}
        {provinces.map((province, index) => (
          <path
            key={province.name}
            className={`map-province${province.name === "Eastern Cape" ? " map-ec" : ""}`}
            style={{ "--len": province.len, "--pn": index }}
            d={province.d}
          />
        ))}
        <path className="map-outline" style={{ "--len": lengths.outline }} d={outline} />
        <path className="map-lesotho" style={{ "--len": lengths.lesotho }} d={lesotho} />
        <circle className="map-marker-ping" cx={marker.x} cy={marker.y} r="4" />
        <circle className="map-marker" cx={marker.x} cy={marker.y} r="4" />
      </svg>
      <figcaption><strong>Where I stay</strong><span>{place.caption}. {place.note}</span></figcaption>
    </figure>
  );
}

function App() {
  const { scrolled, active } = useScrollMotion();
  const github = useGithubData();

  useReveal();
  usePointerMagnet();

  return (
    <>
      <div className="curtain" aria-hidden="true" />
      <Nav scrolled={scrolled} active={active} />
      <div className="grain" aria-hidden="true" />
      <main>
        <Hero />
        <Work />
        <Model />
        <Github {...github} />
        <Toolkit />
        <Contact />
      </main>
      <footer className="footer">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span>{profile.location}</span>
      </footer>
    </>
  );
}

export default App;
