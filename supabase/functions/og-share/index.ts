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

function cleanDescription(value?: string | null, fallback = "") {
  const clean = value?.replace(/\s+/g, " ").trim() || fallback;
  return clean.slice(0, 160);
}

function toAbsoluteImageUrl(image?: string | null) {
  if (!image) return DEFAULT_IMAGE;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return `${SITE_URL}${image}`;
  return image;
}

function optimizeImageForOg(image?: string | null) {
  const absolute = toAbsoluteImageUrl(image);

  try {
    const url = new URL(absolute);

    if (url.pathname.includes("/storage/v1/object/public/")) {
      url.searchParams.set("width", "1200");
      url.searchParams.set("height", "630");
      url.searchParams.set("resize", "cover");
      url.searchParams.set("quality", "80");
    }

    if (url.hostname.includes("images.unsplash.com")) {
      url.searchParams.set("w", "1200");
      url.searchParams.set("h", "630");
      url.searchParams.set("fit", "crop");
      url.searchParams.set("auto", "format");
      url.searchParams.set("q", "80");
    }

    return url.toString();
  } catch {
    return absolute;
  }
}

function base36ToUuid(token: string) {
  if (!/^[0-9a-z]+$/i.test(token)) return null;

  let value = 0n;
  const chars = token.toLowerCase();

  for (const char of chars) {
    const digit = parseInt(char, 36);
    if (Number.isNaN(digit)) return null;
    value = value * 36n + BigInt(digit);
  }

  const hex = value.toString(16).padStart(32, "0");
  if (hex.length > 32) return null;

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function parseRequestTarget(reqUrl: URL) {
  const segments = reqUrl.pathname.split("/").filter(Boolean);
  const ogIndex = segments.indexOf("og-share");
  const routeType = ogIndex >= 0 ? segments[ogIndex + 1] : null;
  const routeValue = ogIndex >= 0 ? segments[ogIndex + 2] : null;

  if (routeType === "ad" && routeValue) {
    return {
      type: "ad",
      id: base36ToUuid(routeValue) || routeValue,
      slug: null,
    };
  }

  if (routeType === "blog" && routeValue) {
    return {
      type: "blog",
      id: null,
      slug: decodeURIComponent(routeValue),
    };
  }

  return {
    type: reqUrl.searchParams.get("type"),
    id: reqUrl.searchParams.get("id"),
    slug: reqUrl.searchParams.get("slug"),
  };
}

function html(title: string, description: string, image: string, url: string, type = "website") {
  const escaped = (s: string) => s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escaped(title)}</title>
<meta name="description" content="${escaped(description)}"/>
<meta property="og:type" content="${type}"/>
<meta property="og:title" content="${escaped(title)}"/>
<meta property="og:description" content="${escaped(description)}"/>
<meta property="og:image" content="${escaped(image)}"/>
<meta property="og:image:secure_url" content="${escaped(image)}"/>
<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>
<meta property="og:image:alt" content="${escaped(title)}"/>
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
    const { type, id, slug } = parseRequestTarget(url);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    if (type === "ad" && id) {
      const { data: ad } = await sb
        .from("ads")
        .select("id,title,description,price,county,town,images,condition")
        .eq("id", id)
        .maybeSingle();

      if (!ad) {
        return new Response(html("Listing Not Found | KenyaAdvert", "This listing may have been removed.", DEFAULT_IMAGE, SITE_URL), {
          headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
        });
      }

      const adTitle = `${ad.title} | KenyaAdvert`;
      const price = Number(ad.price || 0);
      const priceStr = price > 0 ? `KSh ${price.toLocaleString()}` : "Contact for price";
      const location = [ad.town, ad.county].filter(Boolean).join(", ") || "Kenya";
      const shortDesc = cleanDescription(ad.description, `${ad.title} available in ${location}`);
      const image = optimizeImageForOg(ad.images?.[0]);
      const adUrl = `${SITE_URL}/ads/${ad.id}/${slugify(ad.title)}`;
      const description = cleanDescription(`${priceStr} · ${location}. ${shortDesc}`);

      return new Response(html(adTitle, description, image, adUrl, "product"), {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=900, s-maxage=1800, stale-while-revalidate=86400",
        },
      });
    }

    if (type === "blog" && slug) {
      const { data: post } = await sb
        .from("blog_posts")
        .select("title,excerpt,image,slug,is_published")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (!post) {
        return new Response(html("Article Not Found | KenyaAdvert", "This article may have been removed.", DEFAULT_IMAGE, `${SITE_URL}/blog`), {
          headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
        });
      }

      const blogTitle = `${post.title} | KenyaAdvert Blog`;
      const blogUrl = `${SITE_URL}/blog/${post.slug}`;
      const description = cleanDescription(post.excerpt, post.title);
      const image = optimizeImageForOg(post.image);

      return new Response(html(blogTitle, description, image, blogUrl, "article"), {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=900, s-maxage=1800, stale-while-revalidate=86400",
        },
      });
    }

    return new Response(html(
      "KenyaAdvert — Buy & Sell on Kenya's Trusted Classifieds",
      "Kenya's trusted classifieds marketplace. Buy and sell phones, cars, electronics, services and more across all 47 counties.",
      DEFAULT_IMAGE,
      SITE_URL,
    ), {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err) {
    console.error("og-share error:", err);
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});
