import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

// Tracking / non-canonical query params we never want indexed by Google.
// Stripping these client-side ensures the URL bar (and therefore canonical)
// stays clean even when users land via internal links like ?from=my-ads.
const TRACKING_PARAMS = [
  "from",
  "ref",
  "fbclid",
  "gclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "yclid",
];

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    if (!("scrollRestoration" in window.history)) return;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  // Strip tracking params on every navigation so Google sees only the canonical URL.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    let mutated = false;
    TRACKING_PARAMS.forEach((p) => {
      if (url.searchParams.has(p)) {
        url.searchParams.delete(p);
        mutated = true;
      }
    });
    // Also strip any utm_* params
    const utmKeys: string[] = [];
    url.searchParams.forEach((_, key) => {
      if (key.toLowerCase().startsWith("utm_")) utmKeys.push(key);
    });
    utmKeys.forEach((k) => {
      url.searchParams.delete(k);
      mutated = true;
    });
    if (mutated) {
      const cleaned = url.pathname + (url.search ? url.search : "") + url.hash;
      window.history.replaceState(window.history.state, "", cleaned);
    }
  }, [location.pathname, location.search]);

  useLayoutEffect(() => {
    const reset = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    reset();
    const timer = window.setTimeout(reset, 0);
    const frame = window.requestAnimationFrame(reset);

    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(frame);
    };
  }, [location.pathname, location.search, location.hash, location.key]);

  return null;
};

export default ScrollToTop;
