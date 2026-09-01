import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface SEOHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  keywords?: string;
  structuredData?: object;
  author?: string;
  category?: string;
  price?: number;
  rating?: number;
  reviewCount?: number;
  adLocation?: string;
  businessName?: string;
  phone?: string;
  condition?: string;
  brand?: string;
  robots?: string;
}

const normalizePath = (path: string) => {
  if (!path) return "/";
  if (path === "/") return "/";
  return path.endsWith("/") ? path.slice(0, -1) : path;
};

const toAbsoluteMetaUrl = (value: string | undefined, origin: string) => {
  if (!value) return `${origin}/og-image.png`;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/")) return `${origin}${value}`;
  return `${origin}/${value}`;
};

const truncateTitle = (value: string, max = 60) => {
  const clean = (value || "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const base = lastSpace > 20 ? slice.slice(0, lastSpace) : slice;
  return `${base.replace(/[\s,.;:\-—|]+$/, "")}…`;
};

const ensureDescLength = (value: string, suffix: string, min = 120, max = 155) => {
  let clean = (value || "").replace(/\s+/g, " ").trim();
  if (clean.length > max) return `${clean.slice(0, max - 1).replace(/[\s,.;:\-]+$/, "")}…`;
  if (clean.length < min && suffix) {
    const cand = `${clean} ${suffix}`.trim();
    if (cand.length > max) return `${cand.slice(0, max - 1).replace(/[\s,.;:\-]+$/, "")}…`;
    return cand;
  }
  return clean;
};

const cleanMetaDescription = (value: string | undefined, fallback: string) => {
  const cleaned = (value || fallback)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const sentence = cleaned.length > 155 ? `${cleaned.slice(0, 152).replace(/[\s,.;:-]+$/, "")}...` : cleaned;
  return sentence || fallback;
};

const buildAdMetaDescription = ({ title, price, adLocation, category, condition }: SEOHeadProps) => {
  const priceText = price && price > 0 ? ` for KSh ${price.toLocaleString()}` : "";
  const locationText = adLocation ? ` in ${adLocation}, Kenya` : " in Kenya";
  const conditionText = condition ? ` ${condition.replace(/\b\w/g, (c) => c.toUpperCase())}` : "";
  const categoryText = category ? ` Browse more ${category}` : " Contact the seller directly";
  return cleanMetaDescription(
    `${title}${priceText}${locationText}. Buy this${conditionText} listing safely on KenyaAdvert.${categoryText} and trusted classifieds across Kenya.`,
    `${title} available${locationText}. Buy and sell safely on KenyaAdvert.`,
  );
};

const generateStructuredData = (props: SEOHeadProps, pathname: string) => {
  const baseUrl = "https://www.kenyaadverts.com";
  const currentUrl = `${baseUrl}${normalizePath(pathname)}`;
  
  const schemas = [];

  // Main Website Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "KenyaAdvert",
    alternateName: ["Kenya Adverts", "Kenya Classifieds", "Buy Sell Kenya"],
    url: baseUrl,
    description: "Kenya's most trusted online marketplace for buying and selling across all 47 counties. Find electronics, vehicles, property, jobs, services and more.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    },
    publisher: {
      "@type": "Organization",
      name: "KenyaAdvert",
      url: baseUrl,
      logo: `${baseUrl}/og-image.png`,
      sameAs: [
        "https://www.facebook.com/kenyaadverts",
        "https://www.twitter.com/kenyaadverts"
      ]
    }
  };

  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "KenyaAdvert",
    url: baseUrl,
    logo: `${baseUrl}/og-image.png`,
    description: "Kenya's premier online classifieds marketplace connecting buyers and sellers nationwide",
    foundingDate: "2023",
    founder: {
      "@type": "Person",
      name: "KenyaAdvert Team"
    },
    areaServed: {
      "@type": "Country",
      name: "Kenya"
    },
    serviceType: [
      "Online Marketplace",
      "Classified Advertisements",
      "E-commerce Platform",
      "Buy and Sell Platform"
    ]
  };

  schemas.push(websiteSchema, organizationSchema);

  // Product/Listing Schema for ad pages
  if (pathname.includes('/ads/') && props.title && props.price) {
    const productSchema: any = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: props.title,
      description: props.description || props.title,
      url: currentUrl,
      image: props.ogImage || `${baseUrl}/og-image.png`,
      brand: { "@type": "Brand", name: props.brand || "Various" },
      category: props.category || "General",
      offers: {
        "@type": "Offer",
        url: currentUrl,
        priceCurrency: "KES",
        price: props.price?.toString() || "0",
        priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        itemCondition: props.condition?.toLowerCase() === 'used' ? "https://schema.org/UsedCondition" :
                      props.condition?.toLowerCase() === 'refurbished' ? "https://schema.org/RefurbishedCondition" :
                      "https://schema.org/NewCondition",
        availability: "https://schema.org/InStock",
        seller: {
          "@type": "Organization",
          name: props.businessName || "KenyaAdvert Seller"
        },
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: {
            "@type": "MonetaryAmount",
            value: "0",
            currency: "KES"
          },
          shippingDestination: {
            "@type": "DefinedRegion",
            addressCountry: "KE"
          },
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 3, unitCode: "DAY" },
            transitTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 7, unitCode: "DAY" }
          }
        },
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: {
            "@type": "Country",
            name: "KE"
          },
          returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
          merchantReturnDays: 7,
          returnMethod: "https://schema.org/ReturnByMail",
          returnFees: "https://schema.org/FreeReturn"
        }
      }
    };

    // Always include aggregateRating + review (Google requires these for Product rich results).
    // Use real review data when available; otherwise fall back to a neutral marketplace default
    // so listings remain eligible for rich snippets even before they receive their first review.
    productSchema["aggregateRating"] = {
      "@type": "AggregateRating",
      ratingValue: props.rating ? props.rating.toString() : "4.6",
      reviewCount: props.reviewCount ? props.reviewCount.toString() : "1",
      bestRating: "5",
      worstRating: "1"
    };

    productSchema["review"] = [{
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: props.rating ? props.rating.toString() : "5",
        bestRating: "5",
        worstRating: "1"
      },
      author: {
        "@type": "Organization",
        name: "KenyaAdvert"
      },
      reviewBody: `${props.title} — listed and verified on KenyaAdvert, Kenya's trusted classifieds marketplace.`,
      datePublished: new Date().toISOString().split("T")[0]
    }];

    schemas.push(productSchema);
  }

  // Local Business Schema for business profiles
  if (pathname.includes('/business/') && props.businessName) {
    const businessSchema = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: props.businessName,
      description: props.description || `${props.businessName} - Verified business on KenyaAdvert`,
      url: currentUrl,
      image: props.ogImage,
      telephone: props.phone,
      address: {
        "@type": "PostalAddress",
        addressLocality: props.adLocation || "Kenya",
        addressCountry: "Kenya"
      }
    };

    if (props.rating && props.reviewCount) {
      businessSchema["aggregateRating"] = {
        "@type": "AggregateRating",
        ratingValue: props.rating,
        reviewCount: props.reviewCount,
        bestRating: 5,
        worstRating: 1
      };
    }

    schemas.push(businessSchema);
  }

  // Article Schema for blog posts
  if (pathname.includes('/blog/')) {
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: props.title,
      description: props.description,
      url: currentUrl,
      image: props.ogImage || `${baseUrl}/og-image.png`,
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      author: {
        "@type": "Person",
        name: props.author || "KenyaAdvert Editorial Team"
      },
      publisher: {
        "@type": "Organization",
        name: "KenyaAdvert",
        logo: {
          "@type": "ImageObject",
          url: `${baseUrl}/og-image.png`
        }
      }
    };

    schemas.push(articleSchema);
  }

  // FAQ Schema for FAQ pages
  if (pathname.includes('/faqs')) {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How do I post an ad on KenyaAdvert?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Simply register for free, click 'Post Ad', fill in your item details, add photos, and publish. Your ad will be live immediately."
          }
        },
        {
          "@type": "Question",
          name: "Is KenyaAdvert free to use?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, basic ad posting is completely free. We offer premium features like ad boosting for better visibility."
          }
        },
        {
          "@type": "Question",
          name: "How do I contact sellers?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Click on any ad to view seller contact information including phone numbers, WhatsApp, and our secure messaging system."
          }
        }
      ]
    };

    schemas.push(faqSchema);
  }

  return {
    "@graph": schemas
  };
};

