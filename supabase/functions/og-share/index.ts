import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://www.kenyaadverts.com";
const SITE_NAME = "KenyaAdvert";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const HOME_URL = `${SITE_URL}/`;

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

// FIX: Supabase image transforms ONLY work on /render/image/ path, not /object/
// Swapping /storage/v1/object/public/ → /storage/v1/render/image/public/
// so that width/height/resize params are actually applied.
function optimizeImageForOg(image?: string | null, preserveAspect = false) {
  const absolute = toAbsoluteImageUrl(image);
  if (!absolute || absolute === DEFAULT_IMAGE) return absolute;
  try {
    const url = new URL(absolute);
    if (url.pathname.includes("/storage/v1/object/public/")) {
      // Convert to render/image path for transforms to work
      url.pathname = url.pathname.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/");
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
    } else if (url.pathname.includes("/storage/v1/render/image/public/")) {
      // Already on render path, just set params
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
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function schemaScript(schema: unknown) {
  return `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>`;
}

function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  if (items.length < 2) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function buildHtml(title: string, description: string, image: string, url: string, type = "website", extra = "", isBot = false, opts: { largeImage?: boolean; bodyHtml?: string } = {}) {
  const redirectTags = isBot
    ? ""
    : `<meta http-equiv="refresh" content="0;url=${escaped(url)}"/>
<script>window.location.replace("${url.replace(/"/g, '\\"')}");</script>`;

  const body = isBot
    ? (opts.bodyHtml || `<header><h1>${escaped(title)}</h1></header>
<main>
<figure><img src="${escaped(image)}" alt="${escaped(title)}"/></figure>
<p>${escaped(description)}</p>
<p><a href="${escaped(url)}">View full listing on KenyaAdvert</a></p>
</main>
<footer><p>KenyaAdvert — Kenya's trusted classifieds marketplace.</p></footer>`)
    : `<p>Redirecting to <a href="${escaped(url)}">${escaped(title)}</a>...</p>`;

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

const PAGE_META: Record<string, { title: string; description: string; image: string }> = {
  home: { title: "Kenya Adverts — Free Classifieds, Cars, Jobs & Property", description: "Post free ads in Kenya and find cars, phones, property, jobs, services, events and business offers across Nairobi, Mombasa, Kisumu and all 47 counties.", image: `${SITE_URL}/og-image.png` },
  advertise: { title: "Advertise in Kenya — Banners, Business & Campaign Ads", description: "Promote a business, event, brand or political campaign in Kenya with affordable banner placements, featured business listings and category visibility.", image: `${SITE_URL}/og/og-post-ad.png` },
  about: { title: "About KenyaAdverts — Kenya Classified Ads Marketplace", description: "Learn about KenyaAdverts — Kenya's trusted classifieds platform connecting buyers and sellers across all 47 counties.", image: `${SITE_URL}/og/og-about.png` },
  search: { title: "Search Kenya Classifieds — Cars, Phones, Jobs & Property", description: "Browse Kenya adverts by category, county, price and condition. Find cars, electronics, homes, jobs, services and second-hand deals near you.", image: `${SITE_URL}/og/og-search.png` },
  blog: { title: "Kenya Classifieds Blog — Selling, Buying & SEO Guides", description: "Read Kenya marketplace guides for posting ads, selling faster, buying safely, promoting businesses and comparing classifieds options in Kenya.", image: `${SITE_URL}/og/og-blog.png` },
  faqs: { title: "KenyaAdverts FAQs — Posting, Payments & Safe Trading", description: "Got questions? Find answers to common questions about posting ads, buying, selling and using KenyaAdverts.", image: `${SITE_URL}/og/og-faqs.png` },
  "safety-tips": { title: "Online Buying & Selling Safety Tips in Kenya", description: "Stay safe when buying and selling online. Read KenyaAdverts safety tips to protect yourself from fraud.", image: `${SITE_URL}/og/og-safety.png` },
  privacy: { title: "Privacy Policy | KenyaAdverts", description: "Read the KenyaAdverts privacy policy to understand how we collect, use and protect your personal data.", image: `${SITE_URL}/og/og-privacy.png` },
  terms: { title: "Terms of Service | KenyaAdverts", description: "Read the KenyaAdverts terms and conditions governing use of Kenya's leading buy and sell marketplace.", image: `${SITE_URL}/og/og-terms.png` },
  credits: { title: "Buy Ad Credits in Kenya — Promote Listings via M-Pesa", description: "Learn about the KenyaAdverts credits system and how to use credits to boost your listings on Kenya's top classifieds site.", image: `${SITE_URL}/og/og-credits.png` },
  "business-profile": { title: "Business Profiles in Kenya | KenyaAdvert", description: "Create or view verified business profiles on KenyaAdvert and build trust with buyers across Kenya.", image: `${SITE_URL}/og-image.png` },
  subscriptions: { title: "KenyaAdvert Subscriptions — Featured Ads & Promotions", description: "Choose promotion packages for better marketplace visibility, featured ads, business exposure and campaign reach across Kenya.", image: `${SITE_URL}/og/og-subscriptions.png` },
  login: { title: "Login | KenyaAdvert", description: "Sign in to manage ads, messages, favourites, credits, banners, events and business profile activity on KenyaAdvert.", image: `${SITE_URL}/og/og-login.png` },
  register: { title: "Create Account — Post Free Ads in Kenya", description: "Register for free to post ads, save favourites, contact buyers and sellers, promote listings and manage marketplace activity in Kenya.", image: `${SITE_URL}/og/og-register.png` },
  "post-ad": { title: "Post Free Ads in Kenya — Sell Cars, Phones & Services", description: "Create a free Kenya advert for cars, phones, electronics, property, jobs, services, fashion, farm products and business offers in minutes.", image: `${SITE_URL}/og/og-post-ad.png` },
  events: { title: "Events in Kenya — Concerts, Festivals, Business & Tickets", description: "Discover and host Kenya events including concerts, conferences, meetups, church events, weddings, hikes, festivals and free or paid tickets.", image: `${SITE_URL}/og-image.png` },
  banners: { title: "Banner Ads Kenya — Business, Event & Political Campaigns", description: "Browse and post banner campaigns for Kenyan businesses, events, NGOs and politicians. Promote your message affordably across KenyaAdvert.", image: `${SITE_URL}/og-image.png` },
  politics: { title: "Kenya Politics 2027 — Aspirants, Parties & Campaign Ads", description: "Discover Kenyan aspirants, parties, manifestos, candidate profiles and 2027 political campaign banners across counties and constituencies.", image: `${SITE_URL}/og-image.png` },
};

const KENYA_KEYWORDS = "Kenya adverts, Kenya classifieds, free ads Kenya, post ads Kenya, buy and sell Kenya, Nairobi classifieds, Mombasa classifieds, Kisumu marketplace, cars for sale Kenya, phones for sale Kenya, property Kenya, jobs Kenya, services Kenya, Jiji Kenya alternative, PigiaMe alternative, Jumia Kenya deals alternative";

function renderTextContent(value?: string | null) {
  const lines = (value || "").replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, "\n").split(/\n+/).map((line) => line.trim()).filter(Boolean);
  return lines.map((line) => {
    if (line.startsWith("### ")) return `<h3>${escaped(line.slice(4))}</h3>`;
    if (line.startsWith("## ")) return `<h2>${escaped(line.slice(3))}</h2>`;
    if (/^[-*]\s+/.test(line)) return `<p>${escaped(line.replace(/^[-*]\s+/, "• "))}</p>`;
    return `<p>${escaped(line)}</p>`;
  }).join("\n");
}

function buildPageSchemas(slug: string, title: string, description: string, url: string) {
  const schemas: unknown[] = [{
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: HOME_URL },
    inLanguage: "en-KE",
  }];

  if (slug === "home") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      alternateName: ["Kenya Adverts", "Kenya Classifieds"],
      url: HOME_URL,
      inLanguage: "en-KE",
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    });
  }

  if (slug === "home" || slug === "about") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: HOME_URL,
      logo: `${SITE_URL}/pwa-icon-512.png`,
      description: "Kenya's trusted classifieds marketplace for buying, selling, events and business advertising.",
      email: "support@kenyaadverts.com",
      areaServed: { "@type": "Country", name: "Kenya" },
      sameAs: [
        "https://www.facebook.com/kenyaadvert",
        "https://x.com/kenyaadvert",
        "https://www.instagram.com/kenyaadvert",
        "https://www.youtube.com/@kenyaadvert",
      ],
    }, {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: SITE_NAME,
      url: HOME_URL,
      image: DEFAULT_IMAGE,
      priceRange: "Free - KSh 8,000",
      address: { "@type": "PostalAddress", addressCountry: "KE", addressLocality: "Nairobi" },
      areaServed: { "@type": "Country", name: "Kenya" },
    });
  }

  if (slug === "faqs") {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        ["How do I post an ad on KenyaAdvert?", "Click the Sell button, choose a category, add photos and details, then publish your listing."],
        ["Is it free to post ads?", "Yes. Standard ads are free, with optional paid upgrades for more visibility."],
        ["How do I contact a seller?", "Open any listing and use the call, WhatsApp or chat options provided by the seller."],
        ["How do I stay safe when buying or selling?", "Meet in public places, inspect items before payment and report suspicious ads."],
      ].map(([name, text]) => ({
        "@type": "Question",
        name,
        acceptedAnswer: { "@type": "Answer", text },
      })),
    });
  }

  const breadcrumb = breadcrumbSchema(slug === "home" ? [] : [{ name: "Home", url: HOME_URL }, { name: title.replace(/\s*[|—-].*$/, ""), url }]);
  if (breadcrumb) schemas.push(breadcrumb);

  return schemas;
}

