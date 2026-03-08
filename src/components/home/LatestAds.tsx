import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { LATEST_ADS } from "@/data/mockData";
import AdCard from "@/components/AdCard";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { mapDbAdToCard, type DbAd } from "@/lib/ad-mappers";

const badgePriority = (badge?: string | null) => {
  if (badge === "gold") return 0;
  if (badge === "silver") return 1;
  return 2;
};

const LatestAds = () => {
  const [ads, setAds] = useState(LATEST_ADS.slice(0, 12));

  useEffect(() => {
    const fetchLatest = async () => {
      const { data } = await supabase
        .from("ads")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        const sorted = [...(data as DbAd[])].sort((a, b) => {
          const diff = badgePriority(a.badge) - badgePriority(b.badge);
          if (diff !== 0) return diff;
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });
        setAds(sorted.map(mapDbAdToCard));
      }
    };

    fetchLatest();
  }, []);

  return (
    <section className="section-padding">
      <div className="container-app">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-heading text-lg md:text-xl text-foreground">Latest Ads</h2>
          </div>
          <Link to="/search" className="text-sm text-primary font-medium hover:underline">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} variant={ad.badge === "gold" ? "gold" : ad.badge === "silver" ? "silver" : "default"} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestAds;
