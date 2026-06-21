import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { POLITICIAN_SLUGS } from "./politician-slugs.ts";

const SITE_URL = "https://www.kenyaadverts.com";

serve(async (req) => {
  try {
    const sbUrl = Deno.env.get("SUPABASE_URL");
    const sbKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!sbUrl || !sbKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const sb = createClient(sbUrl, sbKey);
    const urls: { loc: string; lastmod?: string; changefreq: string; priority: number }[] = [];

    const addUrl = (path: string, changefreq: string, priority: number, lastmod?: string) => {
      urls.push({ loc: `${SITE_URL}${path}`, changefreq, priority, lastmod });
    };

    const now = new Date().toISOString();

    // 1. Homepage
    addUrl("", "always", 1.0, now);

    // 2. Hubs & Static Pages
    const hubs = [
      "/search", "/events", "/blog", "/digital-store", "/banners", "/politics", "/politicians",
      "/elections-2027", "/governors-2027", "/senators-2027", "/women-reps-2027", "/mps-2027", "/mca-2027"
    ];
    hubs.forEach(h => addUrl(h, "daily", 0.9, now));

    // Politicians directory (Kiongozi-sourced 250+ profiles)
    POLITICIAN_SLUGS.forEach(slug => addUrl(`/politicians/${slug}`, "weekly", 0.6, now));

    const infos = ["/about", "/faqs", "/terms", "/privacy", "/safety-tips", "/advertise", "/subscriptions", "/credits"];
    infos.forEach(i => addUrl(i, "weekly", 0.6, now));

    // 3. Counties
    const counties = [
      "Mombasa", "Kwale", "Kilifi", "Tana River", "Lamu", "Taita-Taveta", "Garissa", "Wajir",
      "Mandera", "Marsabit", "Isiolo", "Meru", "Tharaka-Nithi", "Embu", "Kitui", "Machakos",
      "Makueni", "Nyandarua", "Nyeri", "Kirinyaga", "Murang'a", "Kiambu", "Turkana", "West Pokot",
      "Samburu", "Trans-Nzoia", "Baringo", "Uasin Gishu", "Elgeyo-Marakwet", "Nandi", "Laikipia",
      "Nakuru", "Narok", "Kajiado", "Kericho", "Bomet", "Kakamega", "Vihiga", "Bungoma", "Busia",
      "Siaya", "Kisumu", "Homa Bay", "Migori", "Kisii", "Nyamira", "Nairobi"
    ];
    counties.forEach(c => {
      const slug = c.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
      addUrl(`/counties/${slug}`, "daily", 0.8, now);
    });

    // 4. Dynamic DB Data (Ads, Blog Posts, Events, Digital Products)
    // Fetch active ads
    const { data: ads } = await sb.from("ads").select("slug, title, updated_at").eq("status", "active").eq("is_listed", true).eq("is_hidden_by_report", false).limit(5000);
    (ads || []).forEach(ad => {
      const s = ad.slug || ad.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      addUrl(`/ads/${s}`, "daily", 0.7, ad.updated_at || now);
    });

    // Fetch published blog posts
    const { data: posts } = await sb.from("blog_posts").select("slug, updated_at, created_at").eq("is_published", true).limit(5000);
    (posts || []).forEach(post => {
      addUrl(`/blog/${post.slug}`, "weekly", 0.7, post.updated_at || post.created_at || now);
    });

    // Fetch published events
    const { data: events } = await sb.from("events").select("slug, updated_at, created_at").eq("is_published", true).eq("is_listed", true).limit(5000);
    (events || []).forEach(ev => {
      addUrl(`/events/${ev.slug}`, "daily", 0.7, ev.updated_at || ev.created_at || now);
    });

    // Fetch political/business banners
    const { data: banners } = await sb.from("banner_campaigns").select("id, slug, updated_at, category").eq("status", "active").eq("is_listed", true).limit(5000);
    (banners || []).forEach(b => {
      const basePath = b.category === "politician" ? "/politics" : "/banners";
      addUrl(`${basePath}/${b.slug || b.id}`, "weekly", 0.6, b.updated_at || now);
    });

    const { data: digitalProducts } = await sb.from("digital_products").select("slug, updated_at, created_at").eq("is_published", true).eq("approval_status", "approved").limit(5000);
    (digitalProducts || []).forEach(p => {
      if (p.slug) addUrl(`/digital-store/${p.slug}`, "weekly", 0.7, p.updated_at || p.created_at || now);
    });

    // Generate XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    urls.forEach(u => {
      xml += `  <url>\n`;
      xml += `    <loc>${escapedUrl(u.loc)}</loc>\n`;
      if (u.lastmod) xml += `    <lastmod>${u.lastmod.split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>${u.changefreq}</changefreq>\n`;
      xml += `    <priority>${u.priority.toFixed(1)}</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    return new Response(`Error generating sitemap: ${err.message}`, { status: 500 });
  }
});

function escapedUrl(url: string) {
  return url.replace(/&/g, '&amp;').replace(/'/g, '&apos;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}