import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://www.kenyaadverts.co.ke";
const SITE_NAME = "KenyaAdvert";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

function slugify(title?: string | null) {
  if (!title) return "listing";
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || "listing";
}

function html(title: string, description: string, image: string, url: string, type = "website") {
  const escaped = (s: string) => s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${escaped(title)}</title>
<meta name="description" content="${escaped(description)}"/>
<meta property="og:type" content="${type}"/>
<meta property="og:title" content="${escaped(title)}"/>
<meta property="og:description" content="${escaped(description)}"/>
<meta property="og:image" content="${escaped(image)}"/>
<meta property="og:url" content="${escaped(url)}"/>
<meta property="og:site_name" content="${SITE_NAME}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${escaped(title)}"/>
<meta name="twitter:description" content="${escaped(description)}"/>
<meta name="twitter:image" content="${escaped(image)}"/>
<link rel="canonical" href="${escaped(url)}"/>
<meta http-equiv="refresh" content="0;url=${escaped(url)}"/>
<script>window.location.replace("${url.replace(/"/g, '\\"')}");</script>
</head>
<body><p>Redirecting to <a href="${escaped(url)}">${escaped(title)}</a>...</p></body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const id = url.searchParams.get("id");
    const slug = url.searchParams.get("slug");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    if (type === "ad" && id) {
      const { data: ad } = await sb.from("ads").select("id,title,description,price,county,town,images,condition").eq("id", id).maybeSingle();

      if (!ad) {
        return new Response(html("Listing Not Found | KenyaAdvert", "This listing may have been removed.", DEFAULT_IMAGE, SITE_URL), {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      const adTitle = `${ad.title} | KenyaAdvert`;
      const price = Number(ad.price || 0);
      const priceStr = price > 0 ? `KSh ${price.toLocaleString()}` : "Contact for price";
      const location = ad.town ? `${ad.town}, ${ad.county}` : ad.county;
      const desc = ad.description
        ? ad.description.replace(/\s+/g, " ").trim().slice(0, 155)
        : `${ad.title} — ${priceStr} in ${location}`;
      const image = ad.images?.[0] || DEFAULT_IMAGE;
      const adUrl = `${SITE_URL}/ads/${ad.id}/${slugify(ad.title)}`;

      return new Response(html(adTitle, `${priceStr} · ${location}. ${desc}`, image, adUrl, "product"), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (type === "blog" && slug) {
      const { data: post } = await sb.from("blog_posts").select("title,excerpt,image,slug").eq("slug", slug).maybeSingle();

      if (!post) {
        return new Response(html("Article Not Found | KenyaAdvert", "This article may have been removed.", DEFAULT_IMAGE, `${SITE_URL}/blog`), {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      const blogUrl = `${SITE_URL}/blog/${post.slug}`;
      return new Response(html(`${post.title} | KenyaAdvert Blog`, post.excerpt || post.title, post.image || DEFAULT_IMAGE, blogUrl, "article"), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Default: homepage
    return new Response(html(
      "KenyaAdvert — Buy & Sell on Kenya's Trusted Classifieds",
      "Kenya's trusted classifieds marketplace. Buy and sell phones, cars, electronics, services and more across all 47 counties.",
      DEFAULT_IMAGE,
      SITE_URL,
    ), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("og-share error:", err);
    return new Response("Error", { status: 500 });
  }
});
