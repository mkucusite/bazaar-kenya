import { next, rewrite } from "@vercel/edge";

// Edge middleware: when a social media crawler requests a public page,
// rewrite to the og-share Edge Function so the response carries proper
// title/description/image meta tags. Real users continue to receive the SPA
// shell (index.html) and React hydrates normally.
export const config = {
  matcher: [
    "/ads/:path*",
    "/blog/:path*",
    "/events/:path*",
    "/banners/:path*",
    "/advertise",
    "/about",
    "/search",
    "/faqs",
    "/safety-tips",
    "/privacy",
    "/terms",
    "/credits",
    "/subscriptions",
    "/post-ad",
  ],
};

const BOT_REGEX =
  /facebookexternalhit|facebookcatalog|facebot|twitterbot|whatsapp|slackbot|telegrambot|discordbot|linkedinbot|pinterest|skypeuripreview|googlebot|bingbot|applebot|embedly|quora link preview|outbrain|vkshare|w3c_validator/i;

const OG_SHARE_BASE =
  "https://tpthlopfhyuuspgooblk.supabase.co/functions/v1/og-share";

export default function middleware(request: Request) {
  const ua = request.headers.get("user-agent") || "";
  if (!BOT_REGEX.test(ua)) {
    return next();
  }

  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 1) return next();

  const kind = segments[0];
  const slug = segments[1];

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
