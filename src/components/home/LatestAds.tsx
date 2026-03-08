import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { LATEST_ADS } from "@/data/mockData";
import AdCard from "@/components/AdCard";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { mapDbAdToCard, type DbAd } from "@/lib/ad-mappers";

const LatestAds = () => {
  const [ads, setAds] = useState(LATEST_ADS.slice(0, 10));

  useEffect(() => {
    const fetchLatest = async () => {
      const { data } = await supabase
        .from("ads")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        setAds((data as DbAd[]).map(mapDbAdToCard));
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
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestAds;
