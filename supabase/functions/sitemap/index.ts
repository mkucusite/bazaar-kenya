import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeXml(s: string = "") {
  const normalized = s.replace(/https:\/\/cdn\.kenyaadverts\.com/g, "https://cdn.kenyaadverts.co.ke");
  return normalized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function compactText(value: string = "", max = 180) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  return clean.length > max ? `${clean.slice(0, max - 3)}...` : clean;
}

const baseUrl = "https://www.kenyaadverts.com";

// Strip query string and trailing slash; reject disallowed paths.
function isAllowedPath(path: string): boolean {
  if (!path) return false;
  // Reject anything with query params at all (sitemaps must not contain them)
  if (path.includes("?")) return false;
  const banned = ["/search", "/login", "/register", "/reset-password"];
  if (banned.some((b) => path === b || path.startsWith(b + "/"))) return false;
  return true;
}

function urlEntry(path: string, lastmod: string, changefreq: string, priority: string, imageXml = "") {
  const cleanPath = path.replace(/\/+$/, "") || "/";
  const loc = cleanPath === "/" ? baseUrl : `${baseUrl}${cleanPath}`;
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageXml}
  </url>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "index";
  const categorySlug = url.searchParams.get("category") || "";
  const today = new Date().toISOString().split("T")[0];

  let xml = "";

  if (type === "index") {
    const sitemaps = [
      `${baseUrl}/sitemap-static.xml`,
      `${baseUrl}/sitemap-blog.xml`,
      `${baseUrl}/sitemap-events.xml`,
      `${baseUrl}/sitemap-banners.xml`,
      `${baseUrl}/sitemap-politics.xml`,
      `${baseUrl}/sitemap-elections.xml`,
      `${baseUrl}/sitemap-markets.xml`,
      `${baseUrl}/sitemap-digital.xml`,
      `${baseUrl}/sitemap-listings-index.xml`,
    ];
    xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(loc => `  <sitemap><loc>${loc}</loc><lastmod>${today}</lastmod></sitemap>`).join("\n")}
