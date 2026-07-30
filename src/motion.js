import { useEffect, useRef, useState } from "react";

/*
 * The scroll-motion system. Nothing here animates in JS — one rAF-throttled
 * pass writes CSS custom properties and styles.css consumes them. The DOM
 * contract (data-reveal, data-stagger, data-parallax, data-scale, data-rail,
 * data-magnet) is documented in CLAUDE.md; new markup has to opt in.
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
 *  --scroll   page progress, for the nav rule
 *  --hero     hero exit progress, for the fade/lift as you leave it
 *  --py/--pr  per-element parallax offset and rotation
 *  --fill     per-project rail progress
 */
export function useScrollMotion() {
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
export function usePointerMagnet() {
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