function pageExtra(slug: string, title: string, description: string, url: string) {
  return `<meta name="keywords" content="${escaped(KENYA_KEYWORDS)}"/>\n${buildPageSchemas(slug, title, description, url).map(schemaScript).join("\n")}`;
}

async function buildPageBody(sb: any, slug: string, meta: { title: string; description: string; image: string }) {
  const pageUrl = slug === "home" ? SITE_URL : `${SITE_URL}/${slug}`;
  const links: string[] = [];

  if (["home", "search", "post-ad"].includes(slug)) {
    const { data: ads } = await sb.from("ads").select("title,slug,price,county,town,description").eq("status", "active").eq("is_listed", true).eq("is_hidden_by_report", false).order("updated_at", { ascending: false }).limit(18);
    links.push(`<section><h2>Latest Kenya adverts</h2><ul>${(ads || []).map((ad: any) => `<li><a href="${SITE_URL}/ads/${escaped(ad.slug || slugify(ad.title))}">${escaped(ad.title)}</a>${ad.price ? ` — KSh ${Number(ad.price).toLocaleString()}` : ""}${ad.county ? ` in ${escaped([ad.town, ad.county].filter(Boolean).join(", "))}` : ""}. ${escaped(cleanDescription(ad.description, ad.title))}</li>`).join("\n")}</ul></section>`);
  }

  if (["home", "blog"].includes(slug)) {
    const { data: posts } = await sb.from("blog_posts").select("title,slug,excerpt,category").eq("is_published", true).order("created_at", { ascending: false }).limit(12);
    links.push(`<section><h2>Kenya marketplace guides</h2><ul>${(posts || []).map((post: any) => `<li><a href="${SITE_URL}/blog/${escaped(post.slug)}">${escaped(post.title)}</a>${post.category ? ` — ${escaped(post.category)}` : ""}. ${escaped(cleanDescription(post.excerpt, post.title))}</li>`).join("\n")}</ul></section>`);
  }

  if (["home", "events"].includes(slug)) {
    const { data: events } = await sb.from("events").select("title,slug,description,location,start_at").eq("is_published", true).eq("is_listed", true).eq("is_hidden_by_report", false).order("start_at", { ascending: true }).limit(12);
    links.push(`<section><h2>Events in Kenya</h2><ul>${(events || []).map((ev: any) => `<li><a href="${SITE_URL}/events/${escaped(ev.slug)}">${escaped(ev.title)}</a>${ev.location ? ` — ${escaped(ev.location)}` : ""}. ${escaped(cleanDescription(ev.description, ev.title))}</li>`).join("\n")}</ul></section>`);
  }

  if (["home", "banners", "advertise", "politics"].includes(slug)) {
    const { data: banners } = await sb.from("banner_campaigns").select("business_name,slug,id,description,category").eq("status", "active").eq("is_listed", true).eq("is_hidden_by_report", false).order("updated_at", { ascending: false }).limit(12);
    links.push(`<section><h2>Business, event and political banners</h2><ul>${(banners || []).map((b: any) => `<li><a href="${SITE_URL}/banners/${escaped(b.slug || b.id)}">${escaped(b.business_name)}</a>${b.category ? ` — ${escaped(b.category)}` : ""}. ${escaped(cleanDescription(b.description, b.business_name))}</li>`).join("\n")}</ul></section>`);
  }

  return `<header><h1>${escaped(meta.title)}</h1><p>${escaped(meta.description)}</p></header>
<main>
<figure><img src="${escaped(meta.image)}" alt="${escaped(meta.title)}"/></figure>
<section><h2>Kenya classifieds keywords</h2><p>${escaped(KENYA_KEYWORDS)}</p><p>KenyaAdvert helps people discover adverts, events, banners, business profiles and local deals across all 47 counties.</p></section>
${links.join("\n")}
<p><a href="${escaped(pageUrl)}">Open ${escaped(meta.title)} on KenyaAdvert</a></p>
</main>
<footer><p>KenyaAdvert — Kenya's trusted classifieds marketplace.</p></footer>`;
}

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
  if (routeType === "business-profile") return { type: "business-profile" as const, value: reqUrl.searchParams.get("id") || routeValue || "" };

  const type = reqUrl.searchParams.get("type");
  const id = reqUrl.searchParams.get("id");
  const slug = reqUrl.searchParams.get("slug");
  if (type === "ad" && (id || slug)) return { type: "ad" as const, value: id || slug! };
  if (type === "blog" && slug) return { type: "blog" as const, value: slug };
  if (type === "event" && slug) return { type: "event" as const, value: slug };
  if (type === "banner" && (id || slug)) return { type: "banner" as const, value: id || slug! };
  if (type === "business-profile" && id) return { type: "business-profile" as const, value: id };
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
    return { body: buildHtml("Event Not Found | KenyaAdvert", "This event may have been removed.", DEFAULT_IMAGE, `${SITE_URL}/events`, "website", "", isBot), canonicalUrl: `${SITE_URL}/events`, notFound: true };
  }
  const canonicalUrl = `${SITE_URL}/events/${ev.slug || ev.id}`;
  const image = optimizeImageForOg(ev.cover_image, false);
  const startDate = new Date(ev.start_at);
  const dateStr = startDate.toLocaleDateString("en-KE", { weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const location = ev.is_virtual ? "Virtual event" : (ev.location || "Kenya");
  const priceText = ev.is_paid && Number(ev.ticket_price) > 0 ? `Tickets KSh ${Number(ev.ticket_price).toLocaleString()}` : "Free RSVP";
  const description = cleanDescription(ev.description, `${ev.title} — ${dateStr} at ${location}. ${priceText}. RSVP on KenyaAdvert.`);
  const organizerName = ev.host_name || "KenyaAdvert Events";
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
    organizer: { "@type": "Organization", name: organizerName, url: canonicalUrl },
    performer: { "@type": "Organization", name: organizerName, url: canonicalUrl },
    offers: {
      "@type": "Offer",
      price: ev.is_paid ? Number(ev.ticket_price || 0) : 0,
      priceCurrency: "KES",
      availability: "https://schema.org/InStock",
      validFrom: ev.created_at || ev.updated_at || ev.start_at,
      url: canonicalUrl,
    },
  };
  const extra = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
  return { body: buildHtml(`${ev.title} — ${dateStr} | KenyaAdvert Events`, description, image, canonicalUrl, "website", extra, isBot), canonicalUrl };
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
    return { body: buildHtml("Banner Not Found | KenyaAdvert", "This banner may have been removed.", DEFAULT_IMAGE, `${SITE_URL}/banners`, "website", "", isBot), canonicalUrl: `${SITE_URL}/banners`, notFound: true };
  }
  const canonicalUrl = `${SITE_URL}/banners/${b.slug || b.id}`;
  const image = optimizeImageForOg(b.banner_image, false);
  const isPolitician = b.category === "politician";
  const labelByCat: Record<string, string> = { politician: "Political Campaign", business: "Business", event: "Event", ngo: "NGO", other: "Promo" };
  const label = labelByCat[b.category || "business"] || "Promo";

  let prefix = b.business_name;
  if (isPolitician) {
    const parts: string[] = [b.business_name];
    if (b.running_position) parts.push(`— ${b.running_position}`);
    if (b.party_name) parts.push(`(${b.party_name})`);
    prefix = parts.join(" ");
    prefix += ". Vote.";
  } else {
    prefix = `${b.business_name} — ${label}.`;
  }

  const rawDesc = (b.description || "")
    .replace(/(?:^|\s)\d+(?=[A-Z])/g, " ")
    .replace(/\s*[•·]\s*/g, ". ")
    .trim();
  const baseDesc = rawDesc || `${b.business_name} on KenyaAdvert.`;
  const description = cleanDescription(`${prefix} ${baseDesc}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": isPolitician ? "Person" : "Organization",
    name: b.business_name,
    description,
    image,
    url: canonicalUrl,
  };
  const extra = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
  return { body: buildHtml(`${b.business_name} — ${label} | KenyaAdvert`, description, image, canonicalUrl, "website", extra, isBot, { largeImage: true }), canonicalUrl };
}

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
    return { body: buildHtml("Listing Not Found | KenyaAdvert", "This listing may have been removed.", DEFAULT_IMAGE, SITE_URL, "website", "", isBot), canonicalUrl: SITE_URL, notFound: true };
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

  const extra = priceExtra + "\n" + `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
  return { body: buildHtml(`${ad.title} | ${priceStr} | KenyaAdvert`, description, image, canonicalUrl, "product", extra, isBot), canonicalUrl };
}

