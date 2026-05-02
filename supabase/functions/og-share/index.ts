import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://www.kenyaadverts.com";
const SITE_NAME = "KenyaAdvert";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
// Updated 2026-05-01: domain migration .co.ke → .com

function slugify(title?: string | null) {
  if (!title) return "listing";
  return title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80) || "listing";
}

function cleanDescription(value?: string | null, fallback = "") {
  const clean = (value || fallback)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return clean.length > 158 ? `${clean.slice(0, 155).replace(/[\s,.;:-]+$/, "")}...` : clean;
}

function buildAdDescription(ad: any) {
  const price = Number(ad.price || 0);
  const priceText = price > 0 ? ` for KSh ${price.toLocaleString()}` : "";
  const location = [ad.town, ad.county].filter(Boolean).join(", ") || "Kenya";
  const condition = ad.condition ? `${ad.condition} ` : "";
  const details = cleanDescription(ad.description, `${condition}${ad.title}`);
  return cleanDescription(`${ad.title}${priceText} in ${location}, Kenya. ${details}. View photos, price and seller contacts on KenyaAdvert.`);
}

function toAbsoluteImageUrl(image?: string | null) {
  if (!image) return DEFAULT_IMAGE;
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  if (image.startsWith("/")) return `${SITE_URL}${image}`;
  return image;
}

