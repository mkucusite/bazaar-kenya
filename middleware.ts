import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BOT_PATTERN =
  /bot|crawl|spider|googlebot|bingbot|yandex|baidu|duckduck|facebookexternalhit|whatsapp|twitterbot|slackbot|telegrambot|discordbot|linkedinbot|applebot|semrush|ahrefs/i;

const SUPABASE_OG =
  "https://tpthlopfhyuuspgooblk.supabase.co/functions/v1/og-share";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ua = request.headers.get("user-agent") || "";

  // Only intercept /ads/:slug for bots
  if (pathname.startsWith("/ads/") && BOT_PATTERN.test(ua)) {
    const slug = pathname.replace("/ads/", "");
    const ogUrl = `${SUPABASE_OG}/ad/${encodeURIComponent(slug)}`;
    return NextResponse.rewrite(ogUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/ads/:slug*"],
};