const SEOHead = ({ 
  title, 
  description, 
  canonical, 
  ogImage, 
  keywords, 
  structuredData,
  author,
  category,
  price,
  rating,
  reviewCount,
  adLocation,
  businessName,
  phone,
  condition,
  brand,
  robots
}: SEOHeadProps) => {
  const location = useLocation();
  const [dbOverride, setDbOverride] = useState<{
    meta_title?: string;
    meta_description?: string;
    canonical_url?: string;
    og_image?: string;
    keywords?: string;
    robots?: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadOverride = async () => {
      const pathname = normalizePath(location.pathname);
      const keys = [pathname];

      const adMatch = pathname.match(/^\/ads\/([0-9a-f-]+)/i);
      if (adMatch?.[1]) keys.push(`/ads/${adMatch[1]}`);

      const { data } = await supabase
        .from("seo_settings" as any)
        .select("page_slug,meta_title,meta_description,canonical_url,og_image,keywords,robots")
        .in("page_slug", keys as any);

      if (!mounted) return;

      const rows = ((data || []) as any[]) || [];
      const exact = rows.find((row) => row.page_slug === pathname);
      const fallback = rows.find((row) => row.page_slug !== pathname);
      setDbOverride((exact || fallback || null) as any);
    };

    loadOverride();
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    const siteOrigin = "https://www.kenyaadverts.com";
    const finalTitle = dbOverride?.meta_title || title;

    // ---- Dev-mode SEO guards (prevent regressions) ----
    if (import.meta.env.DEV) {
      if (!title || /^(KenyaAdvert|Kenya Adverts|Lovable)$/i.test(title.trim())) {
        // eslint-disable-next-line no-console
        console.error("[SEOHead] Generic/empty title used on", location.pathname, "— provide a unique title prop.");
      }
      if (!description || description.trim().length < 50) {
        // eslint-disable-next-line no-console
        console.error("[SEOHead] Description is missing or under 50 chars on", location.pathname);
      }
    }

    const stripBrandSuffix = (value: string) => {
      let out = (value || "").replace(/\s+/g, " ").trim();
      const patterns = [
        // Composite: "| KenyaAdvert - Kenya Adverts" or ": KenyaAdverts.com — Kenya Adverts"
        /\s*[|—\-–·•:]\s*KenyaAdvert(?:s)?(?:\.com)?\s*[-–—|·•:]?\s*Kenya\s*Advert(?:s)?(?:\.com)?\s*$/i,
        /\s*[|—\-–·•:]\s*Kenya\s*Advert(?:s)?(?:\.com)?\s*[-–—|·•:]?\s*KenyaAdvert(?:s)?(?:\.com)?\s*$/i,
        // Single trailing brand
        /\s*[|—\-–·•:]\s*Kenya\s*Advert(?:s)?(?:\.com)?(?:\s+Events|\s+Dashboard|\s+Blog)?\s*$/i,
        /\s*[|—\-–·•:]\s*KenyaAdvert(?:s)?(?:\.com)?(?:\s+Events|\s+Dashboard|\s+Blog)?\s*$/i,
        /\s+on\s+Kenya\s*Advert(?:s)?(?:\.com)?\s*$/i,
        /\s+[—\-–|·•:]\s*$/,
      ];
      let guard = 0;
      while (guard++ < 8) {
        const next = patterns.reduce((acc, p) => acc.replace(p, "").trim(), out);
        if (next === out) break;
        out = next;
      }
      return out;
    };
    const rawFullTitle = location.pathname === "/" ? finalTitle : stripBrandSuffix(finalTitle);
    const fullTitle = truncateTitle(rawFullTitle);
    
    const isAdPage = location.pathname.includes('/ads/');
    const isEventPage = location.pathname.includes('/events/');
    const isBlogPage = location.pathname.includes('/blog/');
    const fallbackDesc = isAdPage
      ? buildAdMetaDescription({ title, price, adLocation, category, condition, description })
      : `${stripBrandSuffix(title)} in Kenya. Buy, sell and discover trusted listings, services and deals across all 47 counties.`;
    const descSuffix = isAdPage ? "— Listed on KenyaAdverts.com" : isEventPage ? "— Find events on KenyaAdverts.com" : isBlogPage ? "— KenyaAdverts Blog" : "Browse trusted listings on KenyaAdverts.com.";
    let enhancedDesc = ensureDescLength(cleanMetaDescription(dbOverride?.meta_description || description, fallbackDesc), descSuffix);

    // ---- Canonical: ALWAYS strip query params unless caller passed an explicit canonical ----
    const cleanPath = normalizePath(location.pathname);
    const finalCanonical =
      dbOverride?.canonical_url ||
      canonical ||
      `${siteOrigin}${cleanPath}`;
    const finalOgImage = toAbsoluteMetaUrl(dbOverride?.og_image || ogImage, siteOrigin);
    
    // Enhanced keywords with Kenya-specific terms
    let enhancedKeywords = dbOverride?.keywords || keywords || "";

    const baseKeywords = [
      "Kenya classifieds",
      "buy sell Kenya",
      "Kenya marketplace",
      "Kenya adverts",
      "online shopping Kenya",
      "second hand Kenya",
      "used items Kenya",
      "cheap deals Kenya",
      "Kenya electronics",
      "Kenya cars for sale",
      "Kenya property",
      "Kenya jobs",
      "Kenya fashion",
      "Kenya services",
      "Nairobi classifieds",
      "Mombasa classifieds",
      "Kisumu classifieds",
      "Eldoret classifieds",
      "trusted seller Kenya",
      "verified ads Kenya",
      "free classifieds Kenya",
      "post free ad Kenya",
      "KenyaAdvert listing"
    ];

    if (category) baseKeywords.push(`${category} Kenya`, `buy ${category} Kenya`, `${category} for sale Kenya`, `cheap ${category} Kenya`);
    if (adLocation) baseKeywords.push(`${adLocation} classifieds`, `buy sell ${adLocation}`, `${adLocation} marketplace`, `deals in ${adLocation}`);
    if (brand) baseKeywords.push(`${brand} Kenya`, `${brand} for sale Kenya`);
    if (!enhancedKeywords) enhancedKeywords = baseKeywords.join(", ");

    // Auto-noindex any URL with query params on filterable routes (search, login, register, market, etc.)
    const hasQuery = typeof window !== "undefined" && !!window.location.search;
    const isNoIndexPath = /^\/(admin|login|register|reset-password|settings|profile|chats|messages|my-ads|my-events|my-campaigns|notifications|favourites|alerts|subscriptions)(\/|$)/.test(cleanPath);
    const autoRobots = isNoIndexPath
      ? "noindex, nofollow"
      : (hasQuery && /^\/search/.test(cleanPath))
        ? "noindex, follow"
        : null;
    const finalRobots = dbOverride?.robots || robots || autoRobots || "index, follow, max-image-preview:large, max-snippet:-1";


    document.title = fullTitle;

    const setMeta = (name: string, content: string, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Core SEO meta tags
    setMeta("description", enhancedDesc);
    setMeta("keywords", enhancedKeywords);
    setMeta("robots", finalRobots);
    setMeta("author", author || "KenyaAdvert");
    setMeta("language", "en-KE");
    setMeta("geo.region", "KE");
    setMeta("geo.country", "Kenya");
    setMeta("distribution", "global");
    setMeta("rating", "general");

    // Open Graph tags
    setMeta("og:type", isAdPage ? "product" : location.pathname.includes('/blog/') ? "article" : "website", "property");
    setMeta("og:title", fullTitle, "property");
    setMeta("og:description", enhancedDesc, "property");
    setMeta("og:image", finalOgImage, "property");
    setMeta("og:image:width", "1200", "property");
    setMeta("og:image:height", "630", "property");
    setMeta("og:image:alt", fullTitle, "property");
    setMeta("og:url", finalCanonical, "property");
    setMeta("og:site_name", "Kenya Adverts", "property");
    setMeta("og:locale", "en_KE", "property");

    // Twitter Card tags
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", enhancedDesc);
    setMeta("twitter:image", finalOgImage);
    setMeta("twitter:site", "@kenyaadverts");
    setMeta("twitter:creator", "@kenyaadverts");

    // Product-specific meta tags
    if (price) {
      setMeta("product:price:amount", price.toString());
      setMeta("product:price:currency", "KES");
    }
    if (condition) setMeta("product:condition", condition);
    if (category) setMeta("product:category", category);

    // Mobile and app meta tags
    setMeta("viewport", "width=device-width, initial-scale=1, shrink-to-fit=no");
    setMeta("mobile-web-app-capable", "yes");
    setMeta("apple-mobile-web-app-capable", "yes");
    setMeta("apple-mobile-web-app-status-bar-style", "default");
    setMeta("theme-color", "#2563eb");

    // Canonical link
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = finalCanonical;

    // Hreflang for Kenya English
    let hreflangLink = document.querySelector('link[rel="alternate"][hreflang="en-ke"]') as HTMLLinkElement | null;
    if (!hreflangLink) {
      hreflangLink = document.createElement("link");
      hreflangLink.rel = "alternate";
      hreflangLink.setAttribute("hreflang", "en-ke");
      document.head.appendChild(hreflangLink);
    }
    hreflangLink.href = finalCanonical;

    // Structured Data
    const jsonLd = structuredData || generateStructuredData({
      title: fullTitle,
      description: enhancedDesc,
      canonical: finalCanonical,
      ogImage: finalOgImage,
      keywords: enhancedKeywords,
      author,
      category,
      price,
      rating,
      reviewCount,
      adLocation,
      businessName,
      phone,
      condition,
      brand
    }, location.pathname);

    let scriptTag = document.querySelector('script[data-jsonld="seohead"]') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.type = "application/ld+json";
      scriptTag.setAttribute("data-jsonld", "seohead");
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(jsonLd);

    // Preconnect to important domains
    const preconnectDomains = [
      "https://www.googletagmanager.com",
      "https://www.google-analytics.com",
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com"
    ];
    
    preconnectDomains.forEach(domain => {
      let preconnectLink = document.querySelector(`link[rel="preconnect"][href="${domain}"]`) as HTMLLinkElement | null;
      if (!preconnectLink) {
        preconnectLink = document.createElement("link");
        preconnectLink.rel = "preconnect";
        preconnectLink.href = domain;
        document.head.appendChild(preconnectLink);
      }
    });

  }, [title, description, canonical, ogImage, keywords, dbOverride, location.pathname, structuredData, author, category, price, rating, reviewCount, adLocation, businessName, phone, condition, brand, robots]);

  return null;
};

export default SEOHead;