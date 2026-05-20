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
  /bot|crawl|spider|google|bing|yahoo|duckduck|baidu|yandex|applebot|facebookexternalhit|facebookcatalog|facebot|twitterbot|whatsapp|slackbot|telegrambot|discordbot|linkedinbot|pinterest|skypeuripreview|embedly|quora link preview|outbrain|vkshare|w3c_validator|validator/i;

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
  if (segments.length === 1) {
    return rewrite(`${OG_SHARE_BASE}/page/${encodeURIComponent(kind)}`);
  }
  return next();
}