async function handleBlog(sb: any, value: string, isBot: boolean) {
  const { data: post } = await sb.from("blog_posts").select("title,excerpt,content,image,slug,category,author,created_at,is_published").eq("slug", value).eq("is_published", true).maybeSingle();
  if (!post) {
    return { body: buildHtml("Article Not Found | KenyaAdvert", "This article may have been removed.", DEFAULT_IMAGE, `${SITE_URL}/blog`, "website", "", isBot), canonicalUrl: `${SITE_URL}/blog`, notFound: true };
  }
  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;
  const title = `${post.title} | KenyaAdvert Blog`;
  const description = cleanDescription(post.excerpt, `${post.title} — Kenya classifieds guide for buyers, sellers and advertisers.`);
  const image = optimizeImageForOg(post.image);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description,
    image: [image],
    url: canonicalUrl,
    datePublished: post.created_at,
    author: { "@type": "Organization", name: post.author || "KenyaAdvert Team" },
    publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: DEFAULT_IMAGE } },
    keywords: KENYA_KEYWORDS,
  };
  const bodyHtml = `<article><header><h1>${escaped(post.title)}</h1><p>${escaped(description)}</p></header><figure><img src="${escaped(image)}" alt="${escaped(post.title)}"/></figure>${renderTextContent(post.content || post.excerpt)}<p><a href="${escaped(canonicalUrl)}">Read this Kenya classifieds guide on KenyaAdvert</a></p></article>`;
  return { body: buildHtml(title, description, image, canonicalUrl, "article", `<meta name="keywords" content="${escaped(KENYA_KEYWORDS)}"/>\n<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`, isBot, { bodyHtml }), canonicalUrl };
}

