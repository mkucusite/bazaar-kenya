import type { VercelRequest, VercelResponse } from "@vercel/node";

const BOT_PATTERN =
  /bot|crawl|spider|googlebot|bingbot|yandex|baidu|duckduck|facebookexternalhit|whatsapp|twitterbot|slackbot|telegrambot|discordbot|linkedinbot|applebot|semrush|ahrefs/i;

const SUPABASE_OG =
  "https://tpthlopfhyuuspgooblk.supabase.co/functions/v1/og-share";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ua = req.headers["user-agent"] || "";
  const slug = (req.query.slug as string) || "";

  if (BOT_PATTERN.test(ua)) {
    const ogUrl = `${SUPABASE_OG}/ad/${encodeURIComponent(slug)}`;
    const ogRes = await fetch(ogUrl);
    const html = await ogRes.text();
    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(html);
  }

  res.redirect(302, `/ads/${slug}`);
}
