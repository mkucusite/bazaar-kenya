import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeXml(s: string = "") {
  return s
    .replace(/https:\/\/cdn\.kenyaadverts\.com/g, "https://cdn.kenyaadverts.co.ke")
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const baseUrl = "https://www.kenyaadverts.com";

  const url = new URL(req.url);
  const type = url.searchParams.get("type") || "index";
  const categorySlug = url.searchParams.get("category") || "";

  let xml = "";

  if (type === "index") {
    const today = new Date().toISOString().split("T")[0];
    const sitemaps = [
      `${baseUrl}/sitemap-static.xml`,
      `${baseUrl}/sitemap-listings.xml`,
      `${baseUrl}/sitemap-blog.xml`,
      `${baseUrl}/sitemap-categories.xml`,
      `${baseUrl}/sitemap-events.xml`,
      `${baseUrl}/sitemap-banners.xml`,
      `${baseUrl}/sitemap-campaigns.xml`,
      `${baseUrl}/sitemap-business.xml`,
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
      { loc: "/search", priority: "0.9", cf: "hourly" },
      { loc: "/post-ad", priority: "0.9", cf: "daily" },
      { loc: "/advertise", priority: "0.8", cf: "weekly" },
      { loc: "/banners", priority: "0.8", cf: "weekly" },
      { loc: "/events", priority: "0.8", cf: "weekly" },
      { loc: "/blog", priority: "0.7", cf: "weekly" },
      { loc: "/credits", priority: "0.7", cf: "weekly" },
      { loc: "/about", priority: "0.6", cf: "monthly" },
      { loc: "/faqs", priority: "0.5", cf: "monthly" },
      { loc: "/safety-tips", priority: "0.5", cf: "monthly" },
      { loc: "/subscriptions", priority: "0.5", cf: "monthly" },
      { loc: "/terms", priority: "0.3", cf: "monthly" },
      { loc: "/privacy", priority: "0.3", cf: "monthly" },
    ];
    xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url><loc>${baseUrl}${p.loc}</loc><changefreq>${p.cf}</changefreq><priority>${p.priority}</priority></url>`).join("\n")}
</urlset>`;
  }

  else if (type === "listings") {
    const { data: ads } = await supabase
      .from("ads")
      .select("slug, title, description, updated_at, images")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(50000);

    const urls = (ads || []).map((ad: any) => {
      const imgs: string[] = Array.isArray(ad.images) ? ad.images.filter((i: string) => i && !i.includes("placeholder")) : [];
      const caption = compactText(ad.description || ad.title);
      const imgXml = imgs.slice(0, 5).map(img =>
        `\n    <image:image><image:loc>${escapeXml(img)}</image:loc><image:title>${escapeXml(ad.title)}</image:title>${caption ? `<image:caption>${escapeXml(caption)}</image:caption>` : ""}</image:image>`
      ).join("");
      const lastmod = ad.updated_at ? new Date(ad.updated_at).toISOString().split("T")[0] : "";
      return `  <url>
    <loc>${baseUrl}/ads/${escapeXml(ad.slug || "listing")}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${imgXml}
  </url>`;
    });

    xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`;
  }

  else if (type === "listings-index") {
    const { data: cats } = await supabase.from("categories").select("name");
    const slugifyName = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const today = new Date().toISOString().split("T")[0];

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
        .select("slug, title, description, updated_at, images")
        .eq("status", "active")
        .eq("category_id", catRow.id)
        .order("updated_at", { ascending: false })
        .limit(10000);
      ads = data || [];
    }

    const urls = ads.map((ad: any) => {
      const imgs: string[] = Array.isArray(ad.images) ? ad.images.filter((i: string) => i && !i.includes("placeholder")) : [];
      const caption = compactText(ad.description || ad.title);
      const imgXml = imgs.slice(0, 5).map(img =>
        `\n    <image:image><image:loc>${escapeXml(img)}</image:loc><image:title>${escapeXml(ad.title)}</image:title>${caption ? `<image:caption>${escapeXml(caption)}</image:caption>` : ""}</image:image>`
      ).join("");
      const lastmod = ad.updated_at ? new Date(ad.updated_at).toISOString().split("T")[0] : "";
      return `  <url>
    <loc>${baseUrl}/ads/${escapeXml(ad.slug || "listing")}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${imgXml}
  </url>`;
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
      .limit(500);

    const urls = (posts || []).map((p: any) => {
      const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : "";
      const caption = compactText(p.excerpt || p.title);
      return `  <url>
    <loc>${baseUrl}/blog/${escapeXml(p.slug)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>${p.image ? `\n    <image:image><image:loc>${escapeXml(p.image)}</image:loc>${p.title ? `<image:title>${escapeXml(p.title)}</image:title>` : ""}${caption ? `<image:caption>${escapeXml(caption)}</image:caption>` : ""}</image:image>` : ""}
  </url>`;
    });

    xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`;
  }

  else if (type === "categories") {
    const { data: cats } = await supabase.from("categories").select("name");
    const urls = (cats || []).map((c: any) =>
      `  <url>\n    <loc>${baseUrl}/search?category=${encodeURIComponent(c.name)}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>`
    );

    xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
  }

  else if (type === "business") {
    const { data: profiles } = await supabase
      .from("business_profiles")
      .select("id, business_name, logo_url, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5000);

    const urls = (profiles || []).map((bp: any) => {
      const lastmod = bp.updated_at ? new Date(bp.updated_at).toISOString().split("T")[0] : "";
      return `  <url>
    <loc>${baseUrl}/business-profile?id=${bp.id}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>${bp.logo_url ? `\n    <image:image><image:loc>${escapeXml(bp.logo_url)}</image:loc><image:title>${escapeXml(bp.business_name)}</image:title></image:image>` : ""}
  </url>`;
    });

    xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`;
  }

  else if (type === "banners" || type === "campaigns") {
    const { data: campaigns } = await supabase
      .from("banner_campaigns")
      .select("id, slug, business_name, banner_image, description, updated_at, is_listed")
      .eq("status", "active")
      .eq("is_listed", true)
      .order("updated_at", { ascending: false })
      .limit(5000);

    const urls = (campaigns || []).map((c: any) => {
      const lastmod = c.updated_at ? new Date(c.updated_at).toISOString().split("T")[0] : "";
      const slugOrId = c.slug || c.id;
      const caption = compactText(c.description || c.business_name);
      return `  <url>
    <loc>${baseUrl}/banners/${escapeXml(slugOrId)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>${c.banner_image ? `\n    <image:image><image:loc>${escapeXml(c.banner_image)}</image:loc><image:title>${escapeXml(c.business_name)}</image:title>${caption ? `<image:caption>${escapeXml(caption)}</image:caption>` : ""}</image:image>` : ""}
  </url>`;
    });

    xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`;
  }

  else if (type === "events") {
    const { data: events } = await supabase
      .from("events")
      .select("slug, title, description, cover_image, updated_at, is_listed")
      .eq("is_published", true)
      .eq("is_listed", true)
      .order("updated_at", { ascending: false })
      .limit(5000);

    const urls = (events || []).map((e: any) => {
      const lastmod = e.updated_at ? new Date(e.updated_at).toISOString().split("T")[0] : "";
      const caption = compactText(e.description || e.title);
      return `  <url>
    <loc>${baseUrl}/events/${escapeXml(e.slug || "event")}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>${e.cover_image ? `\n    <image:image><image:loc>${escapeXml(e.cover_image)}</image:loc><image:title>${escapeXml(e.title)}</image:title>${caption ? `<image:caption>${escapeXml(caption)}</image:caption>` : ""}</image:image>` : ""}
  </url>`;
    });

    xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>`;
  }

  else {
    xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
  }

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
    },
  });
});