</sitemapindex>`;
  }

  else if (type === "static") {
    const pages = [
      { loc: "/", priority: "1.0", cf: "daily" },
      { loc: "/about", priority: "0.6", cf: "monthly" },
      { loc: "/faqs", priority: "0.5", cf: "monthly" },
      { loc: "/blog", priority: "0.7", cf: "weekly" },
      { loc: "/events", priority: "0.8", cf: "daily" },
      { loc: "/banners", priority: "0.7", cf: "weekly" },
      { loc: "/politics", priority: "0.7", cf: "weekly" },
      { loc: "/advertise", priority: "0.6", cf: "monthly" },
      { loc: "/safety-tips", priority: "0.5", cf: "monthly" },
      { loc: "/subscriptions", priority: "0.5", cf: "monthly" },
      { loc: "/digital-store", priority: "0.8", cf: "daily" },
      { loc: "/terms", priority: "0.4", cf: "monthly" },
      { loc: "/privacy", priority: "0.4", cf: "monthly" },
      { loc: "/elections-2027", priority: "0.9", cf: "daily" },
      { loc: "/governors-2027", priority: "0.8", cf: "weekly" },
      { loc: "/senators-2027", priority: "0.8", cf: "weekly" },
      { loc: "/mps-2027", priority: "0.8", cf: "weekly" },
      { loc: "/women-reps-2027", priority: "0.8", cf: "weekly" },
      { loc: "/mca-2027", priority: "0.8", cf: "weekly" },
    ].filter((p) => isAllowedPath(p.loc));
    xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => urlEntry(p.loc, today, p.cf, p.priority)).join("\n")}
</urlset>`;
  }

  else if (type === "listings-index") {
    const { data: cats } = await supabase.from("categories").select("name");
    const slugifyName = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${(cats || []).map((c: any) => `  <sitemap>\n    <loc>${baseUrl}/sitemap-listings-${slugifyName(c.name)}.xml</loc>\n    <lastmod>${today}</lastmod>\n  </sitemap>`).join("\n")}
</sitemapindex>`;
  }

  else if (type === "listings-category" && categorySlug) {
    const categoryName = categorySlug.replace(/-/g, " ");
    const { data: catRow } = await supabase.from("categories").select("id, name").ilike("name", `%${categoryName}%`).limit(1).maybeSingle();

    let ads: any[] = [];
    if (catRow) {
      const { data } = await supabase
        .from("ads")
        .select("slug, title, description, updated_at, images, is_hidden_by_report")
        .eq("status", "active")
        .eq("category_id", catRow.id)
        .order("updated_at", { ascending: false })
        .limit(10000);
      ads = data || [];
    }

    const urls = ads.filter((ad: any) => ad.is_hidden_by_report !== true && ad.slug).map((ad: any) => {
      const imgs: string[] = Array.isArray(ad.images) ? ad.images.filter((i: string) => i && !i.includes("placeholder")) : [];
      const caption = compactText(ad.description || ad.title);
      const imgXml = imgs.slice(0, 5).map(img =>
        `\n    <image:image><image:loc>${escapeXml(img)}</image:loc><image:title>${escapeXml(ad.title)}</image:title>${caption ? `<image:caption>${escapeXml(caption)}</image:caption>` : ""}</image:image>`
      ).join("");
      const lastmod = ad.updated_at ? new Date(ad.updated_at).toISOString().split("T")[0] : today;
      return urlEntry(`/ads/${ad.slug}`, lastmod, "weekly", "0.8", imgXml);
    });

    xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`;
  }

  else if (type === "blog") {
    const { data: posts } = await supabase
      .from("blog_posts")
      .select("slug, title, excerpt, updated_at, image")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(5000);

    const urls = (posts || []).filter((p: any) => p.slug).map((p: any) => {
      const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : today;
      const caption = compactText(p.excerpt || p.title);
      const imgXml = p.image ? `\n    <image:image><image:loc>${escapeXml(p.image)}</image:loc>${p.title ? `<image:title>${escapeXml(p.title)}</image:title>` : ""}${caption ? `<image:caption>${escapeXml(caption)}</image:caption>` : ""}</image:image>` : "";
      return urlEntry(`/blog/${p.slug}`, lastmod, "weekly", "0.6", imgXml);
    });

    xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`;
  }

  else if (type === "banners" || type === "campaigns" || type === "politics") {
    const isPolitics = type === "politics";
    let query = supabase
      .from("banner_campaigns")
      .select("id, slug, business_name, banner_image, description, updated_at, is_hidden_by_report, category")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(5000);
    query = isPolitics ? query.eq("category", "politician") : query.neq("category", "politician");
    const { data: campaigns } = await query;

    const routePrefix = isPolitics ? "/politics" : "/banners";
    const urls = (campaigns || []).filter((c: any) => c.is_hidden_by_report !== true && (c.slug || c.id)).map((c: any) => {
      const lastmod = c.updated_at ? new Date(c.updated_at).toISOString().split("T")[0] : today;
      const slugOrId = c.slug || c.id;
      const caption = compactText(c.description || c.business_name);
      const imgXml = c.banner_image ? `\n    <image:image><image:loc>${escapeXml(c.banner_image)}</image:loc><image:title>${escapeXml(c.business_name)}</image:title>${caption ? `<image:caption>${escapeXml(caption)}</image:caption>` : ""}</image:image>` : "";
      return urlEntry(`${routePrefix}/${slugOrId}`, lastmod, "weekly", isPolitics ? "0.7" : "0.6", imgXml);
    });

    xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`;
  }

  else if (type === "markets") {
    const { data: ads } = await supabase
      .from("ads")
      .select("user_id, updated_at")
      .eq("status", "active")
      .limit(10000);
    const seen = new Map<string, string>();
    (ads || []).forEach((a: any) => {
      const prev = seen.get(a.user_id);
      const lm = a.updated_at ? new Date(a.updated_at).toISOString().split("T")[0] : today;
      if (!prev || lm > prev) seen.set(a.user_id, lm);
    });
    const urls = Array.from(seen.entries()).map(([uid, lm]) => urlEntry(`/market/${uid}`, lm, "weekly", "0.5"));
    xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
  }

  else if (type === "events") {
    const { data: events } = await supabase
      .from("events")
      .select("slug, title, description, cover_image, updated_at, is_hidden_by_report")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(5000);

    const urls = (events || []).filter((e: any) => e.is_hidden_by_report !== true && e.slug).map((e: any) => {
      const lastmod = e.updated_at ? new Date(e.updated_at).toISOString().split("T")[0] : today;
      const caption = compactText(e.description || e.title);
      const imgXml = e.cover_image ? `\n    <image:image><image:loc>${escapeXml(e.cover_image)}</image:loc><image:title>${escapeXml(e.title)}</image:title>${caption ? `<image:caption>${escapeXml(caption)}</image:caption>` : ""}</image:image>` : "";
      return urlEntry(`/events/${e.slug}`, lastmod, "weekly", "0.7", imgXml);
    });

    xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`;
  }

  else if (type === "digital") {
    const { data: products } = await supabase
      .from("digital_products")
      .select("slug, title, short_description, images, updated_at")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(5000);

    const urls = (products || []).filter((p: any) => p.slug).map((p: any) => {
      const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : today;
      const imgs: string[] = Array.isArray(p.images) ? p.images.filter((i: string) => i && !i.includes("placeholder")) : [];
      const caption = compactText(p.short_description || p.title);
      const imgXml = imgs.slice(0, 5).map((img) =>
        `\n    <image:image><image:loc>${escapeXml(img)}</image:loc><image:title>${escapeXml(p.title)}</image:title>${caption ? `<image:caption>${escapeXml(caption)}</image:caption>` : ""}</image:image>`
      ).join("");
      return urlEntry(`/digital-store/${p.slug}`, lastmod, "weekly", "0.7", imgXml);
    });

    xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`;
  }

  else if (type === "elections") {
    const counties = [
      "mombasa","kwale","kilifi","tana-river","lamu","taita-taveta","garissa","wajir","mandera","marsabit",
      "isiolo","meru","tharaka-nithi","embu","kitui","machakos","makueni","nyandarua","nyeri","kirinyaga",
      "murang-a","kiambu","turkana","west-pokot","samburu","trans-nzoia","uasin-gishu","elgeyo-marakwet","nandi","baringo",
      "laikipia","nakuru","narok","kajiado","kericho","bomet","kakamega","vihiga","bungoma","busia",
      "siaya","kisumu","homa-bay","migori","kisii","nyamira","nairobi",
    ];
    const positions = ["governor","senator","women-rep","mp","mca"];
    const positionHubs = ["governors-2027","senators-2027","women-reps-2027","mps-2027","mca-2027"];
    const urls: string[] = [];
    urls.push(urlEntry("/elections-2027", today, "daily", "0.9"));
    positionHubs.forEach((p) => urls.push(urlEntry(`/${p}`, today, "daily", "0.8")));
    counties.forEach((c) => {
      urls.push(urlEntry(`/counties/${c}`, today, "weekly", "0.7"));
      positions.forEach((p) => urls.push(urlEntry(`/seats/${c}/${p}`, today, "weekly", "0.7")));
    });
    xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
  }

  else {
    xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
  }

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=60",
    },
  });
});