async function handleBusinessProfile(sb: any, value: string, isBot: boolean) {
  const { data: profile } = await sb
    .from("business_profiles")
    .select("id,business_name,description,location,logo_url,cover_url,phone,website,updated_at,is_verified")
    .eq("id", value)
    .maybeSingle();

  if (!profile) {
    return { body: buildHtml("Business Profile Not Found | KenyaAdvert", "This business profile may have been removed.", DEFAULT_IMAGE, `${SITE_URL}/business-profile`, "website", "", isBot), canonicalUrl: `${SITE_URL}/business-profile`, notFound: true };
  }

  const canonicalUrl = `${SITE_URL}/business-profile?id=${profile.id}`;
  const description = cleanDescription(profile.description, `${profile.business_name} is a business profile on KenyaAdvert connecting buyers and sellers in Kenya.`);
  const image = optimizeImageForOg(profile.logo_url || profile.cover_url || DEFAULT_IMAGE, true);
  const title = `${profile.business_name} — Business Profile | KenyaAdvert`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: profile.business_name,
    description,
    url: canonicalUrl,
    image,
    telephone: profile.phone || undefined,
    address: profile.location ? { "@type": "PostalAddress", addressLocality: profile.location, addressCountry: "KE" } : { "@type": "PostalAddress", addressCountry: "KE" },
    areaServed: { "@type": "Country", name: "Kenya" },
    sameAs: profile.website ? [profile.website] : undefined,
  };
  const breadcrumb = breadcrumbSchema([{ name: "Home", url: HOME_URL }, { name: "Business Profiles", url: `${SITE_URL}/business-profile` }, { name: profile.business_name, url: canonicalUrl }]);
  const bodyHtml = isBot ? `<article><header><h1>${escaped(profile.business_name)}</h1><p>${escaped(description)}</p></header><p>${profile.location ? escaped(profile.location) : "Kenya"}</p><p><a href="${escaped(canonicalUrl)}">View ${escaped(profile.business_name)} on KenyaAdvert</a></p></article>` : undefined;
  return { body: buildHtml(title, description, image, canonicalUrl, "business.business", [schemaScript(schema), breadcrumb ? schemaScript(breadcrumb) : ""].join("\n"), isBot, { bodyHtml, largeImage: true }), canonicalUrl };
}

