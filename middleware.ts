import { next, rewrite } from "@vercel/edge";

// Edge middleware: when a social media crawler (Facebook, Twitter, WhatsApp, etc.)
// requests an /ads/<slug> or /blog/<slug> page, rewrite to the og-share Edge Function
// so the response carries the correct title/description/image meta tags. Real users
// continue to receive the SPA shell (index.html) and React hydrates normally.
export const config = {
  matcher: ["/ads/:path*", "/blog/:path*"],
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
  // segments[0] = "ads" | "blog", segments[1] = slug
  if (segments.length < 2) return next();

  const kind = segments[0];
  const slug = segments[1];

  if (kind === "ads") {
    return rewrite(`${OG_SHARE_BASE}/ad/${encodeURIComponent(slug)}`);
  }
  if (kind === "blog") {
    return rewrite(`${OG_SHARE_BASE}/blog/${encodeURIComponent(slug)}`);
  }
  return next();
}
