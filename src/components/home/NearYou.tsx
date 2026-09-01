import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import AdCard from "@/components/AdCard";
import { supabase } from "@/integrations/supabase/client";
import { mapDbAdToCard, type DbAd } from "@/lib/ad-mappers";
import { useLocationPref } from "@/contexts/LocationContext";
import { adVisibilityOr } from "@/lib/aiVisibility";

const AD_FIELDS =
  "id,title,price,county,town,images,badge,condition,phone,whatsapp,views_count,created_at,slug,ai_generated,user_id" as const;

/** Ads from the visitor's own county — human listings first. */
const NearYou = () => {
  const { county } = useLocationPref();

  const { data: ads = [] } = useQuery({
    queryKey: ["near-you", county],
    enabled: Boolean(county),
    queryFn: async () => {
      const { data } = await supabase
        .from("ads")
        .select(AD_FIELDS)
        .eq("status", "active")
        .or(adVisibilityOr())
        .eq("county", county as string)
        .order("ai_generated", { ascending: true, nullsFirst: true })
        .order("created_at", { ascending: false })
        .limit(10);
      return data ? (data as unknown as DbAd[]).map(mapDbAdToCard) : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  if (!county || ads.length === 0) return null;

  return (
    <section className="container-app py-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Closest to you</p>
          <h2 className="flex items-center gap-1.5 font-heading text-xl text-foreground sm:text-2xl">
            <MapPin className="h-4 w-4 text-primary" /> Available in {county}
          </h2>
        </div>
        <Link
          to={`/search?county=${encodeURIComponent(county)}`}
          className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline sm:text-sm"
        >
          See all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:mx-0 sm:px-0">
        {ads.map((ad) => (
          <div key={ad.id} className="w-[62vw] shrink-0 snap-start sm:w-[240px]">
            <AdCard ad={ad} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default NearYou;
