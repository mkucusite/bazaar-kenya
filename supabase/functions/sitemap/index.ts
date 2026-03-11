import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeXml(s: string = "") {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const baseUrl = "https://www.kenyaadverts.co.ke";

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
      { loc: "/blog", priority: "0.7", cf: "weekly" },
      { loc: "/credits", priority: "0.7", cf: "weekly" },
      { loc: "/about", priority: "0.6", cf: "monthly" },
      { loc: "/faqs", priority: "0.5", cf: "monthly" },
      { loc: "/safety-tips", priority: "0.5", cf: "monthly" },
      { loc: "/subscriptions", priority: "0.5", cf: "monthly" },
      { loc: "/terms", priority: "0.3", cf: "monthly" },
      { loc: "/privacy", priority: "0.3", cf: "monthly" },
      { loc: "/login", priority: "0.4", cf: "monthly" },
      { loc: "/register", priority: "0.4", cf: "monthly" },
    ];
    xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url><loc>${baseUrl}${p.loc}</loc><changefreq>${p.cf}</changefreq><priority>${p.priority}</priority></url>`).join("\n")}
</urlset>`;
  }

  else if (type === "listings") {
    const { data: ads } = await supabase
      .from("ads")
      .select("slug, title, updated_at, images")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(50000);

    const urls = (ads || []).map((ad: any) => {
      const imgs: string[] = Array.isArray(ad.images) ? ad.images.filter((i: string) => i && !i.includes("placeholder")) : [];
      const imgXml = imgs.slice(0, 5).map(img =>
        `\n    <image:image><image:loc>${escapeXml(img)}</image:loc><image:title>${escapeXml(ad.title)}</image:title></image:image>`
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
${(cats || []).map((c: any) => `  <sitemap><loc>${baseUrl}/sitemap-listings-${slugifyName(c.name)}.xml</loc><lastmod>${today}</lastmod></sitemap>`).join("\n")}
</sitemapindex>`;
  }

  else if (type === "listings-category" && categorySlug) {
    const categoryName = categorySlug.replace(/-/g, " ");
    // Find matching category
    const { data: catRow } = await supabase.from("categories").select("id, name").ilike("name", `%${categoryName}%`).limit(1).maybeSingle();

    let ads: any[] = [];
    if (catRow) {
      const { data } = await supabase
        .from("ads")
        .select("slug, title, updated_at, images")
        .eq("status", "active")
        .eq("category_id", catRow.id)
        .order("updated_at", { ascending: false })
        .limit(10000);
      ads = data || [];
    }

    const urls = ads.map((ad: any) => {
      const imgs: string[] = Array.isArray(ad.images) ? ad.images.filter((i: string) => i && !i.includes("placeholder")) : [];
      const imgXml = imgs.slice(0, 5).map(img =>
        `\n    <image:image><image:loc>${escapeXml(img)}</image:loc><image:title>${escapeXml(ad.title)}</image:title></image:image>`
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
      .select("slug, updated_at, image")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(500);

    const urls = (posts || []).map((p: any) => {
      const lastmod = p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : "";
      return `  <url>
    <loc>${baseUrl}/blog/${escapeXml(p.slug)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>${p.image ? `\n    <image:image><image:loc>${escapeXml(p.image)}</image:loc></image:image>` : ""}
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

  else {
    xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
  }

  return new Response(xml, {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
    },
  });
});
