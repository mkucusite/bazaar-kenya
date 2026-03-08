import { useEffect, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const DynamicPage = () => {
  const location = useLocation();
  const slug = location.pathname.replace(/^\//, "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      setLoading(true);
      const { data } = await (supabase as any)
        .from("site_pages")
        .select("title, content")
        .eq("slug", slug)
        .maybeSingle();
      if (data) {
        setTitle(data.title);
        setContent(data.content);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  // Simple markdown-like rendering
  const renderContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return <h2 key={i} className="font-heading text-lg text-foreground mt-6 mb-2">{line.slice(3)}</h2>;
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} className="font-semibold text-foreground text-sm mb-2">{line.slice(2, -2)}</p>;
      }
      if (line.startsWith("- **")) {
        const match = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)$/);
        if (match) {
          return (
            <li key={i} className="text-sm text-muted-foreground ml-4 mb-1">
              <span className="font-semibold text-foreground">{match[1]}</span>{match[2] ? `: ${match[2]}` : ""}
            </li>
          );
        }
      }
      if (line.startsWith("- ")) {
        return <li key={i} className="text-sm text-muted-foreground ml-4 mb-1">{line.slice(2)}</li>;
      }
      if (line.trim() === "") return <br key={i} />;
      // Inline bold
      const parts = line.split(/\*\*(.+?)\*\*/g);
      return (
        <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-1">
          {parts.map((part, j) => j % 2 === 1 ? <strong key={j} className="text-foreground">{part}</strong> : part)}
        </p>
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container-app py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container-app py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-heading text-2xl md:text-3xl text-foreground mb-6">{title}</h1>
          <div className="space-y-1">{renderContent(content)}</div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DynamicPage;
