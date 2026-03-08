import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://www.kenyaadverts.co.ke";
const SITE_NAME = "KenyaAdvert";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

// --- Utility helpers ---

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

function isUuid(val: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

function escaped(s: string) {
  return s.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function html(title: string, description: string, image: string, url: string, type = "website") {
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

// --- Static page metadata map ---

const PAGE_META: Record<string, { title: string; description: string; image: string }> = {
  advertise: {
    title: "Advertise With Us | KenyaAdvert",
    description: "Promote your business to thousands of Kenyan buyers. Choose a banner ad package and start getting clicks today on Kenya's trusted classifieds marketplace.",
    image: `${SITE_URL}/og/og-post-ad.png`,
  },
  about: {
    title: "About KenyaAdvert",
    description: "Learn about KenyaAdvert — Kenya's trusted online classifieds marketplace connecting buyers and sellers across all 47 counties.",
    image: `${SITE_URL}/og/og-about.png`,
  },
  search: {
    title: "Search Classifieds | KenyaAdvert",
    description: "Search thousands of listings across Kenya. Find phones, cars, electronics, services and more in your county.",
    image: `${SITE_URL}/og/og-search.png`,
  },
  blog: {
    title: "Blog | KenyaAdvert",
    description: "Tips, guides and news for buying and selling on Kenya's trusted classifieds marketplace.",
    image: `${SITE_URL}/og/og-blog.png`,
  },
  faqs: {
    title: "FAQs | KenyaAdvert",
    description: "Frequently asked questions about posting ads, payments, credits, and using KenyaAdvert.",
    image: `${SITE_URL}/og/og-faqs.png`,
  },
  "safety-tips": {
    title: "Safety Tips | KenyaAdvert",
    description: "Stay safe when buying and selling online. Follow these tips to protect yourself on KenyaAdvert.",
    image: `${SITE_URL}/og/og-safety.png`,
  },
  privacy: {
    title: "Privacy Policy | KenyaAdvert",
    description: "Read KenyaAdvert's privacy policy. Learn how we collect, use, and protect your personal information.",
    image: `${SITE_URL}/og/og-privacy.png`,
  },
  terms: {
    title: "Terms of Service | KenyaAdvert",
    description: "Read the terms of service for KenyaAdvert. Understand the rules for buying and selling on Kenya's classifieds marketplace.",
    image: `${SITE_URL}/og/og-terms.png`,
  },
  credits: {
    title: "Credits | KenyaAdvert",
    description: "Buy credits to post and boost your ads on KenyaAdvert. Affordable packages via M-Pesa.",
    image: `${SITE_URL}/og/og-credits.png`,
  },
  subscriptions: {
    title: "Subscriptions | KenyaAdvert",
    description: "Choose a subscription plan to get more visibility for your listings on KenyaAdvert.",
    image: `${SITE_URL}/og/og-subscriptions.png`,
  },
  login: {
    title: "Login | KenyaAdvert",
    description: "Sign in to your KenyaAdvert account to manage your ads, messages, and credits.",
    image: `${SITE_URL}/og/og-login.png`,
  },
  register: {
    title: "Register | KenyaAdvert",
    description: "Create a free KenyaAdvert account and start buying and selling across Kenya today.",
    image: `${SITE_URL}/og/og-register.png`,
  },
  "post-ad": {
    title: "Post a Free Ad | KenyaAdvert",
    description: "List your item or service for free on KenyaAdvert and reach thousands of buyers across Kenya.",
    image: `${SITE_URL}/og/og-post-ad.png`,
  },
};

// --- Route parsing ---

function parseRequestTarget(reqUrl: URL) {
  const segments = reqUrl.pathname.split("/").filter(Boolean);
  const ogIndex = segments.indexOf("og-share");
  const routeType = ogIndex >= 0 ? segments[ogIndex + 1] : null;
  const routeValue = ogIndex >= 0 ? segments.slice(ogIndex + 2).join("/") : null;

  if (routeType === "ad" && routeValue) return { type: "ad" as const, value: decodeURIComponent(routeValue) };
  if (routeType === "blog" && routeValue) return { type: "blog" as const, value: decodeURIComponent(routeValue) };
  if (routeType === "page" && routeValue) return { type: "page" as const, value: decodeURIComponent(routeValue) };

  const type = reqUrl.searchParams.get("type");
  const id = reqUrl.searchParams.get("id");
  const slug = reqUrl.searchParams.get("slug");
  if (type === "ad" && (id || slug)) return { type: "ad" as const, value: id || slug! };
  if (type === "blog" && slug) return { type: "blog" as const, value: slug };
  if (type === "page" && slug) return { type: "page" as const, value: slug };

  return { type: null, value: null };
}

// --- Handlers ---

async function handleAd(sb: any, value: string) {
  let ad: any = null;
  if (isUuid(value)) {
    const { data } = await sb.from("ads").select("id,title,description,price,county,town,images,condition,slug").eq("id", value).maybeSingle();
    ad = data;
  }
  if (!ad) {
    const { data } = await sb.from("ads").select("id,title,description,price,county,town,images,condition,slug").eq("slug", value).maybeSingle();
    ad = data;
  }
  if (!ad) {
    return html("Listing Not Found | KenyaAdvert", "This listing may have been removed.", DEFAULT_IMAGE, SITE_URL);
  }
  const price = Number(ad.price || 0);
  const priceStr = price > 0 ? `KSh ${price.toLocaleString()}` : "Contact for price";
  const location = [ad.town, ad.county].filter(Boolean).join(", ") || "Kenya";
  const shortDesc = cleanDescription(ad.description, `${ad.title} available in ${location}`);
  const image = optimizeImageForOg(ad.images?.[0]);
  const adSlug = ad.slug || slugify(ad.title);
  const adUrl = `${SITE_URL}/ads/${adSlug}`;
  const description = cleanDescription(`${priceStr} · ${location}. ${shortDesc}`);
  return html(`${ad.title} | KenyaAdvert`, description, image, adUrl, "product");
}

async function handleBlog(sb: any, value: string) {
  const { data: post } = await sb.from("blog_posts").select("title,excerpt,image,slug,is_published").eq("slug", value).eq("is_published", true).maybeSingle();
  if (!post) {
    return html("Article Not Found | KenyaAdvert", "This article may have been removed.", DEFAULT_IMAGE, `${SITE_URL}/blog`);
  }
  return html(`${post.title} | KenyaAdvert Blog`, cleanDescription(post.excerpt, post.title), optimizeImageForOg(post.image), `${SITE_URL}/blog/${post.slug}`, "article");
}

async function handlePage(sb: any, slug: string) {
  // Check hardcoded map first
  const meta = PAGE_META[slug];
  if (meta) {
    return html(meta.title, meta.description, meta.image, `${SITE_URL}/${slug}`);
  }
  // Fallback: check seo_settings table
  const { data } = await sb.from("seo_settings").select("meta_title,meta_description,og_image,page_slug").eq("page_slug", `/${slug}`).maybeSingle();
  if (data?.meta_title) {
    return html(
      data.meta_title,
      cleanDescription(data.meta_description, data.meta_title),
      toAbsoluteImageUrl(data.og_image),
      `${SITE_URL}/${slug}`,
    );
  }
  // Final fallback: generic
  return html(`${slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())} | KenyaAdvert`, "Kenya's trusted classifieds marketplace.", DEFAULT_IMAGE, `${SITE_URL}/${slug}`);
}

// --- Main handler ---

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const { type, value } = parseRequestTarget(url);

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let body: string;
    if (type === "ad" && value) {
      body = await handleAd(sb, value);
    } else if (type === "blog" && value) {
      body = await handleBlog(sb, value);
    } else if (type === "page" && value) {
      body = await handlePage(sb, value);
    } else {
      body = html(
        "KenyaAdvert — Buy & Sell on Kenya's Trusted Classifieds",
        "Kenya's trusted classifieds marketplace. Buy and sell phones, cars, electronics, services and more across all 47 counties.",
        DEFAULT_IMAGE,
        SITE_URL,
      );
    }

    return new Response(body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=900, s-maxage=1800, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("og-share error:", err);
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});
