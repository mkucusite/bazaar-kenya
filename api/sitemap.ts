// Self-contained dynamic sitemap (runs on the site host, reads the live database).
import { POLITICIAN_SLUGS } from "./_politician-slugs.js";

const SITE = "https://www.kenyaadverts.com";
const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://ygwtyyitntauqdghykuf.supabase.co";
const SB_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnd3R5eWl0bnRhdXFkZ2h5a3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjcyODgsImV4cCI6MjEwNDY0MzI4OH0.uWY1fvA9khbEXtSfPU4ulUXu09IaJL9SYKgal-X_hNc";
const PAGE = 5000;

type U = { loc: string; lastmod?: string; changefreq?: string; priority?: number };
const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/'/g, "&apos;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const day = (v?: string | null) => { if (!v) return undefined; const d = new Date(v); return isNaN(+d) ? undefined : d.toISOString().slice(0, 10); };
const slugify = (t: string) => (t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90) || "listing";
const cslug = (c: string) => c.toLowerCase().replace(/\s+/g, "-").replace(/'/g, "");

const urlset = (urls: U[]) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ""}${u.priority !== undefined ? `<priority>${u.priority.toFixed(1)}</priority>` : ""}</url>`)
    .join("\n")}\n</urlset>`;
const index = (locs: { loc: string; lastmod?: string }[]) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locs
    .map((e) => `  <sitemap><loc>${esc(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}</sitemap>`)
    .join("\n")}\n</sitemapindex>`;

async function q(path: string, range?: [number, number], count = false): Promise<{ rows: any[]; total: number }> {
  const headers: Record<string, string> = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` };
  if (range) headers.Range = `${range[0]}-${range[1]}`;
  if (count) headers.Prefer = "count=exact";
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${path}`, { headers });
    if (!r.ok) return { rows: [], total: 0 };
    const total = Number((r.headers.get("content-range") || "").split("/")[1]) || 0;
    return { rows: await r.json(), total };
  } catch { return { rows: [], total: 0 }; }
}
async function all(path: string, max = 20000) {
  const out: any[] = [];
  for (let f = 0; f < max; f += 1000) {
    const { rows } = await q(path, [f, f + 999]);
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

const COUNTIES = ["Mombasa","Kwale","Kilifi","Tana River","Lamu","Taita-Taveta","Garissa","Wajir","Mandera","Marsabit","Isiolo","Meru","Tharaka-Nithi","Embu","Kitui","Machakos","Makueni","Nyandarua","Nyeri","Kirinyaga","Murang'a","Kiambu","Turkana","West Pokot","Samburu","Trans-Nzoia","Baringo","Uasin Gishu","Elgeyo-Marakwet","Nandi","Laikipia","Nakuru","Narok","Kajiado","Kericho","Bomet","Kakamega","Vihiga","Bungoma","Busia","Siaya","Kisumu","Homa Bay","Migori","Kisii","Nyamira","Nairobi"];
const DIR: Record<string, string> = { doctor: "doctors", developer: "developers", wellness: "wellness", job: "jobs", hotel: "hotels", vehicle: "vehicles", tour: "tours", restaurant: "restaurants", salon: "salons", school: "schools", fitness: "gyms", artisan: "artisans", "event-service": "event-services" };
const ADS = "ads?status=eq.active&is_listed=eq.true&is_hidden_by_report=eq.false";
const POS = ["Governor", "Senator", "MP", "Women Rep", "MCA"];

async function build(type: string): Promise<string> {
  const today = new Date().toISOString().slice(0, 10);
  if (type === "index")
    return index(["pages", "marketplace", "directory", "content", "politics", "places"].map((s) => ({ loc: `${SITE}/sitemap-${s}.xml`, lastmod: today })));

  if (type === "marketplace") {
    const { total } = await q(`${ADS}&select=id`, [0, 0], true);
    const pages = Math.max(1, Math.ceil(total / PAGE));
    return index([{ loc: `${SITE}/sitemap-categories.xml` }, ...Array.from({ length: pages }, (_, i) => ({ loc: `${SITE}/sitemap-listings-p${i + 1}.xml`, lastmod: today }))]);
  }
  const lp = /^listings(?:-p(\d+))?$/.exec(type);
  if (lp) {
    const p = Math.max(1, Number(lp[1] || 1));
    const rows: any[] = [];
    for (let o = (p - 1) * PAGE; o < p * PAGE; o += 1000) {
      const { rows: r } = await q(`${ADS}&select=slug,title,updated_at,created_at&order=created_at.desc`, [o, o + 999]);
      rows.push(...r);
      if (r.length < 1000) break;
    }
    return urlset(rows.map((a) => ({ loc: `${SITE}/ads/${a.slug || slugify(a.title)}`, lastmod: day(a.updated_at || a.created_at), changefreq: "weekly", priority: 0.7 })));
  }
  if (type === "categories") {
    const cats = await all("categories?select=name", 2000);
    const urls: U[] = [];
    cats.forEach((c) => {
      urls.push({ loc: `${SITE}/search?category=${encodeURIComponent(c.name)}`, changefreq: "daily", priority: 0.8 });
      COUNTIES.forEach((k) => urls.push({ loc: `${SITE}/search?category=${encodeURIComponent(c.name)}&county=${encodeURIComponent(k)}`, changefreq: "weekly", priority: 0.5 }));
    });
    return urlset(urls);
  }
  if (type === "directory")
    return index(Object.values(DIR).map((p) => ({ loc: `${SITE}/sitemap-directory-${p}.xml`, lastmod: today })));
  const dm = /^directory-(.+)$/.exec(type);
  if (dm) {
    const kind = Object.keys(DIR).find((k) => DIR[k] === dm[1]);
    const urls: U[] = [{ loc: `${SITE}/${dm[1]}`, changefreq: "daily", priority: 0.8 }];
    if (kind) {
      const rows = await all(`directory_profiles?is_published=eq.true&kind=eq.${encodeURIComponent(kind)}&select=slug,county,updated_at,created_at`);
      const counties = new Set<string>();
      rows.forEach((d) => { if (d.slug) urls.push({ loc: `${SITE}/${dm[1]}/${d.slug}`, lastmod: day(d.updated_at || d.created_at), changefreq: "weekly", priority: 0.7 }); if (d.county) counties.add(d.county); });
      counties.forEach((c) => urls.push({ loc: `${SITE}/${dm[1]}?county=${encodeURIComponent(c)}`, changefreq: "weekly", priority: 0.5 }));
    }
    return urlset(urls);
  }
  if (type === "content") return index(["blog", "events", "digital", "banners"].map((s) => ({ loc: `${SITE}/sitemap-${s}.xml`, lastmod: today })));
  if (type === "blog") {
    const r = await all("blog_posts?is_published=eq.true&select=slug,updated_at,created_at");
    return urlset([{ loc: `${SITE}/blog`, changefreq: "daily", priority: 0.8 }, ...r.filter((p) => p.slug).map((p) => ({ loc: `${SITE}/blog/${p.slug}`, lastmod: day(p.updated_at || p.created_at), changefreq: "monthly", priority: 0.7 }))]);
  }
  if (type === "events") {
    const r = await all("events?is_published=eq.true&select=slug,updated_at,created_at");
    return urlset([{ loc: `${SITE}/events`, changefreq: "daily", priority: 0.8 }, ...r.filter((e) => e.slug).map((e) => ({ loc: `${SITE}/events/${e.slug}`, lastmod: day(e.updated_at || e.created_at), changefreq: "daily", priority: 0.7 }))]);
  }
  if (type === "digital") {
    const r = await all("digital_products?is_published=eq.true&select=slug,updated_at,created_at");
    return urlset([{ loc: `${SITE}/digital-store`, changefreq: "daily", priority: 0.8 }, ...r.filter((p) => p.slug).map((p) => ({ loc: `${SITE}/digital-store/${p.slug}`, lastmod: day(p.updated_at || p.created_at), changefreq: "weekly", priority: 0.7 }))]);
  }
  if (type === "banners") {
    const r = await all("banner_campaigns?status=eq.active&select=id,slug,category,updated_at,created_at");
    return urlset([{ loc: `${SITE}/banners`, changefreq: "daily", priority: 0.8 }, ...r.map((b) => ({ loc: `${SITE}${b.category === "politician" ? "/politics" : "/banners"}/${b.slug || b.id}`, lastmod: day(b.updated_at || b.created_at), changefreq: "weekly", priority: 0.6 }))]);
  }
  if (type === "politics") return index(["politicians", "seats"].map((s) => ({ loc: `${SITE}/sitemap-${s}.xml`, lastmod: today })));
  if (type === "politicians") {
    const urls: U[] = [{ loc: `${SITE}/politicians`, changefreq: "daily", priority: 0.9 }, { loc: `${SITE}/politics`, changefreq: "daily", priority: 0.8 }, { loc: `${SITE}/elections-2027`, changefreq: "daily", priority: 0.8 }];
    (POLITICIAN_SLUGS as string[]).forEach((s) => urls.push({ loc: `${SITE}/politicians/${s}`, changefreq: "weekly", priority: 0.6 }));
    return urlset(urls);
  }
  if (type === "seats") {
    const urls: U[] = [];
    COUNTIES.forEach((c) => POS.forEach((p) => urls.push({ loc: `${SITE}/seats/${cslug(c)}/${p.toLowerCase().replace(/\s+/g, "-")}`, changefreq: "weekly", priority: 0.5 })));
    return urlset(urls);
  }
  if (type === "places") return urlset(COUNTIES.map((c) => ({ loc: `${SITE}/counties/${cslug(c)}`, changefreq: "daily", priority: 0.7 })));

  // pages
  const hubs = ["/search", "/events", "/blog", "/digital-store", "/banners", "/politics", "/politicians", "/services", "/advertise", ...Object.values(DIR).map((p) => `/${p}`)];
  return urlset([
    { loc: `${SITE}/`, changefreq: "hourly", priority: 1.0 },
    ...hubs.map((h) => ({ loc: `${SITE}${h}`, changefreq: "daily", priority: 0.9 })),
    ...["/about", "/faqs", "/terms", "/privacy", "/safety-tips", "/subscriptions", "/credits"].map((p) => ({ loc: `${SITE}${p}`, changefreq: "monthly", priority: 0.4 })),
  ]);
}

export default async function handler(req: any, res: any) {
  const type = String(req.query?.type || "index").toLowerCase().replace(/[^a-z0-9-]/g, "");
  try {
    const body = await build(type);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=604800");
    res.status(200).send(body);
  } catch (e: any) {
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.status(200).send(urlset([{ loc: `${SITE}/`, priority: 1.0 }]));
  }
}
