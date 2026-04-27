import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Megaphone, Plus, ThumbsUp, ExternalLink } from "lucide-react";

type BannerRow = {
  id: string;
  slug: string | null;
  banner_image: string;
  business_name: string;
  description: string | null;
  category: string | null;
  target_url: string;
  votes_count: number;
  is_voting_enabled: boolean;
  clicks: number;
  impressions: number;
};

const categories = [
  { key: "all", label: "All" },
  { key: "politician", label: "Politicians" },
  { key: "business", label: "Business" },
  { key: "event", label: "Events" },
  { key: "ngo", label: "NGOs" },
];

const BannersPage = () => {
  const [banners, setBanners] = useState<BannerRow[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      let q = supabase
        .from("banner_campaigns" as any)
        .select("id,slug,banner_image,business_name,description,category,target_url,votes_count,is_voting_enabled,clicks,impressions")
        .eq("status", "active")
        .order("votes_count", { ascending: false })
        .limit(60);
      if (filter !== "all") q = q.eq("category", filter);
      const { data } = await q;
      if (mounted) {
        setBanners((data as any) || []);
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [filter]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Banners & Campaigns — Vote, Share, Promote | KenyaAdvert"
        description="Browse and vote on Kenyan campaign banners. Politicians, businesses, NGOs and event promoters share their message and gather support."
        canonical="https://www.kenyaadverts.co.ke/banners"
        keywords="political banners Kenya, vote banner Kenya, business advertising Kenya, campaign banners Nairobi"
      />
      <Navbar />
      <main className="container-app py-6 md:py-10">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Banners & Campaigns</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Politicians, businesses and promoters — share your message, collect votes & clicks.
            </p>
          </div>
          <Button asChild size="lg" className="shadow-md">
            <Link to="/banners/new"><Plus className="mr-2 h-4 w-4" />Create Banner</Link>
          </Button>
        </header>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
          {categories.map(c => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                filter === c.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : banners.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card py-20 text-center">
            <Megaphone className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No banners in this category yet.</p>
            <Button asChild className="mt-4">
              <Link to="/banners/new"><Plus className="mr-2 h-4 w-4" />Create the first one</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {banners.map(b => <BannerCard key={b.id} banner={b} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

const BannerCard = ({ banner }: { banner: BannerRow }) => {
  return (
    <Link
      to={`/banners/${banner.slug || banner.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        <img src={banner.banner_image} alt={banner.business_name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        {banner.category && (
          <span className="absolute left-3 top-3 rounded-full bg-background/95 px-2.5 py-1 text-[10px] font-bold uppercase text-foreground shadow-sm backdrop-blur-sm">
            {banner.category}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 text-lg font-semibold">{banner.business_name}</h3>
        {banner.description && <p className="line-clamp-2 text-xs text-muted-foreground">{banner.description}</p>}
        <div className="mt-auto flex items-center justify-between pt-2 text-xs">
          {banner.is_voting_enabled ? (
            <span className="flex items-center gap-1 font-semibold text-primary">
              <ThumbsUp className="h-3 w-3" />
              {banner.votes_count} votes
            </span>
          ) : (
            <span className="text-muted-foreground">{banner.clicks} clicks</span>
          )}
          <span className="flex items-center gap-1 text-muted-foreground">
            <ExternalLink className="h-3 w-3" />Visit
          </span>
        </div>
      </div>
    </Link>
  );
};

export default BannersPage;
