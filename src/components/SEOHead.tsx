import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SEOHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  keywords?: string;
}

const SEOHead = ({ title, description, canonical, ogImage, keywords }: SEOHeadProps) => {
  const [dbOverride, setDbOverride] = useState<{
    meta_title?: string;
    meta_description?: string;
    canonical_url?: string;
    og_image?: string;
    keywords?: string;
    robots?: string;
  } | null>(null);

  useEffect(() => {
    // Try to fetch SEO override from database for current path
    const path = window.location.pathname;
    supabase
      .from("seo_settings" as any)
      .select("meta_title,meta_description,canonical_url,og_image,keywords,robots")
      .eq("page_slug", path)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setDbOverride(data as any);
      });
  }, []);

  useEffect(() => {
    const suffix = " | KenyaAdvert";
    const finalTitle = (dbOverride?.meta_title || title);
    const fullTitle = finalTitle.includes("KenyaAdvert") ? finalTitle : finalTitle + suffix;
    const finalDesc = dbOverride?.meta_description || description;
    const finalCanonical = dbOverride?.canonical_url || canonical;
    const finalOgImage = dbOverride?.og_image || ogImage || "https://kenyaadverts.co.ke/og-image.png";
    const finalKeywords = dbOverride?.keywords || keywords;
    const finalRobots = dbOverride?.robots || "index, follow";

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

    if (finalDesc) {
      setMeta("description", finalDesc);
      setMeta("og:description", finalDesc, "property");
      setMeta("twitter:description", finalDesc);
    }

    setMeta("og:title", fullTitle, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:site_name", "KenyaAdvert", "property");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:card", "summary_large_image");

    if (finalOgImage) {
      setMeta("og:image", finalOgImage, "property");
      setMeta("twitter:image", finalOgImage);
    }

    if (finalKeywords) {
      setMeta("keywords", finalKeywords);
    }

    setMeta("robots", finalRobots);

    if (finalCanonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = finalCanonical;

      setMeta("og:url", finalCanonical, "property");
    }

    return () => {
      document.title = "KenyaAdvert — Buy & Sell on Kenya's Trusted Classifieds";
    };
  }, [title, description, canonical, ogImage, keywords, dbOverride]);

  return null;
};

export default SEOHead;
