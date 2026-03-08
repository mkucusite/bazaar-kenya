import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface SEOHeadProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  keywords?: string;
}

const normalizePath = (path: string) => {
  if (!path) return "/";
  if (path === "/") return "/";
  return path.endsWith("/") ? path.slice(0, -1) : path;
};

const SEOHead = ({ title, description, canonical, ogImage, keywords }: SEOHeadProps) => {
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
    const suffix = " | KenyaAdvert";
    const finalTitle = dbOverride?.meta_title || title;
    const fullTitle = finalTitle.includes("KenyaAdvert") ? finalTitle : finalTitle + suffix;
    const finalDesc = dbOverride?.meta_description || description || "";
    const finalCanonical =
      dbOverride?.canonical_url ||
      canonical ||
      `${window.location.origin}${normalizePath(location.pathname)}`;
    const finalOgImage = dbOverride?.og_image || ogImage || `${window.location.origin}/og-image.png`;
    const finalKeywords = dbOverride?.keywords || keywords || "";
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

    setMeta("description", finalDesc);
    setMeta("og:description", finalDesc, "property");
    setMeta("twitter:description", finalDesc);
    setMeta("og:title", fullTitle, "property");
    setMeta("og:type", "website", "property");
    setMeta("og:site_name", "KenyaAdvert", "property");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:card", "summary_large_image");
    setMeta("og:image", finalOgImage, "property");
    setMeta("twitter:image", finalOgImage);
    setMeta("keywords", finalKeywords);
    setMeta("robots", finalRobots);

    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = finalCanonical;

    setMeta("og:url", finalCanonical, "property");
  }, [title, description, canonical, ogImage, keywords, dbOverride, location.pathname]);

  return null;
};

export default SEOHead;
