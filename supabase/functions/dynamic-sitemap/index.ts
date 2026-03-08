import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const baseUrl = "https://bazaar-kenya.lovable.app";

  // Static pages
  const staticPages = [
    { loc: "/", changefreq: "daily", priority: "1.0" },
    { loc: "/search", changefreq: "hourly", priority: "0.9" },
    { loc: "/post-ad", changefreq: "daily", priority: "0.9" },
    { loc: "/credits", changefreq: "weekly", priority: "0.7" },
    { loc: "/blog", changefreq: "weekly", priority: "0.7" },
    { loc: "/faqs", changefreq: "monthly", priority: "0.5" },
  ];

  // Fetch all active ads
  const { data: ads } = await supabase
    .from("ads")
    .select("id, title, updated_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1000);

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("name")
    .limit(100);

  // Fetch blog posts
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("is_published", true)
    .limit(500);

  const slugify = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80) || "listing";

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Static pages
  for (const p of staticPages) {
    xml += `
  <url>
    <loc>${baseUrl}${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`;
  }

  // Individual ads
  if (ads) {
    for (const ad of ads) {
      const slug = slugify(ad.title);
      const lastmod = ad.updated_at ? new Date(ad.updated_at).toISOString().split("T")[0] : "";
      xml += `
  <url>
    <loc>${baseUrl}/ads/${ad.id}/${slug}</loc>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }
  }

  // Category search pages
  if (categories) {
    for (const cat of categories) {
      const slug = encodeURIComponent(cat.name);
      xml += `
  <url>
    <loc>${baseUrl}/search?category=${slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
    }
  }

  // Blog posts
  if (posts) {
    for (const post of posts) {
      const lastmod = post.updated_at ? new Date(post.updated_at).toISOString().split("T")[0] : "";
      xml += `
  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }
  }

  xml += `
</urlset>`;

  return new Response(xml, {
    headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" },
  });
});
