import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { POLITICIAN_SLUGS } from "./politician-slugs.ts";

const SITE_URL = "https://www.kenyaadverts.com";
const PAGE_SIZE = 5000; // urls per listings child sitemap

type Url = { loc: string; lastmod?: string; changefreq?: string; priority?: number };

const xmlEscape = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/'/g, "&apos;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const day = (v?: string | null) => (v ? new Date(v).toISOString().split("T")[0] : undefined);

const slugify = (t: string) =>
  (t || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90) || "listing";

function urlsetXml(urls: Url[]) {
  const body = urls
    .map((u) =>
      [
        "  <url>",
        `    <loc>${xmlEscape(u.loc)}</loc>`,
        u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>` : null,
        u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>` : null,
        u.priority !== undefined ? `    <priority>${u.priority.toFixed(1)}</priority>` : null,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

function indexXml(entries: { loc: string; lastmod?: string }[]) {
  const body = entries
    .map((e) =>
      ["  <sitemap>", `    <loc>${xmlEscape(e.loc)}</loc>`, e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null, "  </sitemap>"]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`;
}

const xml = (body: string) =>
  new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600", "Access-Control-Allow-Origin": "*" },
  });

/** Paged fetch — Supabase caps a single request, so walk in 1000-row windows. */
async function fetchAll(sb: any, table: string, columns: string, apply: (q: any) => any, max = 60000) {
  const out: any[] = [];
  const step = 1000;
  for (let from = 0; from < max; from += step) {
    const { data, error } = await apply(sb.from(table).select(columns)).range(from, from + step - 1);
    if (error || !data || data.length === 0) break;
    out.push(...data);
    if (data.length < step) break;
  }
  return out;
}

const COUNTIES = [
  "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita-Taveta", "Garissa", "Wajir",
  "Mandera", "Marsabit", "Isiolo", "Meru", "Tharaka-Nithi", "Embu", "Kitui", "Machakos",
  "Makueni", "Nyandarua", "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Turkana", "West Pokot",
  "Samburu", "Trans-Nzoia", "Baringo", "Uasin Gishu", "Elgeyo-Marakwet", "Nandi", "Laikipia",
  "Nakuru", "Narok", "Kajiado", "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia",
  "Siaya", "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi",
];

/** Every public directory vertical → its route base (matches src/lib/directory.ts). */
const DIR_PATHS: Record<string, string> = {
  doctor: "/doctors",
  developer: "/developers",
  wellness: "/wellness",
  job: "/jobs",
  hotel: "/hotels",
  vehicle: "/vehicles",
  tour: "/tours",
  restaurant: "/restaurants",
  salon: "/salons",
  school: "/schools",
  fitness: "/gyms",
  artisan: "/artisans",
  "event-service": "/event-services",
};

const countySlug = (c: string) => c.toLowerCase().replace(/\s+/g, "-").replace(/'/g, "");

/** Home, hubs and evergreen pages (no county facets — those live in /sitemap-places.xml). */
function pageUrls(): Url[] {
  const urls: Url[] = [{ loc: SITE_URL, changefreq: "hourly", priority: 1.0 }];
  const hubs = [
    "/search", "/events", "/blog", "/digital-store", "/banners", "/politics", "/politicians",
    "/services", "/advertise", ...Object.values(DIR_PATHS),
  ];
  hubs.forEach((h) => urls.push({ loc: `${SITE_URL}${h}`, changefreq: "daily", priority: 0.9 }));

  ["/about", "/faqs", "/terms", "/privacy", "/safety-tips", "/subscriptions", "/credits", "/post"].forEach((p) =>
    urls.push({ loc: `${SITE_URL}${p}`, changefreq: "monthly", priority: 0.5 }),
  );
  return urls;
}

/** County landing + county search pages. */
function placeUrls(): Url[] {
  const urls: Url[] = [];
  COUNTIES.forEach((c) => {
    urls.push({ loc: `${SITE_URL}/counties/${countySlug(c)}`, changefreq: "daily", priority: 0.8 });
    urls.push({ loc: `${SITE_URL}/search?county=${encodeURIComponent(c)}`, changefreq: "daily", priority: 0.7 });
  });
  return urls;
}

serve(async (req) => {
  try {
    const reqUrl = new URL(req.url);
    const type = (reqUrl.searchParams.get("type") || "index").toLowerCase();
    const page = Math.max(1, Number(reqUrl.searchParams.get("p") || "1"));
    const category = reqUrl.searchParams.get("category") || "";

    const sbUrl = Deno.env.get("SUPABASE_URL");
    const sbKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!sbUrl || !sbKey) throw new Error("Missing Supabase environment variables");
    const sb = createClient(sbUrl, sbKey);

    const kindParam = (reqUrl.searchParams.get("kind") || "").toLowerCase();

    const adPages = async () => {
      const { count } = await sb
        .from("ads")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .eq("is_listed", true)
        .eq("is_hidden_by_report", false);
      return Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));
    };

    // ---------- master index: only top-level SECTIONS, each opening its own index ----------
    if (type === "index") {
      return xml(
        indexXml([
          { loc: `${SITE_URL}/sitemap-pages.xml` },
          { loc: `${SITE_URL}/sitemap-marketplace.xml` },
          { loc: `${SITE_URL}/sitemap-directory.xml` },
          { loc: `${SITE_URL}/sitemap-content.xml` },
          { loc: `${SITE_URL}/sitemap-politics.xml` },
          { loc: `${SITE_URL}/sitemap-places.xml` },
        ]),
      );
    }

    // ---------- section: marketplace (classified ads + category facets) ----------
    if (type === "marketplace") {
      const pages = await adPages();
      return xml(
        indexXml([
          { loc: `${SITE_URL}/sitemap-categories.xml` },
          ...Array.from({ length: pages }, (_, i) => ({ loc: `${SITE_URL}/sitemap-listings-p${i + 1}.xml` })),
        ]),
      );
    }

    if (type === "listings-index") {
      const pages = await adPages();
      return xml(indexXml(Array.from({ length: pages }, (_, i) => ({ loc: `${SITE_URL}/sitemap-listings-p${i + 1}.xml` }))));
    }

    // ---------- section: directory (one child sitemap per vertical) ----------
    if ((type === "directory" || type === "business") && !kindParam) {
      // lastmod comes from the newest published profile in each vertical (authoritative, page-specific).
      const entries = await Promise.all(
        Object.entries(DIR_PATHS).map(async ([kind, path]) => {
          const { data } = await sb
            .from("directory_profiles")
            .select("updated_at, created_at")
            .eq("is_published", true)
            .eq("kind", kind)
            .order("updated_at", { ascending: false })
            .limit(1);
          const row = data?.[0];
          return {
            loc: `${SITE_URL}/sitemap-directory-${path.replace(/^\//, "")}.xml`,
            lastmod: row ? day(row.updated_at || row.created_at) : undefined,
          };
        }),
      );
      return xml(indexXml(entries));
    }


    // ---------- section: editorial & commerce content ----------
    if (type === "content") {
      return xml(
        indexXml([
          { loc: `${SITE_URL}/sitemap-blog.xml` },
          { loc: `${SITE_URL}/sitemap-events.xml` },
          { loc: `${SITE_URL}/sitemap-digital.xml` },
          { loc: `${SITE_URL}/sitemap-banners.xml` },
        ]),
      );
    }

    // ---------- section: politics ----------
    if (type === "politics" || type === "elections" || type === "parties") {
      return xml(
        indexXml([
          { loc: `${SITE_URL}/sitemap-politicians.xml` },
          { loc: `${SITE_URL}/sitemap-seats.xml` },
        ]),
      );
    }

    // ---------- listings (ads), paginated ----------
    if (type === "listings" || type === "listings-page" || type === "listings-category") {
      // Guard: /sitemap-listings-pN.xml can fall through to the :category rewrite.
      const pageFromCategory = /^p(\d+)$/i.exec(category);
      const effPage = pageFromCategory ? Number(pageFromCategory[1]) : page;
      const isCategory = type === "listings-category" && !!category && !pageFromCategory;
      const from = isCategory ? 0 : (Math.max(1, effPage) - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const build = () => {
        let q = sb
          .from("ads")
          .select("slug, title, updated_at, created_at")
          .eq("status", "active")
          .eq("is_listed", true)
          .eq("is_hidden_by_report", false);
        if (isCategory) q = q.eq("category", category);
        return q.order("created_at", { ascending: false });
      };
      // Supabase caps a single response at 1000 rows — walk the page in windows.
      const rows: any[] = [];
      for (let off = from; off <= to; off += 1000) {
        const { data, error } = await build().range(off, Math.min(off + 999, to));
        if (error || !data || data.length === 0) break;
        rows.push(...data);
        if (data.length < 1000) break;
      }
      const urls = rows.map((a: any) => ({
        loc: `${SITE_URL}/ads/${a.slug || slugify(a.title)}`,
        lastmod: day(a.updated_at || a.created_at),
        changefreq: "weekly",
        priority: 0.7,
      }));
      return xml(urlsetXml(urls));
    }

    // ---------- categories & search facets ----------
    if (type === "categories" || type === "markets") {
      const cats = await fetchAll(sb, "categories", "name", (q: any) => q, 2000);
      const urls: Url[] = [];
      cats.forEach((c: any) => {
        urls.push({ loc: `${SITE_URL}/search?category=${encodeURIComponent(c.name)}`, changefreq: "daily", priority: 0.8 });
        COUNTIES.forEach((cty) =>
          urls.push({
            loc: `${SITE_URL}/search?category=${encodeURIComponent(c.name)}&county=${encodeURIComponent(cty)}`,
            changefreq: "weekly",
            priority: 0.6,
          }),
        );
      });
      return xml(urlsetXml(urls));
    }

    // ---------- one directory vertical (doctors, hotels, tours, salons, jobs…) ----------
    if (type === "directory" || type === "business" || type === "directory-kind") {
      const rows = await fetchAll(
        sb,
        "directory_profiles",
        "kind, slug, county, updated_at, created_at",
        (q: any) => (kindParam ? q.eq("is_published", true).eq("kind", kindParam) : q.eq("is_published", true)),
        30000,
      );
      const urls: Url[] = [];
      const facets = new Set<string>();
      rows.forEach((d: any) => {
        const base = DIR_PATHS[d.kind];
        if (!base || !d.slug) return;
        urls.push({
          loc: `${SITE_URL}${base}/${d.slug}`,
          lastmod: day(d.updated_at || d.created_at),
          changefreq: "weekly",
          priority: 0.7,
        });
        if (d.county) facets.add(`${d.kind}|${d.county}`);
      });
      facets.forEach((key) => {
        const [kind, county] = key.split("|");
        const base = DIR_PATHS[kind];
        if (base) urls.push({ loc: `${SITE_URL}${base}?county=${encodeURIComponent(county)}`, changefreq: "weekly", priority: 0.6 });
      });
      return xml(urlsetXml(urls));
    }

    if (type === "blog") {
      const rows = await fetchAll(sb, "blog_posts", "slug, updated_at, created_at", (q: any) => q.eq("is_published", true), 20000);
      return xml(
        urlsetXml(
          rows
            .filter((p: any) => p.slug)
            .map((p: any) => ({ loc: `${SITE_URL}/blog/${p.slug}`, lastmod: day(p.updated_at || p.created_at), changefreq: "monthly", priority: 0.7 })),
        ),
      );
    }

    if (type === "events") {
      const rows = await fetchAll(
        sb,
        "events",
        "slug, updated_at, created_at",
        (q: any) => q.eq("is_published", true).eq("is_listed", true),
        20000,
      );
      return xml(
        urlsetXml(
          rows
            .filter((e: any) => e.slug)
            .map((e: any) => ({ loc: `${SITE_URL}/events/${e.slug}`, lastmod: day(e.updated_at || e.created_at), changefreq: "daily", priority: 0.7 })),
        ),
      );
    }

    if (type === "banners" || type === "campaigns") {
      const rows = await fetchAll(
        sb,
        "banner_campaigns",
        "id, slug, category, updated_at, created_at",
        (q: any) => q.eq("status", "active").eq("is_listed", true),
        20000,
      );
      return xml(
        urlsetXml(
          rows.map((b: any) => ({
            loc: `${SITE_URL}${b.category === "politician" ? "/politics" : "/banners"}/${b.slug || b.id}`,
            lastmod: day(b.updated_at || b.created_at),
            changefreq: "weekly",
            priority: 0.6,
          })),
        ),
      );
    }

    if (type === "digital") {
      const rows = await fetchAll(
        sb,
        "digital_products",
        "slug, updated_at, created_at",
        (q: any) => q.eq("is_published", true).eq("approval_status", "approved"),
        20000,
      );
      return xml(
        urlsetXml(
          rows
            .filter((p: any) => p.slug)
            .map((p: any) => ({ loc: `${SITE_URL}/digital-store/${p.slug}`, lastmod: day(p.updated_at || p.created_at), changefreq: "weekly", priority: 0.7 })),
        ),
      );
    }

    if (type === "politicians") {
      const urls: Url[] = [{ loc: `${SITE_URL}/politicians`, changefreq: "daily", priority: 0.9 }];
      POLITICIAN_SLUGS.forEach((slug) => urls.push({ loc: `${SITE_URL}/politicians/${slug}`, changefreq: "weekly", priority: 0.6 }));
      const positions = ["Governor", "Senator", "MP", "Women Rep", "MCA"];
      positions.forEach((pos) => urls.push({ loc: `${SITE_URL}/politicians?position=${encodeURIComponent(pos)}`, changefreq: "weekly", priority: 0.6 }));
      COUNTIES.forEach((c) => urls.push({ loc: `${SITE_URL}/politicians?county=${encodeURIComponent(c)}`, changefreq: "weekly", priority: 0.6 }));
      return xml(urlsetXml(urls));
    }

    if (type === "seats") {
      const positions = ["Governor", "Senator", "MP", "Women Rep", "MCA"];
      const urls: Url[] = [];
      COUNTIES.forEach((c) =>
        positions.forEach((pos) =>
          urls.push({
            loc: `${SITE_URL}/seats/${countySlug(c)}/${pos.toLowerCase().replace(/\s+/g, "-")}`,
            changefreq: "weekly",
            priority: 0.6,
          }),
        ),
      );
      return xml(urlsetXml(urls));
    }

    if (type === "places" || type === "counties") {
      return xml(urlsetXml(placeUrls()));
    }

    // pages (default): home, hubs, evergreen pages
    return xml(urlsetXml(pageUrls()));
  } catch (err: any) {
    return new Response(`Error generating sitemap: ${err.message}`, { status: 500 });
  }
});