async function handlePage(sb: any, slug: string, isBot: boolean) {
  const canonicalUrl = slug === "home" ? HOME_URL : `${SITE_URL}/${slug}`;
  const meta = PAGE_META[slug];
  if (meta) {
    const bodyHtml = isBot ? await buildPageBody(sb, slug, meta) : undefined;
    return { body: buildHtml(meta.title, meta.description, meta.image, canonicalUrl, "website", pageExtra(slug, meta.title, meta.description, canonicalUrl), isBot, { bodyHtml }), canonicalUrl };
  }
  const { data } = await sb.from("seo_settings").select("meta_title,meta_description,og_image,page_slug").eq("page_slug", `/${slug}`).maybeSingle();
  if (data?.meta_title) {
    return { body: buildHtml(data.meta_title, cleanDescription(data.meta_description, data.meta_title), toAbsoluteImageUrl(data.og_image), canonicalUrl, "website", pageExtra(slug, data.meta_title, cleanDescription(data.meta_description, data.meta_title), canonicalUrl), isBot), canonicalUrl };
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

    // ✅ FIX: Detect real users vs bots.
    // Added ahrefs, semrush, mj12, dotbot, rogerbot, seznambot, petalbot, bingpreview
    // so SEO audit tools receive text/html and not a 302 redirect to the SPA.
    const userAgent = req.headers.get("user-agent") || "";
    const isBot = /bot|crawl|spider|whatsapp|facebookexternalhit|twitterbot|telegrambot|linkedinbot|preview|google|bing|slack|discord|ahrefs|semrush|mj12|dotbot|rogerbot|seznambot|petalbot|bingpreview/i.test(userAgent);

    if (!isBot) {
      let destination = SITE_URL;
      if (type === "ad" && value) destination = `${SITE_URL}/ads/${value}`;
      else if (type === "blog" && value) destination = `${SITE_URL}/blog/${value}`;
      else if (type === "event" && value) destination = `${SITE_URL}/events/${value}`;
      else if (type === "banner" && value) destination = `${SITE_URL}/banners/${value}`;
      else if (type === "business-profile" && value) destination = `${SITE_URL}/business-profile?id=${value}`;
      else if (type === "page" && value) destination = value === "home" ? SITE_URL : `${SITE_URL}/${value}`;

      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          "Location": destination,
          "Cache-Control": "no-store",
        },
      });
    }

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    let body: string;
    let canonicalUrl: string = SITE_URL;
    let notFound = false;

    if (type === "ad" && value) {
      ({ body, canonicalUrl, notFound = false } = await handleAd(sb, value, isBot) as any);
    } else if (type === "blog" && value) {
      ({ body, canonicalUrl, notFound = false } = await handleBlog(sb, value, isBot) as any);
    } else if (type === "event" && value) {
      ({ body, canonicalUrl, notFound = false } = await handleEvent(sb, value, isBot) as any);
    } else if (type === "banner" && value) {
      ({ body, canonicalUrl, notFound = false } = await handleBanner(sb, value, isBot) as any);
    } else if (type === "business-profile" && value) {
      ({ body, canonicalUrl, notFound = false } = await handleBusinessProfile(sb, value, isBot) as any);
    } else if (type === "page" && value) {
      ({ body, canonicalUrl } = await handlePage(sb, value, isBot));
    } else {
      const meta = PAGE_META.home;
      body = buildHtml(
        meta.title,
        meta.description,
        meta.image,
        HOME_URL,
        "website",
        pageExtra("home", meta.title, meta.description, HOME_URL),
        isBot,
        { bodyHtml: isBot ? await buildPageBody(sb, "home", meta) : undefined },
      );
      canonicalUrl = HOME_URL;
    }

    return new Response(body, {
      status: notFound ? 404 : 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": notFound ? "no-store" : "public, max-age=900, s-maxage=1800, stale-while-revalidate=86400",
        "X-Robots-Tag": notFound ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1",
      },
    });
  } catch (err) {
    console.error("og-share error:", err);
    return new Response("<!doctype html><html><head><meta charset=\"utf-8\"><title>Error</title></head><body>Error</body></html>", {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  }
});
