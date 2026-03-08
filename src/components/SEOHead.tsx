import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description?: string;
  canonical?: string;
}

const SEOHead = ({ title, description, canonical }: SEOHeadProps) => {
  useEffect(() => {
    const suffix = " | KenyaAdvert";
    const fullTitle = title.includes("KenyaAdvert") ? title : title + suffix;
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

    if (description) {
      setMeta("description", description);
      setMeta("og:description", description, "property");
      setMeta("twitter:description", description);
    }

    setMeta("og:title", fullTitle, "property");
    setMeta("twitter:title", fullTitle);

    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    return () => {
      // Reset to default on unmount
      document.title = "KenyaAdvert — Buy & Sell on Kenya's Trusted Classifieds";
    };
  }, [title, description, canonical]);

  return null;
};

export default SEOHead;
