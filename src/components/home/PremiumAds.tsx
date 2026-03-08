import { useRef } from "react";
import { ChevronLeft, ChevronRight, Crown, Sparkles } from "lucide-react";
import { PREMIUM_ADS } from "@/data/mockData";
import AdCard from "@/components/AdCard";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { mapDbAdToCard, type DbAd } from "@/lib/ad-mappers";
import { useQuery } from "@tanstack/react-query";

const AD_FIELDS = "id,title,price,county,town,images,badge,condition,phone,whatsapp,views_count,created_at,slug" as const;

const PremiumAds = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: ads = PREMIUM_ADS } = useQuery({
    queryKey: ["premium-ads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ads")
        .select(AD_FIELDS)
        .eq("status", "active")
        .or("badge.eq.gold,badge.eq.silver")
        .order("created_at", { ascending: false })
        .limit(12);
      return data && data.length > 0 ? (data as DbAd[]).map(mapDbAdToCard) : PREMIUM_ADS;
    },
    staleTime: 5 * 60 * 1000,
  });

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const amount = dir === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <section className="section-padding">
      <div className="container-app">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Crown className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-heading text-lg md:text-xl text-foreground">Premium Ads</h2>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/search?badge=gold" className="text-sm text-primary font-medium hover:underline hidden sm:block">
              View All Premium
            </Link>
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll premium ads left"
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Scroll premium ads right"
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
          {ads.map((ad) => (
            <div key={ad.id} className="min-w-[200px] max-w-[200px] sm:min-w-[220px] sm:max-w-[220px] snap-start flex-shrink-0">
              <AdCard ad={ad} variant={ad.badge === "silver" ? "silver" : "gold"} />
            </div>
          ))}

          <div className="min-w-[200px] max-w-[200px] sm:min-w-[220px] sm:max-w-[220px] snap-start flex-shrink-0">
            <div className="h-full rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-sm text-foreground mb-1">Want to appear here?</p>
              <p className="text-xs text-muted-foreground mb-3">Upgrade your ad to Gold</p>
              <Link to="/my-ads" className="px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors">
                Manage Ads
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PremiumAds;
