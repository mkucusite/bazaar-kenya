const BOT_PATTERN =
  /bot|crawl|spider|googlebot|bingbot|yandex|baidu|duckduck|facebookexternalhit|whatsapp|twitterbot|slackbot|telegrambot|discordbot|linkedinbot|applebot|semrush|ahrefs/i;

const SUPABASE_OG =
  "https://tpthlopfhyuuspgooblk.supabase.co/functions/v1/og-share";

export const config = {
  runtime: "edge",
  matcher: ["/ads/:slug*"],
};

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const ua = request.headers.get("user-agent") || "";

  // Only intercept /ads/:slug for social-media bots (not search engine crawlers)
  // Let Googlebot and Bingbot see the SPA so JS renders and pages get indexed
  const isSocialBot = BOT_PATTERN.test(ua) && !/googlebot|bingbot|yandex|applebot/i.test(ua);

  if (url.pathname.startsWith("/ads/") && isSocialBot) {
    const slug = url.pathname.replace("/ads/", "");
    const ogUrl = `${SUPABASE_OG}/ad/${encodeURIComponent(slug)}`;
    return fetch(ogUrl);
  }

  // For all other requests (real users + search crawlers), pass through to the SPA
  return undefined;
}
