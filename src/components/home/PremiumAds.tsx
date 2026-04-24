import { useRef, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, Crown, Sparkles, Plus, TrendingUp, Megaphone } from "lucide-react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPausedRef = useRef(false);

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

  // Pick a CTA per render (rotate randomly)
  const cta = useMemo(() => MIDDLE_CTAS[Math.floor(Math.random() * MIDDLE_CTAS.length)], []);

  // Build the carousel items: ads with a CTA inserted at the middle.
  // Then duplicate the entire sequence for seamless infinite loop.
  const baseItems = useMemo(() => {
    const items: Array<{ kind: "ad"; ad: typeof ads[number] } | { kind: "cta" }> = ads.map((ad) => ({ kind: "ad" as const, ad }));
    if (items.length >= 4) {
      const mid = Math.floor(items.length / 2);
      items.splice(mid, 0, { kind: "cta" as const });
    } else {
      items.push({ kind: "cta" as const });
    }
    return items;
  }, [ads]);

  // Duplicate for infinite loop trick
  const loopItems = useMemo(() => [...baseItems, ...baseItems], [baseItems]);

  const scroll = useCallback((dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = dir === "left" ? -240 : 240;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }, []);

  // Seamless infinite loop: when reaching halfway+, jump back without animation.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const halfWidth = el.scrollWidth / 2;
      if (el.scrollLeft >= halfWidth) {
        el.scrollLeft = el.scrollLeft - halfWidth;
      } else if (el.scrollLeft <= 0) {
        el.scrollLeft = halfWidth + el.scrollLeft;
      }
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [loopItems.length]);

  // Auto-advance: jump one card at a time every 3s (paginated, not continuous crawl)
  useEffect(() => {
    const CARD_STEP = 236; // card width (~220) + gap (16)
    const start = () => {
      autoScrollRef.current = setInterval(() => {
        if (isPausedRef.current) return;
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: CARD_STEP, behavior: "smooth" });
      }, 3000);
    };
    start();
    return () => {
      if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    };
  }, []);

  const pause = () => { isPausedRef.current = true; };
  const resume = () => { isPausedRef.current = false; };

  return (
    <section className="section-padding" style={{ minHeight: 420 }}>
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

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4"
          onPointerEnter={pause}
          onPointerLeave={resume}
          onTouchStart={pause}
          onTouchEnd={() => setTimeout(resume, 2000)}
        >
          {loopItems.map((item, idx) => {
            if (item.kind === "ad") {
              return (
                <div
                  key={`${item.ad.id}-${idx}`}
                  className="min-w-[200px] max-w-[200px] sm:min-w-[220px] sm:max-w-[220px] flex-shrink-0"
                >
                  <AdCard ad={item.ad} variant={item.ad.badge === "silver" ? "silver" : "gold"} />
                </div>
              );
            }

            const Icon = cta.icon;
            return (
              <div
                key={`cta-${idx}`}
                className="min-w-[200px] max-w-[200px] sm:min-w-[220px] sm:max-w-[220px] flex-shrink-0"
              >
                <Link
                  to={cta.to}
                  className={`group h-full rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-br ${cta.bg} p-4 flex flex-col items-center justify-center text-center hover:border-primary transition-all hover:shadow-lg`}
                >
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-sm text-foreground mb-1">{cta.title}</p>
                  <p className="text-xs text-muted-foreground mb-3">{cta.body}</p>
                  <span className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg">
                    {cta.cta}
                  </span>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PremiumAds;
