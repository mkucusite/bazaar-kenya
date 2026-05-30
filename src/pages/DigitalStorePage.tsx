import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import OptimizedImage from "@/components/OptimizedImage";
import { Loader2, Download, Lock, Tag, ShieldCheck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PREMIUM_ADS } from "@/data/mockData";
import { getAdPath } from "@/lib/ad-links";

type DP = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  price: number | null;
  category: string | null;
  images: string[] | null;
  access_mode: "public" | "restricted";
  is_verified_seller: boolean;
  seller_name: string | null;
};

const CATEGORIES = ["All", "Software", "Operating Systems", "E-books", "Courses", "Templates", "Music", "Other"];

const DigitalStorePage = () => {
  const [products, setProducts] = useState<DP[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("digital_products")
        .select("id,slug,title,short_description,price,category,images,access_mode,is_verified_seller,seller_name")
        .eq("is_published", true)
        .eq("approval_status", "approved")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      setProducts((data || []) as DP[]);
      setLoading(false);
    })();
  }, []);

  const filtered = products
    .filter((p) => cat === "All" || p.category === cat)
    .filter((p) => !q.trim() || p.title.toLowerCase().includes(q.toLowerCase()) || (p.short_description || "").toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Digital Store — Software, E-books & Courses | KenyaAdvert"
        description="Buy verified digital products in Kenya: Windows licenses, Microsoft Office, e-books, online courses, design templates, music and more. Instant secure delivery."
        canonical="https://www.kenyaadverts.com/digital-store"
        keywords="digital products Kenya, buy Windows 10 Kenya, Microsoft Office Kenya, e-books Kenya, online courses Kenya, digital downloads Kenya, software keys Kenya"
      />
      <Navbar />

      {/* Classic hero */}
      <section className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container-app py-8 md:py-12">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3" /> Verified Sellers
          </div>
          <h1 className="mt-3 font-heading text-3xl md:text-4xl text-foreground tracking-tight">Digital Store</h1>
          <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-xl">
            Genuine software, operating systems, e-books, online courses & templates. Instant delivery from verified sellers.
          </p>

          <div className="mt-5 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)}
                   placeholder="Search Windows, Office, books, courses..."
                   className="pl-9 h-11" />
          </div>
        </div>
      </section>

      <main className="container-app py-6">
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
            No digital products yet.
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
                    {p.is_verified_seller && (
                      <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                        <ShieldCheck className="w-2.5 h-2.5" /> Verified
                      </span>
                    )}
                    {p.access_mode === "restricted" && (
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
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                      {p.category && (
                        <span className="flex items-center gap-1 truncate"><Tag className="w-3 h-3" /> {p.category}</span>
                      )}
                      {p.seller_name && <span className="truncate ml-2">{p.seller_name}</span>}
                    </div>
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

      <section className="container-app py-8 border-t border-border/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-heading mb-3">Related Categories & Featured Ads</h2>
          <div className="flex flex-wrap gap-3 mb-4">
            {CATEGORIES.filter(c => c !== "All").slice(0,6).map((c) => (
              <a key={c} href={`/search?category=${encodeURIComponent(c)}`} className="px-3 py-1 rounded-full bg-card text-sm hover:bg-primary/5">{c}</a>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PREMIUM_ADS.slice(0,6).map((a) => (
              <a key={a.id} href={getAdPath({ id: a.id, title: a.title, slug: a.slug })} className="block p-3 bg-card rounded-lg hover:shadow-sm">
                <div className="font-medium text-sm truncate">{a.title}</div>
                <div className="text-xs text-muted-foreground">{a.location} · KSh {a.price.toLocaleString()}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default DigitalStorePage;
