import { useMemo } from "react";
import { Crown, Plus, Megaphone, ArrowRight } from "lucide-react";
import { PREMIUM_ADS } from "@/data/mockData";
import AdCard from "@/components/AdCard";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { mapDbAdToCard, type DbAd } from "@/lib/ad-mappers";
import { useQuery } from "@tanstack/react-query";

const AD_FIELDS = "id,title,price,county,town,images,badge,condition,phone,whatsapp,views_count,created_at,slug" as const;

const MIDDLE_CTAS = [
  {
    icon: Plus,
    title: "Sell Yours Today",
    body: "Post a free ad in 2 minutes",
    cta: "Post Ad",
    to: "/post-ad",
    bg: "from-primary/15 to-primary/5",
  },
  {
    icon: Crown,
    title: "Go Gold",
    body: "Boost your ad to the top",
    cta: "Upgrade Now",
    to: "/my-ads",
    bg: "from-gold/20 to-gold/5",
  },
  {
    icon: Megaphone,
    title: "Advertise Your Business",
    body: "Reach thousands of buyers",
    cta: "Get a Banner",
    to: "/advertise",
    bg: "from-primary/15 to-secondary/40",
  },
];

const PremiumAds = () => {
  const { data: ads = PREMIUM_ADS } = useQuery({
    queryKey: ["premium-ads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ads")
        .select(AD_FIELDS)
        .eq("status", "active")
        .or("badge.eq.gold,badge.eq.silver")
        .order("created_at", { ascending: false })
        .limit(18);
      return data && data.length > 0 ? (data as DbAd[]).map(mapDbAdToCard) : PREMIUM_ADS;
    },
    staleTime: 5 * 60 * 1000,
  });

  const cta = useMemo(() => MIDDLE_CTAS[Math.floor(Math.random() * MIDDLE_CTAS.length)], []);
  const Icon = cta.icon;
  const wallAds = ads.slice(0, 14);

  return (
    <section className="section-padding scroll-reveal bg-gradient-to-b from-background via-gold-light/30 to-background">
      <div className="container-app">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Verified · Top-ranked</p>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Crown className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-heading text-2xl md:text-3xl text-foreground">Premium Listings</h2>
            </div>
          </div>
          <Link to="/search?badge=gold" className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline md:text-base">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="homepage-masonry">
          {wallAds.slice(0, 5).map((ad) => (
            <AdCard key={ad.id} ad={ad} variant={ad.badge === "silver" ? "silver" : "gold"} />
          ))}
          <Link to={cta.to} className="listing-card-motion mb-3 block break-inside-avoid rounded-lg border border-primary/15 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
              <Icon className="h-5 w-5" />
            </div>
            <p className="mb-2 font-heading text-lg font-bold text-foreground">{cta.title}</p>
            <p className="mb-4 text-sm text-muted-foreground">{cta.body}</p>
            <span className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">
              {cta.cta}
            </span>
          </Link>
          {wallAds.slice(5).map((ad) => (
            <AdCard key={ad.id} ad={ad} variant={ad.badge === "silver" ? "silver" : "gold"} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PremiumAds;
