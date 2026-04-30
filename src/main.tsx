import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Remove SEO fallback once React hydrates
const seoFallback = document.getElementById("seo-fallback");
if (seoFallback) seoFallback.remove();

// SEO: prevent service-worker registration for crawlers / preview iframes.
// Googlebot rendering was failing on registerSW.js — kill it for bots.
const ua = navigator.userAgent || "";
const isCrawler = /bot|crawler|spider|crawling|googlebot|bingbot|duckduckbot|yandex|baiduspider|facebookexternalhit|twitterbot|whatsapp|slackbot|telegrambot|linkedinbot|embedly|applebot|lighthouse|chrome-lighthouse|headlesschrome/i.test(ua);
const isInIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
const isPreviewHost = window.location.hostname.includes("lovableproject.com") || window.location.hostname.includes("id-preview--");

if (isCrawler || isInIframe || isPreviewHost) {
  (window as any).__DISABLE_PWA__ = true;
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    }).catch(() => {});
  }
}

createRoot(document.getElementById("root")!).render(<App />);
