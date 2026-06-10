import { next, rewrite } from "@vercel/edge";

// Edge middleware: when a crawler requests a public page, rewrite to the
// og-share Edge Function so the response carries server-rendered title,
// description, canonical, OG tags, and JSON-LD. Real users continue to
// receive the SPA shell (index.html) and React hydrates normally.
export const config = {
  matcher: [
    "/((?!_next/|_static/|_vercel|favicon.ico|robots.txt|sitemap.*\\.xml|manifest.webmanifest|sw.js|registerSW.js|assets/|.*\\.(?:png|jpg|jpeg|webp|svg|ico|css|js|woff2?)$).*)",
  ],
};

const BOT_REGEX =
  /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandex|applebot|facebookexternalhit|facebookcatalog|facebot|twitterbot|whatsapp|slackbot|telegrambot|discordbot|linkedinbot|pinterest|skypeuripreview|embedly|quora link preview|outbrain|vkshare|w3c_validator|validator|ahrefsbot|semrushbot|mj12bot|dotbot|rogerbot|seznambot|petalbot|bingpreview|chatgpt|gptbot|claudebot|anthropic|perplexity|bot|crawl|spider/i;

const OG_SHARE_BASE =
  "https://tpthlopfhyuuspgooblk.supabase.co/functions/v1/og-share";

export default function middleware(request: Request) {
  const url = new URL(request.url);

  // 301 redirect: legacy .co.ke → canonical .com (preserve path + query)
  if (url.hostname.endsWith("kenyaadverts.co.ke")) {
    const target = `https://www.kenyaadverts.com${url.pathname}${url.search}`;
    return Response.redirect(target, 301);
  }

  const ua = request.headers.get("user-agent") || "";
  if (!BOT_REGEX.test(ua)) {
    return next();
  }

  if (url.pathname === "/") {
    return rewrite(`${OG_SHARE_BASE}/page/home`);
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 1) return next();

  const kind = segments[0];
  const slug = segments[1];

  if (kind === "business-profile") {
    const id = url.searchParams.get("id");
    return id
      ? rewrite(`${OG_SHARE_BASE}/business-profile?id=${encodeURIComponent(id)}`)
      : rewrite(`${OG_SHARE_BASE}/page/business-profile`);
  }

  if (kind === "ads" && slug) {
    return rewrite(`${OG_SHARE_BASE}/ad/${encodeURIComponent(slug)}`);
  }
  if (kind === "blog" && slug) {
    return rewrite(`${OG_SHARE_BASE}/blog/${encodeURIComponent(slug)}`);
  }
  if (kind === "events" && slug && slug !== "new" && slug !== "create") {
    return rewrite(`${OG_SHARE_BASE}/event/${encodeURIComponent(slug)}`);
  }
  if (kind === "banners" && slug && slug !== "new" && slug !== "create") {
    return rewrite(`${OG_SHARE_BASE}/banner/${encodeURIComponent(slug)}`);
  }

  // Elections / civic hubs — give Google a real canonical instead of the SPA shell
  if (kind === "seats" && segments[1] && segments[2]) {
    return rewrite(`${OG_SHARE_BASE}/seats/${encodeURIComponent(segments[1])}/${encodeURIComponent(segments[2])}`);
  }
  if (kind === "counties" && segments[1]) {
    return rewrite(`${OG_SHARE_BASE}/counties/${encodeURIComponent(segments[1])}`);
  }
  if (kind === "candidates" && segments[1] && segments[2] && segments[3]) {
    return rewrite(`${OG_SHARE_BASE}/candidates/${encodeURIComponent(segments[1])}/${encodeURIComponent(segments[2])}/${encodeURIComponent(segments[3])}`);
  }
  const ELECTION_HUBS = new Set([
    "elections-2027",
    "governors-2027",
    "senators-2027",
    "women-reps-2027",
    "mps-2027",
    "mca-2027",
  ]);
  if (segments.length === 1 && ELECTION_HUBS.has(kind)) {
    return rewrite(`${OG_SHARE_BASE}/hub/${encodeURIComponent(kind)}`);
  }

  // Search: ensure category/county filtered pages get a canonical that includes the
  // active filter, so Google can index them as distinct pages instead of folding
  // every variant into /search.
  if (kind === "search" && segments.length === 1) {
    const cat = url.searchParams.get("category") || "";
    const cty = url.searchParams.get("county") || "";
    const q = url.searchParams.get("q") || "";
    const params = new URLSearchParams();
    if (cat) params.set("category", cat);
    if (cty) params.set("county", cty);
    if (q) params.set("q", q);
    const qs = params.toString();
    return rewrite(`${OG_SHARE_BASE}/search${qs ? `?${qs}` : ""}`);
  }

  if (segments.length === 1) {
    return rewrite(`${OG_SHARE_BASE}/page/${encodeURIComponent(kind)}`);
  }
  return next();
}
