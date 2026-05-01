import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Megaphone, Plus, ThumbsUp, ExternalLink, Vote, Briefcase, CalendarHeart, HeartHandshake, Sparkles, MousePointerClick, Eye } from "lucide-react";
import { optimizeImageUrl } from "@/lib/image-utils";

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

const CATEGORIES = [
  { key: "all", label: "All", icon: Sparkles },
  { key: "politician", label: "Politicians", icon: Vote },
  { key: "business", label: "Business", icon: Briefcase },
  { key: "event", label: "Events", icon: CalendarHeart },
  { key: "ngo", label: "NGOs", icon: HeartHandshake },
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
        .order("created_at", { ascending: false })
        .order("clicks", { ascending: false })
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

  const politicians = banners.filter(b => b.category === "politician");
  const others = banners.filter(b => b.category !== "politician");

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Banners & Campaigns Kenya — Vote, Promote, Share | KenyaAdvert"
        description="Browse and vote on Kenyan campaign banners. Politicians, businesses, NGOs and event promoters share their message and gather support — all in one place."
        canonical="https://www.kenyaadverts.com/banners"
        keywords="political banners Kenya, vote banner Kenya, business advertising Kenya, NGO campaigns, MP MCA campaigns 2027, ad banners Nairobi"
      />
      <Navbar />

      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="container-app py-10 md:py-14">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                <Megaphone className="h-3 w-3" /> Showcase Kenya
              </span>
              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                Banners that <span className="text-primary">move</span> Kenya
              </h1>
              <p className="mt-3 text-sm text-muted-foreground md:text-base">
                Politicians collect votes. Businesses get clicks. NGOs raise awareness. Create your own shareable banner page in minutes.
              </p>
            </div>
            <Button asChild size="lg" className="shadow-md">
              <Link to="/banners/new"><Plus className="mr-2 h-4 w-4" />Create Banner</Link>
            </Button>
          </div>
        </div>
      </section>

      <main className="container-app py-6 md:py-10">
        {/* Category filters */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map(c => {
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                onClick={() => setFilter(c.key)}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition ${
                  filter === c.key
                    ? "border-primary bg-primary text-primary-foreground shadow"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {c.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : banners.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Politicians get a dedicated section with poster-style cards */}
            {(filter === "all" || filter === "politician") && politicians.length > 0 && (
              <section className="mb-12">
                <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
                  <Vote className="h-5 w-5 text-primary" /> Political Campaigns
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {politicians.map(b => <PoliticianCard key={b.id} banner={b} />)}
                </div>
              </section>
            )}

            {/* Other categories: business / event / ngo */}
            {(filter === "all" || filter !== "politician") && others.length > 0 && (
              <section>
                {filter === "all" && (
                  <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
                    <Sparkles className="h-5 w-5 text-primary" /> Featured Banners
                  </h2>
                )}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {others.map(b => <StandardCard key={b.id} banner={b} />)}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

const EmptyState = () => (
  <div className="rounded-2xl border border-dashed border-border bg-card py-20 text-center">
    <Megaphone className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
    <p className="mb-1 text-base font-medium">No banners in this category yet.</p>
    <p className="mb-5 text-sm text-muted-foreground">Be the first to create one — it takes 60 seconds.</p>
    <Button asChild>
      <Link to="/banners/new"><Plus className="mr-2 h-4 w-4" />Create Banner</Link>
    </Button>
  </div>
);

// Politician = vertical poster with big vote CTA
const PoliticianCard = ({ banner }: { banner: BannerRow }) => (
  <Link
    to={`/banners/${banner.slug || banner.id}`}
    className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-border bg-card shadow-md transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-xl"
  >
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-b from-primary/30 to-primary/5">
      <img src={optimizeImageUrl(banner.banner_image, 600)} alt={banner.business_name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase text-primary-foreground shadow">
        <Vote className="h-3 w-3" /> Campaign
      </div>
      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <h3 className="line-clamp-2 text-xl font-extrabold leading-tight drop-shadow">{banner.business_name}</h3>
        {banner.description && (
          <p className="mt-1 line-clamp-2 text-xs text-white/80">{banner.description}</p>
        )}
      </div>
    </div>
    <div className="flex items-center justify-between gap-2 border-t border-border bg-card px-4 py-3">
      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
        <Vote className="h-4 w-4" />
        Campaign poster
      </span>
      <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
        View →
      </span>
    </div>
  </Link>
);

// Business / Event / NGO = wide horizontal card
const StandardCard = ({ banner }: { banner: BannerRow }) => {
  const meta = CATEGORY_META[banner.category || "business"] ?? CATEGORY_META.business;
  const Icon = meta.icon;
  return (
    <Link
      to={`/banners/${banner.slug || banner.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="relative aspect-[3/1] w-full overflow-hidden bg-muted">
        <img src={optimizeImageUrl(banner.banner_image, 900)} alt={banner.business_name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" loading="lazy" />
        <span className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase shadow ${meta.badgeClass}`}>
          <Icon className="h-3 w-3" /> {meta.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 text-lg font-bold">{banner.business_name}</h3>
        {banner.description && <p className="line-clamp-2 text-xs text-muted-foreground">{banner.description}</p>}
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><MousePointerClick className="h-3 w-3" />{banner.clicks}</span>
            <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{banner.impressions}</span>
            {banner.is_voting_enabled && (
              <span className="inline-flex items-center gap-1 font-semibold text-primary"><ThumbsUp className="h-3 w-3" />{banner.votes_count}</span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            View <ExternalLink className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
};

const CATEGORY_META: Record<string, { label: string; icon: typeof Vote; badgeClass: string }> = {
  business:  { label: "Business",  icon: Briefcase,      badgeClass: "bg-blue-500/95 text-white" },
  event:     { label: "Event",     icon: CalendarHeart,  badgeClass: "bg-pink-500/95 text-white" },
  ngo:       { label: "NGO",       icon: HeartHandshake, badgeClass: "bg-emerald-500/95 text-white" },
  other:     { label: "Promo",     icon: Sparkles,       badgeClass: "bg-amber-500/95 text-white" },
};

export default BannersPage;
