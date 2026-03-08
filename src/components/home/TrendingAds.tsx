import { Flame } from "lucide-react";
import AdCard from "@/components/AdCard";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { mapDbAdToCard, type DbAd } from "@/lib/ad-mappers";
import { useQuery } from "@tanstack/react-query";

const AD_FIELDS = "id,title,price,county,town,images,badge,condition,phone,whatsapp,views_count,created_at,slug" as const;

const TrendingAds = () => {
  const { data: ads = [] } = useQuery({
    queryKey: ["trending-ads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ads")
        .select(AD_FIELDS)
        .eq("status", "active")
        .order("views_count", { ascending: false })
        .limit(8);
      return data && data.length > 0 ? (data as DbAd[]).map(mapDbAdToCard) : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (ads.length === 0) return null;

  return (
    <section className="section-padding">
      <div className="container-app">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-destructive/10">
              <Flame className="w-4 h-4 text-destructive" />
            </div>
            <h2 className="font-heading text-lg md:text-xl text-foreground">Trending Now</h2>
          </div>
          <Link to="/search?sort=popular" className="text-sm text-primary font-medium hover:underline">
            View All Trending
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} variant={ad.badge === "gold" ? "gold" : ad.badge === "silver" ? "silver" : "default"} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendingAds;
