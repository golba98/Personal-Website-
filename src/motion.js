import { useEffect, useRef, useState } from "react";

/*
 * The scroll-motion system. Nothing here animates in JS — one rAF-throttled
 * pass writes CSS custom properties and styles.css consumes them. The DOM
 * contract (data-reveal, data-stagger, data-parallax, data-scale, data-rail)
 * is documented in CLAUDE.md; new markup has to opt in.
 *
 * `reduced()` gates all of it.
 */

export const reduced = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Flips .in on first intersection; children with [data-stagger] cascade off --i. */
export function useReveal() {
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
 *  --scroll   page progress, for the nav rule        (set on [data-motion~=nav])
 *  --speed    scroll speed, for the nav's fade       (set on [data-motion~=nav])
 *  --hero     hero exit progress, for the fade/lift  (set on [data-motion~=hero])
 *  --py/--pr  per-element parallax offset and rotation
 *  --vel      signed scroll velocity, for the parallax squash
 *  --fill     per-project rail progress
 *
 * The pass is split into a read phase and a write phase, and none of these
 * variables lives on :root. Both rules are load-bearing rather than stylistic —
 * see the comments inside update() for the measurements behind each.
 */
export function useScrollMotion() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const registry = useRef({ sections: [], reveals: [], parallax: [], rails: [], nav: null, hero: null });

  useEffect(() => {
    const isReduced = reduced();
    let frame = 0;
    let lastY = window.scrollY;
    let velocity = 0;
    let targetVelocity = 0;
    /*
     * Last value written for each page-level variable. Chrome charges a style
     * recalc of the host's whole subtree for every custom-property write, even
     * one nothing reads, so a write that changes nothing is pure cost.
     */
    let lastScroll = "";
    let lastHero = "";
    let lastSpeed = "";

    const collect = () => {
      registry.current = {
        sections: [...document.querySelectorAll("main section[id]")],
        reveals: [...document.querySelectorAll("[data-reveal]:not(.in)")],
        parallax: [...document.querySelectorAll("[data-parallax]")],
        rails: [...document.querySelectorAll("[data-rail]")],
        /*
         * --scroll/--speed and --hero are set on these two hosts rather than on
         * :root. Their consumers all sit inside one of them, and a root write
         * invalidates all 500-odd elements on the page instead of the dozen
         * that actually read the value (measured 2.8ms vs 0.2ms per frame).
         */
        nav: document.querySelector("[data-motion~='nav']"),
        hero: document.querySelector("[data-motion~='hero']"),
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
      const { sections, reveals, parallax, rails, nav, hero } = registry.current;
      const y = window.scrollY;
      const vh = window.innerHeight;

      /*
       * Read phase. Every layout query in the frame happens here, before the
       * first style write. Interleaving them — read a rect, write a variable,
       * read the next rect — makes each read flush layout again, which cost
       * about four extra forced layout passes per frame.
       */
      const max = document.documentElement.scrollHeight - vh;
      const sectionTops = sections.map((section) => section.offsetTop);
      const revealRects = reveals.map((node) => node.getBoundingClientRect());
      const parallaxRects = isReduced ? [] : parallax.map((node) => node.getBoundingClientRect());
      const railRects = isReduced ? [] : rails.map((node) => node.getBoundingClientRect());

      // Write phase. Nothing below reads geometry.
      targetVelocity = Math.max(-1, Math.min(1, (y - lastY) / Math.max(vh, 1)));
      lastY = y;
      velocity += (targetVelocity - velocity) * 0.2;

      const scrollValue = max > 0 ? (y / max).toFixed(4) : "0";
      const heroValue = Math.min(y / (vh * 0.9), 1).toFixed(4);
      const speedValue = Math.abs(velocity).toFixed(3);

      if (nav && scrollValue !== lastScroll) {
        nav.style.setProperty("--scroll", scrollValue);
        lastScroll = scrollValue;
      }
      /*
       * Velocity-driven, so it has nothing to say under reduced motion — and
       * without the decay loop below it would otherwise stick at whatever the
       * last scroll left it at. Left unset, .nav-on falls back to full opacity.
       */
      if (!isReduced && nav && speedValue !== lastSpeed) {
        nav.style.setProperty("--speed", speedValue);
        lastSpeed = speedValue;
      }
      // Clamps at 1 as soon as the hero is gone, so this stops writing entirely.
      if (hero && heroValue !== lastHero) {
        hero.style.setProperty("--hero", heroValue);
        lastHero = heroValue;
      }

      /*
       * Safety net for the reveal observer. IntersectionObserver samples rather
       * than integrating, so a fast jump — an anchor link, a flung trackpad —
       * can carry an element through the viewport between two deliveries and
       * leave it stuck at opacity 0. Anything on screen right now gets revealed
       * regardless of whether the observer saw it.
       */
      registry.current.reveals = reveals.filter((node, index) => {
        const rect = revealRects[index];
        if (rect.top < vh * 0.92 && rect.bottom > 0) {
          node.classList.add("in");
          return false;
        }
        return true;
      });

      if (!isReduced) {
        parallax.forEach((node, index) => {
          const rect = parallaxRects[index];
          if (rect.bottom < -240 || rect.top > vh + 240) return;
          const centre = (rect.top + rect.height / 2 - vh / 2) / vh; // -1 above, +1 below
          const depth = Number(node.dataset.parallax) || 1;
          node.style.setProperty("--py", `${(centre * -26 * depth).toFixed(2)}px`);
          node.style.setProperty("--pr", `${(centre * 1.1 * depth).toFixed(3)}deg`);
          // --vel rides along here for the same reason --scroll rides on the nav.
          node.style.setProperty("--vel", velocity.toFixed(3));
          if (node.hasAttribute("data-scale")) {
            node.style.setProperty("--sc", (0.94 + (1 - Math.min(Math.abs(centre), 1)) * 0.06).toFixed(3));
          }
        });

        rails.forEach((node, index) => {
          const rect = railRects[index];
          const progress = (vh * 0.5 - rect.top) / rect.height;
          node.style.setProperty("--fill", Math.max(0, Math.min(progress, 1)).toFixed(3));
        });
      }

      /*
       * Last, so a React render scheduled off these can never land between the
       * read phase and the writes above.
       */
      setScrolled(y > 24);
      // Which section owns the viewport centre — drives the nav underline.
      let current = "";
      sectionTops.forEach((top, index) => {
        if (top <= y + vh * 0.35) current = sections[index].id;
      });
      setActive(current);

      if (!isReduced && Math.abs(velocity) > 0.002 && !frame) frame = requestAnimationFrame(update);
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

/**
 * Ticks up to a metric, then lands on the exact sourced string rather than a
 * reconstruction from the interpolated float — the figures come from the
 * training logs and have to survive the animation intact.
 */
export function useCountUp(metric, active) {
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
