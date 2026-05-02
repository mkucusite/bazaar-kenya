import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const SUPABASE_FUNCTIONS_URL = "https://tpthlopfhyuuspgooblk.supabase.co/functions/v1/sitemap";

function getSitemapUrl(type: string, category?: string): string {
  if (category) {
    return `${SUPABASE_FUNCTIONS_URL}?type=listings-category&category=${encodeURIComponent(category)}`;
  }
  return `${SUPABASE_FUNCTIONS_URL}?type=${type}`;
}

interface SitemapRouteProps {
  type: string;
}

export default function SitemapRoute({ type }: SitemapRouteProps) {
  const { category } = useParams<{ category?: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        const url = getSitemapUrl(type, category);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const xml = await response.text();
        // Replace entire document with raw XML
        document.open("text/xml");
        document.write(xml);
        document.close();
      } catch (err) {
        console.error("Sitemap fetch error:", err);
        setError(true);
        setLoading(false);
      }
    };
    fetchSitemap();
  }, [type, category]);

  if (error) {
    return (
      <div style={{ padding: "2rem", fontFamily: "monospace" }}>
        <h2>Sitemap Error</h2>
        <p>Could not load sitemap. Please try again later.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "2rem", fontFamily: "monospace" }}>
        Loading sitemap...
      </div>
    );
  }

  return null;
}
