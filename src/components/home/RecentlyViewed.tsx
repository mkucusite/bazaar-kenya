import { useEffect, useState } from "react";
import { Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import AdCard from "@/components/AdCard";
import { supabase } from "@/integrations/supabase/client";
import { mapDbAdToCard, type DbAd } from "@/lib/ad-mappers";

const AD_FIELDS = "id,title,price,county,town,images,badge,condition,phone,whatsapp,views_count,created_at,slug" as const;
const STORAGE_KEY = "recently_viewed_ads";

export const trackRecentlyViewed = (adId: string) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    const next = [adId, ...ids.filter((id) => id !== adId)].slice(0, 20);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
};

const RecentlyViewed = () => {
  const [ads, setAds] = useState<ReturnType<typeof mapDbAdToCard>[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const ids: string[] = raw ? JSON.parse(raw) : [];
        if (ids.length === 0) return;
        const { data } = await supabase
          .from("ads")
          .select(AD_FIELDS)
          .in("id", ids.slice(0, 12))
          .eq("status", "active");
        if (cancelled || !data) return;
        // Preserve order from localStorage
        const ordered = ids
          .map((id) => data.find((d: any) => d.id === id))
          .filter(Boolean) as DbAd[];
        setAds(ordered.map(mapDbAdToCard));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (ads.length === 0) return null;

  return (
    <section className="section-padding">
      <div className="container-app">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pick up where you left off</p>
              <h2 className="font-heading text-2xl md:text-3xl text-foreground">Recently Viewed</h2>
            </div>
          </div>
          <Link to="/search" className="hidden text-base font-medium text-primary hover:underline sm:flex sm:items-center sm:gap-1.5">
            Browse more <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 scrollbar-hide sm:-mx-6 sm:px-6">
          <div className="flex snap-x snap-mandatory gap-3 pb-2">
            {ads.map((ad) => (
              <div key={ad.id} className="w-[55vw] shrink-0 snap-start sm:w-[260px] lg:w-[240px]">
                <AdCard ad={ad} variant={ad.badge === "gold" ? "gold" : ad.badge === "silver" ? "silver" : "default"} uniform />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewed;