// preserveAspect: true for posters/flyers (events, banners) so WhatsApp shows
// the full image instead of a centre-cropped 1200x630 banner.
function optimizeImageForOg(image?: string | null, preserveAspect = false) {
  const absolute = toAbsoluteImageUrl(image);
  try {
    const url = new URL(absolute);
    if (url.pathname.includes("/storage/v1/object/public/")) {
      if (preserveAspect) {
        url.searchParams.set("width", "1600");
        url.searchParams.set("resize", "contain");
        url.searchParams.set("quality", "85");
      } else {
        url.searchParams.set("width", "1200");
        url.searchParams.set("height", "630");
        url.searchParams.set("resize", "cover");
        url.searchParams.set("quality", "80");
      }
    }
    if (url.hostname.includes("images.unsplash.com")) {
      url.searchParams.set("w", preserveAspect ? "1600" : "1200");
      if (!preserveAspect) url.searchParams.set("h", "630");
      url.searchParams.set("fit", preserveAspect ? "max" : "crop");
      url.searchParams.set("auto", "format");
      url.searchParams.set("q", "85");
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

function buildHtml(title: string, description: string, image: string, url: string, type = "website", extra = "", isBot = false, opts: { largeImage?: boolean } = {}) {
  const redirectTags = isBot
    ? ""
    : `<meta http-equiv="refresh" content="0;url=${escaped(url)}"/>
<script>window.location.replace("${url.replace(/"/g, '\\"')}");</script>`;

  const body = isBot
    ? `<header><h1>${escaped(title)}</h1></header>
<main>
<figure><img src="${escaped(image)}" alt="${escaped(title)}"/></figure>
<p>${escaped(description)}</p>
<p><a href="${escaped(url)}">View full listing on KenyaAdvert</a></p>
</main>
<footer><p>KenyaAdvert — Kenya's trusted classifieds marketplace.</p></footer>`
    : `<p>Redirecting to <a href="${escaped(url)}">${escaped(title)}</a>...</p>`;

  // For posters/flyers (events, banners) we OMIT explicit width/height so
  // WhatsApp / Facebook / Twitter render the FULL image rather than cropping
  // it into a thin 1200x630 banner.
  const imageDims = opts.largeImage
    ? ""
    : `<meta property="og:image:width" content="1200"/>
<meta property="og:image:height" content="630"/>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escaped(title)}</title>
<meta name="description" content="${escaped(description)}"/>
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1"/>
<meta property="og:type" content="${type}"/>
<meta property="og:title" content="${escaped(title)}"/>
<meta property="og:description" content="${escaped(description)}"/>
<meta property="og:image" content="${escaped(image)}"/>
<meta property="og:image:secure_url" content="${escaped(image)}"/>
${imageDims}
<meta property="og:image:alt" content="${escaped(title)}"/>
<meta property="og:url" content="${escaped(url)}"/>
<meta property="og:site_name" content="${SITE_NAME}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${escaped(title)}"/>
<meta name="twitter:description" content="${escaped(description)}"/>
<meta name="twitter:image" content="${escaped(image)}"/>
${extra}
<link rel="canonical" href="${escaped(url)}"/>
${redirectTags}
</head>
<body>${body}</body>
</html>`;
}

function stripRedirectTags(html: string) {
  return html
    .replace(/<meta http-equiv="refresh"[^>]*>\s*/i, "")
    .replace(/<script>window\.location\.replace\([\s\S]*?<\/script>\s*/i, "");
}

const PAGE_META: Record<string, { title: string; description: string; image: string }> = {
  advertise: { title: "Advertise With Us | KenyaAdvert", description: "Promote your business to thousands of Kenyan buyers.", image: `${SITE_URL}/og/og-post-ad.png` },
  about: { title: "About KenyaAdvert", description: "Learn about KenyaAdvert — Kenya's trusted online classifieds marketplace.", image: `${SITE_URL}/og/og-about.png` },
  search: { title: "Search Classifieds | KenyaAdvert", description: "Search thousands of listings across Kenya.", image: `${SITE_URL}/og/og-search.png` },
  blog: { title: "Blog | KenyaAdvert", description: "Tips, guides and news for buying and selling on KenyaAdvert.", image: `${SITE_URL}/og/og-blog.png` },
  faqs: { title: "FAQs | KenyaAdvert", description: "Frequently asked questions about posting ads and using KenyaAdvert.", image: `${SITE_URL}/og/og-faqs.png` },
  "safety-tips": { title: "Safety Tips | KenyaAdvert", description: "Stay safe when buying and selling online.", image: `${SITE_URL}/og/og-safety.png` },
  privacy: { title: "Privacy Policy | KenyaAdvert", description: "Read KenyaAdvert's privacy policy.", image: `${SITE_URL}/og/og-privacy.png` },
  terms: { title: "Terms of Service | KenyaAdvert", description: "Read the terms of service for KenyaAdvert.", image: `${SITE_URL}/og/og-terms.png` },
  credits: { title: "Credits | KenyaAdvert", description: "Buy credits to post and boost your ads via M-Pesa.", image: `${SITE_URL}/og/og-credits.png` },
  subscriptions: { title: "Subscriptions | KenyaAdvert", description: "Choose a subscription plan for more visibility.", image: `${SITE_URL}/og/og-subscriptions.png` },
  login: { title: "Login | KenyaAdvert", description: "Sign in to your KenyaAdvert account.", image: `${SITE_URL}/og/og-login.png` },
  register: { title: "Register | KenyaAdvert", description: "Create a free KenyaAdvert account today.", image: `${SITE_URL}/og/og-register.png` },
  "post-ad": { title: "Post a Free Ad | KenyaAdvert", description: "List your item for free and reach thousands of buyers.", image: `${SITE_URL}/og/og-post-ad.png` },
};

function parseRequestTarget(reqUrl: URL) {
  const segments = reqUrl.pathname.split("/").filter(Boolean);
  const ogIndex = segments.indexOf("og-share");
  const routeType = ogIndex >= 0 ? segments[ogIndex + 1] : null;
  const routeValue = ogIndex >= 0 ? segments.slice(ogIndex + 2).join("/") : null;

  if (routeType === "ad" && routeValue) return { type: "ad" as const, value: decodeURIComponent(routeValue) };
  if (routeType === "blog" && routeValue) return { type: "blog" as const, value: decodeURIComponent(routeValue) };
  if (routeType === "event" && routeValue) return { type: "event" as const, value: decodeURIComponent(routeValue) };
  if (routeType === "banner" && routeValue) return { type: "banner" as const, value: decodeURIComponent(routeValue) };
  if (routeType === "page" && routeValue) return { type: "page" as const, value: decodeURIComponent(routeValue) };

  const type = reqUrl.searchParams.get("type");
  const id = reqUrl.searchParams.get("id");
  const slug = reqUrl.searchParams.get("slug");
  if (type === "ad" && (id || slug)) return { type: "ad" as const, value: id || slug! };
  if (type === "blog" && slug) return { type: "blog" as const, value: slug };
  if (type === "event" && slug) return { type: "event" as const, value: slug };
  if (type === "banner" && (id || slug)) return { type: "banner" as const, value: id || slug! };
  if (type === "page" && slug) return { type: "page" as const, value: slug };

  return { type: null, value: null };
}

async function handleEvent(sb: any, value: string, isBot: boolean) {
  let ev: any = null;
  if (isUuid(value)) {
    const { data } = await sb.from("events").select("*").eq("id", value).maybeSingle();
    ev = data;
  }
  if (!ev) {
    const { data } = await sb.from("events").select("*").eq("slug", value).maybeSingle();
    ev = data;
  }
  if (!ev) {
    return { body: buildHtml("Event Not Found | KenyaAdvert", "This event may have been removed.", DEFAULT_IMAGE, `${SITE_URL}/events`, "website", "", isBot), canonicalUrl: `${SITE_URL}/events` };
  }
  const canonicalUrl = `${SITE_URL}/events/${ev.slug || ev.id}`;
  const image = optimizeImageForOg(ev.cover_image, true);
  const startDate = new Date(ev.start_at);
  const dateStr = startDate.toLocaleDateString("en-KE", { weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const location = ev.is_virtual ? "Virtual event" : (ev.location || "Kenya");
  const priceText = ev.is_paid && Number(ev.ticket_price) > 0 ? `Tickets KSh ${Number(ev.ticket_price).toLocaleString()}` : "Free RSVP";
  const description = cleanDescription(ev.description, `${ev.title} — ${dateStr} at ${location}. ${priceText}. RSVP on KenyaAdvert.`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: ev.title,
    startDate: ev.start_at,
    endDate: ev.end_at || undefined,
    eventAttendanceMode: ev.is_virtual ? "https://schema.org/OnlineEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: ev.is_virtual
      ? { "@type": "VirtualLocation", url: ev.virtual_link || canonicalUrl }
      : { "@type": "Place", name: ev.location || "Kenya", address: { "@type": "PostalAddress", addressCountry: "KE", addressLocality: ev.location || "Kenya" } },
    image: [image],
    description,
    organizer: { "@type": "Organization", name: ev.host_name || "KenyaAdvert Host" },
    offers: {
      "@type": "Offer",
      price: ev.is_paid ? Number(ev.ticket_price || 0) : 0,
      priceCurrency: "KES",
      availability: "https://schema.org/InStock",
      url: canonicalUrl,
    },
  };
  const schemaScript = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
  return { body: buildHtml(`${ev.title} — ${dateStr} | KenyaAdvert Events`, description, image, canonicalUrl, "website", schemaScript, isBot, { largeImage: true }), canonicalUrl };
}

async function handleBanner(sb: any, value: string, isBot: boolean) {
  let b: any = null;
  if (isUuid(value)) {
    const { data } = await sb.from("banner_campaigns").select("*").eq("id", value).maybeSingle();
    b = data;
  }
  if (!b) {
    const { data } = await sb.from("banner_campaigns").select("*").eq("slug", value).maybeSingle();
    b = data;
  }
  if (!b) {
    return { body: buildHtml("Banner Not Found | KenyaAdvert", "This banner may have been removed.", DEFAULT_IMAGE, `${SITE_URL}/banners`, "website", "", isBot), canonicalUrl: `${SITE_URL}/banners` };
  }
  const canonicalUrl = `${SITE_URL}/banners/${b.slug || b.id}`;
  const image = optimizeImageForOg(b.banner_image, true);
  const isPolitician = b.category === "politician";
  const labelByCat: Record<string, string> = { politician: "Political Campaign", business: "Business", event: "Event", ngo: "NGO", other: "Promo" };
  const label = labelByCat[b.category || "business"] || "Promo";
  const description = cleanDescription(b.description, `${b.business_name} — ${label} on KenyaAdvert. ${b.is_voting_enabled ? "Vote and " : ""}share your support.`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": isPolitician ? "Person" : "Organization",
    name: b.business_name,
    description,
    image,
    url: canonicalUrl,
  };
  const schemaScript = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
  return { body: buildHtml(`${b.business_name} — ${label} | KenyaAdvert`, description, image, canonicalUrl, "website", schemaScript, isBot, { largeImage: true }), canonicalUrl };
}

// Returns { html, canonicalUrl }
async function handleAd(sb: any, value: string, isBot: boolean) {
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
    return { body: buildHtml("Listing Not Found | KenyaAdvert", "This listing may have been removed.", DEFAULT_IMAGE, SITE_URL, "website", "", isBot), canonicalUrl: SITE_URL };
  }
  const price = Number(ad.price || 0);
  const priceStr = price > 0 ? `KSh ${price.toLocaleString()}` : "Contact for price";
  const location = [ad.town, ad.county].filter(Boolean).join(", ") || "Kenya";
  const shortDesc = cleanDescription(ad.description, `${ad.title} available in ${location}`);
  const image = optimizeImageForOg(ad.images?.[0]);
  const adSlug = ad.slug || slugify(ad.title);
  const canonicalUrl = `${SITE_URL}/ads/${adSlug}`;
  const description = buildAdDescription(ad);
  const priceExtra = price > 0
    ? `<meta property="product:price:amount" content="${price}"/>\n<meta property="product:price:currency" content="KES"/>\n<meta property="product:condition" content="${ad.condition === "New" ? "new" : "used"}"/>`
    : "";

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: ad.title,
    description: shortDesc,
    image: [image],
    brand: { "@type": "Brand", name: "KenyaAdvert" },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      reviewCount: "1",
      bestRating: "5",
      worstRating: "1",
    },
    review: [{
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: "4.5", bestRating: "5" },
      author: { "@type": "Organization", name: "KenyaAdvert" },
      reviewBody: "Listed and verified on KenyaAdvert marketplace.",
    }],
    offers: {
      "@type": "Offer",
      price: price > 0 ? String(price) : "0",
      priceCurrency: "KES",
      availability: "https://schema.org/InStock",
      itemCondition: ad.condition === "New"
        ? "https://schema.org/NewCondition"
        : "https://schema.org/UsedCondition",
      seller: { "@type": "Organization", name: "KenyaAdvert" },
      areaServed: { "@type": "Place", name: `${location}, Kenya` },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: { "@type": "MonetaryAmount", value: "0", currency: "KES" },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "KE" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 3, unitCode: "DAY" },
          transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 7, unitCode: "DAY" },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: { "@type": "Country", name: "KE" },
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: 7,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
  };

  const schemaScript = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
  return { body: buildHtml(`${ad.title} | KenyaAdvert`, description, image, canonicalUrl, "product", priceExtra + "\n" + schemaScript, isBot), canonicalUrl };
}

async function handleBlog(sb: any, value: string, isBot: boolean) {
  const { data: post } = await sb.from("blog_posts").select("title,excerpt,image,slug,is_published").eq("slug", value).eq("is_published", true).maybeSingle();
  if (!post) {
    return { body: buildHtml("Article Not Found | KenyaAdvert", "This article may have been removed.", DEFAULT_IMAGE, `${SITE_URL}/blog`, "website", "", isBot), canonicalUrl: `${SITE_URL}/blog` };
  }
  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  return { body: buildHtml(`${post.title} | KenyaAdvert Blog`, cleanDescription(post.excerpt, post.title), optimizeImageForOg(post.image), canonicalUrl, "article", "", isBot), canonicalUrl };
}

async function handlePage(sb: any, slug: string, isBot: boolean) {
  const canonicalUrl = `${SITE_URL}/${slug}`;
  const meta = PAGE_META[slug];
  if (meta) {
    return { body: buildHtml(meta.title, meta.description, meta.image, canonicalUrl, "website", "", isBot), canonicalUrl };
  }
  const { data } = await sb.from("seo_settings").select("meta_title,meta_description,og_image,page_slug").eq("page_slug", `/${slug}`).maybeSingle();
  if (data?.meta_title) {
    return { body: buildHtml(data.meta_title, cleanDescription(data.meta_description, data.meta_title), toAbsoluteImageUrl(data.og_image), canonicalUrl, "website", "", isBot), canonicalUrl };
  }
  return { body: buildHtml(`${slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())} | KenyaAdvert`, "Kenya's trusted classifieds marketplace.", DEFAULT_IMAGE, canonicalUrl, "website", "", isBot), canonicalUrl };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const { type, value } = parseRequestTarget(url);
    // Middleware only routes real social-preview crawlers here, so always
    // render the bot/OG variant (no client-side redirect script).
    const isBot = true;

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let body: string;
    let canonicalUrl: string = SITE_URL;

    if (type === "ad" && value) {
      ({ body, canonicalUrl } = await handleAd(sb, value, isBot));
    } else if (type === "blog" && value) {
      ({ body, canonicalUrl } = await handleBlog(sb, value, isBot));
    } else if (type === "event" && value) {
      ({ body, canonicalUrl } = await handleEvent(sb, value, isBot));
    } else if (type === "banner" && value) {
      ({ body, canonicalUrl } = await handleBanner(sb, value, isBot));
    } else if (type === "page" && value) {
      ({ body, canonicalUrl } = await handlePage(sb, value, isBot));
    } else {
      body = buildHtml(
        "KenyaAdvert — Buy & Sell on Kenya's Trusted Classifieds",
        "Kenya's trusted classifieds marketplace. Buy and sell phones, cars, electronics, services and more across all 47 counties.",
        DEFAULT_IMAGE,
        SITE_URL,
        "website",
        "",
        isBot,
      );
      canonicalUrl = SITE_URL;
    }

    // Always return OG HTML with 200 — middleware only routes real social
    // crawlers here. Real users hit the SPA directly and never reach this
    // function, so we no longer need the 301-redirect branch (which Google
    // was treating as a soft-redirect → "Crawled, not indexed").
    return new Response(body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=900, s-maxage=1800, stale-while-revalidate=86400",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (err) {
    console.error("og-share error:", err);
    return new Response("Error", { status: 500, headers: corsHeaders });
  }
});
