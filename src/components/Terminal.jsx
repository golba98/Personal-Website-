import { useEffect, useRef, useState } from "react";
import { shell } from "../content";

/*
 * The two terminals. Both reuse the same .term window chrome and .tl row system;
 * CLAUDE.md documents the four character-grid constraints that hold them
 * together, each of which was a real bug. Read that before changing the markup.
 */

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
export function Install({ pkg }) {
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
export function Terminal({ screen, compact, depth = 1 }) {
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
