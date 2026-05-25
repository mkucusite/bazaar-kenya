import { Clock } from "lucide-react";
import { LATEST_ADS } from "@/data/mockData";
import AdCard from "@/components/AdCard";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { mapDbAdToCard, type DbAd } from "@/lib/ad-mappers";
import { useQuery } from "@tanstack/react-query";

const AD_FIELDS = "id,title,price,county,town,images,badge,condition,phone,whatsapp,views_count,created_at,slug" as const;

const badgePriority = (badge?: string | null) => {
  if (badge === "gold") return 0;
  if (badge === "silver") return 1;
  return 2;
};

const LatestAds = () => {
  const { data: ads = LATEST_ADS.slice(0, 12) } = useQuery({
    queryKey: ["latest-ads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ads")
        .select(AD_FIELDS)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        const sorted = [...(data as DbAd[])].sort((a, b) => {
          const diff = badgePriority(a.badge) - badgePriority(b.badge);
          if (diff !== 0) return diff;
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });
        return sorted.map(mapDbAdToCard);
      }
      return LATEST_ADS.slice(0, 12);
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <section className="section-padding">
      <div className="container-app">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-heading text-2xl md:text-3xl text-foreground">Latest Ads</h2>
          </div>
          <Link to="/search" className="text-base text-primary font-medium hover:underline">
            View All Ads
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5 xl:gap-5">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} variant={ad.badge === "gold" ? "gold" : ad.badge === "silver" ? "silver" : "default"} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestAds;
