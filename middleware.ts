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

  // Only intercept /ads/:slug for bots
  if (url.pathname.startsWith("/ads/") && BOT_PATTERN.test(ua)) {
    const slug = url.pathname.replace("/ads/", "");
    const ogUrl = `${SUPABASE_OG}/ad/${encodeURIComponent(slug)}`;
    return fetch(ogUrl);
  }

  return new Response(null, {
    status: 302,
    headers: { Location: url.pathname },
  });
}
