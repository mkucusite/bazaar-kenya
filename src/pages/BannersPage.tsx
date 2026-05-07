import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import PromoNavigation from "@/components/PromoNavigation";
import { Button } from "@/components/ui/button";
import { Megaphone, Plus, Vote, Briefcase, CalendarHeart, HeartHandshake, Sparkles, ChevronLeft, ChevronRight, Heart } from "lucide-react";
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
  likes_count?: number;
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
        .select("id,slug,banner_image,business_name,description,category,target_url,votes_count,is_voting_enabled,clicks,impressions,likes_count")
        .eq("status", "active")
        .eq("is_listed", true)
        .order("created_at", { ascending: false })
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

  // Featured = top 6 banners for swipe hero
  const featured = banners.slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Banners & Campaigns Kenya — Politicians, Business, Events | KenyaAdvert"
        description="Browse Kenyan campaign banners. Politicians, businesses, NGOs and event promoters share their message — all in one place."
        canonical="https://www.kenyaadverts.com/banners"
        keywords="political banners Kenya, business advertising Kenya, NGO campaigns, MP MCA campaigns 2027, ad banners Nairobi"
      />
      <Navbar />

      {/* Swipe hero */}
      <BannerHero banners={featured} loading={loading} />

      <main className="container-app py-6 md:py-10">
        <PromoNavigation />

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
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : banners.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {banners.map(b => <BannerCard key={b.id} banner={b} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

// =================== HERO SWIPE CAROUSEL ===================
const BannerHero = ({ banners, loading }: { banners: BannerRow[]; loading: boolean }) => {
  const autoplay = useRef(Autoplay({ delay: 4500, stopOnInteraction: false, stopOnMouseEnter: true }));
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" }, [autoplay.current]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIdx(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  if (loading) {
    return (
      <section className="border-b border-border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
        <div className="container-app py-6 md:py-10">
          <div className="h-72 animate-pulse rounded-3xl bg-muted md:h-96" />
        </div>
      </section>
    );
  }

  if (banners.length === 0) {
    return (
      <section className="border-b border-border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
        <div className="container-app py-12 text-center md:py-16">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            <Megaphone className="h-3 w-3" /> Showcase Kenya
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Banners that <span className="text-primary">move</span> Kenya
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            Politicians, businesses, NGOs and event promoters — share your message with Kenya in minutes.
          </p>
          <Button asChild size="lg" className="mt-6 shadow-md">
            <Link to="/banners/new"><Plus className="mr-2 h-4 w-4" />Create Banner</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent">
      <div className="container-app py-6 md:py-10">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight md:text-4xl">
              Banners that <span className="text-primary">move</span> Kenya
            </h1>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">Swipe through campaigns, businesses & events</p>
          </div>
          <Button asChild size="sm" className="shrink-0 shadow-sm md:size-default">
            <Link to="/banners/new"><Plus className="mr-1.5 h-4 w-4" />Create</Link>
          </Button>
        </div>

        <div className="relative">
          <div ref={emblaRef} className="overflow-hidden rounded-3xl">
            <div className="flex">
              {banners.map((b) => <BannerSlide key={b.id} banner={b} />)}
            </div>
          </div>

          {banners.length > 1 && (
            <>
              <button onClick={() => emblaApi?.scrollPrev()} className="absolute left-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg backdrop-blur transition hover:bg-white sm:flex" aria-label="Previous">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => emblaApi?.scrollNext()} className="absolute right-2 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg backdrop-blur transition hover:bg-white sm:flex" aria-label="Next">
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {banners.length > 1 && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => emblaApi?.scrollTo(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${selectedIdx === i ? "w-6 bg-white" : "w-1.5 bg-white/60"}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const BannerSlide = ({ banner }: { banner: BannerRow }) => {
  const meta = CATEGORY_META[banner.category || "business"] ?? CATEGORY_META.business;
  const Icon = meta.icon;
  return (
    <Link
      to={`/banners/${banner.slug || banner.id}`}
      className="group relative block min-w-0 flex-[0_0_100%] overflow-hidden bg-black"
    >
      <div className="relative h-[55vh] max-h-[520px] min-h-[280px] w-full">
        <img
          src={optimizeImageUrl(banner.banner_image, 1600)}
          alt={banner.business_name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        <span className={`absolute left-4 top-4 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase shadow-md sm:left-6 sm:top-6 ${meta.badgeClass}`}>
          <Icon className="h-3 w-3" /> {meta.label}
        </span>

        <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
          <h3 className="line-clamp-2 text-2xl font-black leading-tight drop-shadow-lg sm:text-4xl">{banner.business_name}</h3>
          {banner.description && (
            <p className="mt-2 line-clamp-2 text-sm text-white/90 sm:text-base">{banner.description}</p>
          )}
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-white/95">
            <Heart className="h-3.5 w-3.5" />{(banner.likes_count || 0).toLocaleString()} likes
          </div>
        </div>
      </div>
    </Link>
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

// =================== UNIFIED BANNER CARD ===================
// Shows the FULL image (object-contain) so flyers / posters are not cropped.
const BannerCard = ({ banner }: { banner: BannerRow }) => {
  const meta = CATEGORY_META[banner.category || "business"] ?? CATEGORY_META.business;
  const Icon = meta.icon;
  return (
    <Link
      to={`/banners/${banner.slug || banner.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-muted/50 to-muted/20" style={{ minHeight: "220px" }}>
        <img
          src={optimizeImageUrl(banner.banner_image, 900)}
          alt={banner.business_name}
          className="max-h-[360px] w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
        <span className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase shadow ${meta.badgeClass}`}>
          <Icon className="h-3 w-3" /> {meta.label}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 text-lg font-bold">{banner.business_name}</h3>
        {banner.description && <p className="line-clamp-2 text-xs text-muted-foreground">{banner.description}</p>}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Heart className="h-3 w-3" />{(banner.likes_count || 0).toLocaleString()}
          </span>
          <span className="text-xs font-semibold text-primary">View →</span>
        </div>
      </div>
    </Link>
  );
};

const CATEGORY_META: Record<string, { label: string; icon: typeof Vote; badgeClass: string }> = {
  politician:{ label: "Politician",icon: Vote,           badgeClass: "bg-primary text-primary-foreground" },
  business:  { label: "Business",  icon: Briefcase,      badgeClass: "bg-blue-500/95 text-white" },
  event:     { label: "Event",     icon: CalendarHeart,  badgeClass: "bg-pink-500/95 text-white" },
  ngo:       { label: "NGO",       icon: HeartHandshake, badgeClass: "bg-emerald-500/95 text-white" },
  other:     { label: "Promo",     icon: Sparkles,       badgeClass: "bg-amber-500/95 text-white" },
};

export default BannersPage;
