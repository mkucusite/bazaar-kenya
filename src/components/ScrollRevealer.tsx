import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SELECTOR = [
  "[data-reveal]",
  ".scroll-reveal",
  ".listing-card-motion",
].join(",");

/**
 * Global scroll transitions: fades + lifts elements into view as the user scrolls.
 * Uses IntersectionObserver so it works in every browser (not just Chromium's view() timeline).
 */
const ScrollRevealer = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.classList.add("reveal-in");
          observer.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.06 },
    );

    const register = (el: Element) => {
      if (!(el instanceof HTMLElement)) return;
      if (el.dataset.revealBound === "1") return;
      el.dataset.revealBound = "1";
      // Already in view on first paint: show immediately, no flash.
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) {
        el.classList.add("reveal-ready", "reveal-in");
        return;
      }
      el.classList.add("reveal-ready");
      observer.observe(el);
    };

    let scanQueued = false;
    const scan = () => {
      scanQueued = false;
      document.querySelectorAll(SELECTOR).forEach(register);
    };
    const queueScan = () => {
      if (scanQueued) return;
      scanQueued = true;
      window.requestAnimationFrame(scan);
    };

    scan();

    const mutation = new MutationObserver(queueScan);
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutation.disconnect();
      observer.disconnect();
      document
        .querySelectorAll<HTMLElement>("[data-reveal-bound]")
        .forEach((el) => delete el.dataset.revealBound);
    };
  }, [location.pathname]);

  return null;
};

export default ScrollRevealer;
