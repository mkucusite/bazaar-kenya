import { Flame, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import AdCard from "@/components/AdCard";
import { supabase } from "@/integrations/supabase/client";
import { mapDbAdToCard, type DbAd } from "@/lib/ad-mappers";
import { useQuery } from "@tanstack/react-query";

const AD_FIELDS = "id,title,price,county,town,images,badge,condition,phone,whatsapp,views_count,created_at,slug" as const;

const HotDeals = () => {
  const { data: ads = [] } = useQuery({
    queryKey: ["hot-deals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ads")
        .select(AD_FIELDS)
        .eq("status", "active")
        .gt("price", 0)
        .order("views_count", { ascending: false })
        .limit(12);
      return data && data.length > 0 ? (data as DbAd[]).map(mapDbAdToCard) : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (ads.length === 0) return null;

  return (
    <section className="section-padding scroll-reveal bg-gradient-to-b from-background to-secondary/20">
      <div className="container-app">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-destructive">Limited time</p>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-destructive/10 p-1.5">
                <Flame className="h-4 w-4 text-destructive" />
              </div>
              <h2 className="font-heading text-2xl md:text-3xl text-foreground">Hot Deals Today</h2>
            </div>
          </div>
          <Link to="/search?sort=popular" className="hidden text-base font-medium text-primary hover:underline sm:flex sm:items-center sm:gap-1.5">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="market-scroll -mx-4 overflow-x-auto px-4 scrollbar-hide sm:-mx-6 sm:px-6">
          <div className="flex snap-x snap-mandatory gap-3 pb-2">
            {ads.map((ad) => (
              <div key={ad.id} className="w-[68vw] shrink-0 snap-start sm:w-[270px] lg:w-[250px]">
                <AdCard ad={ad} variant={ad.badge === "gold" ? "gold" : ad.badge === "silver" ? "silver" : "default"} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HotDeals;
