import { Clock, Flame, Sparkles } from "lucide-react";
import { useState } from "react";
import { LATEST_ADS } from "@/data/mockData";
import AdCard from "@/components/AdCard";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { mapDbAdToCard, type DbAd } from "@/lib/ad-mappers";
import { useQuery } from "@tanstack/react-query";

const AD_FIELDS = "id,title,price,county,town,images,badge,condition,phone,whatsapp,views_count,created_at,slug,ai_generated" as const;

const badgePriority = (badge?: string | null) => {
  if (badge === "gold") return 0;
  if (badge === "silver") return 1;
  return 2;
};

type Tab = "latest" | "trending" | "premium";

const LatestAds = () => {
  const [tab, setTab] = useState<Tab>("latest");

  const { data: ads = LATEST_ADS.slice(0, 24) } = useQuery({
    queryKey: ["latest-ads", tab],
    queryFn: async () => {
      let q = supabase
        .from("ads")
        .select(AD_FIELDS)
        .eq("status", "active")
        .order("ai_generated", { ascending: true, nullsFirst: true })
        .limit(36);
      if (tab === "trending") q = q.order("views_count", { ascending: false });
      else if (tab === "premium") q = q.in("badge", ["gold", "silver"]).order("created_at", { ascending: false });
      else q = q.order("created_at", { ascending: false });

      const { data } = await q;
      if (data && data.length > 0) {
        const sorted = [...(data as DbAd[])].sort((a, b) => {
          const humanDiff = Number(a.ai_generated ?? false) - Number(b.ai_generated ?? false);
          if (humanDiff !== 0) return humanDiff;
          const diff = badgePriority(a.badge) - badgePriority(b.badge);
          if (diff !== 0) return diff;
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });
        return sorted.map(mapDbAdToCard);
      }
      return LATEST_ADS.slice(0, 24);
    },
    staleTime: 5 * 60 * 1000,
  });

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "latest", label: "Latest", icon: Clock },
    { id: "trending", label: "Trending", icon: Flame },
    { id: "premium", label: "Premium", icon: Sparkles },
  ];

  return (
    <section className="section-padding">
      <div className="container-app">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl text-foreground">Discover Listings</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Fresh deals across every county, updated minute by minute</p>
          </div>
          <Link to="/search" className="text-base text-primary font-medium hover:underline self-start sm:self-auto">
            Browse all →
          </Link>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-thin pb-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="homepage-masonry">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} variant={ad.badge === "gold" ? "gold" : ad.badge === "silver" ? "silver" : "default"} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
          >
            See thousands more listings →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LatestAds;
