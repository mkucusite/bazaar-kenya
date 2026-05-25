import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import OptimizedImage from "@/components/OptimizedImage";
import { Loader2, Download, Lock, Tag } from "lucide-react";

type DP = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  price: number | null;
  category: string | null;
  images: string[] | null;
  access_type: "public" | "restricted";
};

const CATEGORIES = ["All", "Software", "Operating Systems", "E-books", "Courses", "Templates", "Music", "Other"];

const DigitalStorePage = () => {
  const [products, setProducts] = useState<DP[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("All");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("digital_products")
        .select("id,slug,title,short_description,price,category,images,access_type")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      setProducts((data || []) as DP[]);
      setLoading(false);
    })();
  }, []);

  const filtered = cat === "All" ? products : products.filter((p) => p.category === cat);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Digital Store — Software, E-books & Courses | KenyaAdvert"
        description="Buy digital products in Kenya: Windows licenses, Microsoft Office, e-books, online courses, design templates, music and more. Instant delivery via secure link."
        canonical="https://www.kenyaadverts.com/digital-store"
        keywords="digital products Kenya, buy Windows 10 Kenya, Microsoft Office Kenya, e-books Kenya, online courses Kenya, digital downloads Kenya, software keys Kenya"
      />
      <Navbar />
      <main className="container-app py-6">
        <header className="mb-5">
          <h1 className="font-heading text-2xl md:text-3xl text-foreground">Digital Store</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Software, operating systems, e-books, courses & templates. Instant delivery.
          </p>
        </header>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition ${
                cat === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">
            No digital products in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filtered.map((p) => {
              const img = p.images?.[0] || "/placeholder.svg";
              return (
                <Link
                  key={p.id}
                  to={`/digital-store/${p.slug}`}
                  className="group block bg-card border border-border/60 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                    <OptimizedImage
                      src={img}
                      alt={p.title}
                      width={400}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {p.access_type === "restricted" && (
                      <span className="absolute top-2 right-2 bg-background/90 text-foreground text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Restricted
                      </span>
                    )}
                    <span className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg px-2.5 py-1 shadow">
                      {p.price && p.price > 0 ? `KSh ${Number(p.price).toLocaleString()}` : "Free"}
                    </span>
                  </div>
                  <div className="p-3">
                    <h2 className="font-medium text-sm text-foreground line-clamp-2 leading-snug min-h-[2.5rem]">
                      {p.title}
                    </h2>
                    {p.category && (
                      <p className="mt-1.5 text-[11px] text-muted-foreground flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {p.category}
                      </p>
                    )}
                    <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-primary font-medium">
                      <Download className="w-3 h-3" /> View details
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default DigitalStorePage;
