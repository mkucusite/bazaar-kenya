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
  const autoScrollRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);
  const segmentWidthRef = useRef(0);

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

  // Duplicate several times so the visible movement stays continuous with no obvious reset.
  const loopItems = useMemo(() => [...baseItems, ...baseItems, ...baseItems, ...baseItems], [baseItems]);

  const syncSegmentWidth = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return 0;
    const width = el.scrollWidth / 4;
    segmentWidthRef.current = Number.isFinite(width) ? width : 0;
    return segmentWidthRef.current;
  }, []);

  const scroll = useCallback((dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const card = 230;
    const visible = Math.max(1, Math.floor(el.clientWidth / card));
    const amount = (dir === "left" ? -1 : 1) * card * Math.max(2, visible - 1);
    isPausedRef.current = true;
    el.scrollBy({ left: amount, behavior: "smooth" });
    window.setTimeout(() => { isPausedRef.current = false; }, 1200);
  }, []);

  // Horizontal wheel scroll on desktop (Shift+wheel or vertical wheel → horizontal)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        isPausedRef.current = true;
        el.scrollLeft += e.deltaX || e.deltaY;
        window.setTimeout(() => { isPausedRef.current = false; }, 800);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Seamless infinite loop: keep the scroll position inside the middle segment.
  // Also re-measure as images load (scrollWidth changes) so first-visit doesn't glitch.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let initialized = false;
    const ensureCentered = () => {
      const segmentWidth = syncSegmentWidth();
      if (segmentWidth <= 0) return;
      if (!initialized || el.scrollLeft < 4) {
        el.scrollLeft = segmentWidth;
        initialized = true;
      }
    };

    const recenter = () => {
      const segmentWidth = segmentWidthRef.current || syncSegmentWidth();
      if (segmentWidth <= 0) return;
      if (el.scrollLeft < segmentWidth * 0.25) {
        el.scrollLeft = el.scrollLeft + segmentWidth;
      } else if (el.scrollLeft >= segmentWidth * 2.75) {
        el.scrollLeft = el.scrollLeft - segmentWidth;
      }
    };

    ensureCentered();
    const t1 = window.setTimeout(ensureCentered, 60);
    const t2 = window.setTimeout(ensureCentered, 300);
    const t3 = window.setTimeout(ensureCentered, 1000);

    // Re-measure as images load
    const imgs = el.querySelectorAll("img");
    const onImgLoad = () => ensureCentered();
    imgs.forEach((img) => {
      if (!(img as HTMLImageElement).complete) img.addEventListener("load", onImgLoad, { once: true });
    });

    const ro = new ResizeObserver(() => ensureCentered());
    ro.observe(el);

    el.addEventListener("scroll", recenter, { passive: true });
    window.addEventListener("resize", ensureCentered);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      ro.disconnect();
      el.removeEventListener("scroll", recenter);
      window.removeEventListener("resize", ensureCentered);
      imgs.forEach((img) => img.removeEventListener("load", onImgLoad));
    };
  }, [loopItems.length, syncSegmentWidth]);

  // Auto-advance: continuous circular movement with a seamless loop reset.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    // Delay autoscroll start so initial layout settles (prevents first-visit glitch).
    let cancelled = false;
    const startTimer = window.setTimeout(() => {
      if (cancelled) return;
      const tick = (timestamp: number) => {
        const el = scrollRef.current;
        if (el && !isPausedRef.current) {
          const previous = lastFrameRef.current ?? timestamp;
          const delta = timestamp - previous;
          const segmentWidth = segmentWidthRef.current || syncSegmentWidth();
          if (segmentWidth > 0) {
            el.scrollLeft += (18 * delta) / 1000;
            if (el.scrollLeft >= segmentWidth * 2.5) {
              el.scrollLeft -= segmentWidth;
            }
          }
        }
        lastFrameRef.current = timestamp;
        autoScrollRef.current = window.requestAnimationFrame(tick);
      };
      autoScrollRef.current = window.requestAnimationFrame(tick);
    }, 1200);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      if (autoScrollRef.current) window.cancelAnimationFrame(autoScrollRef.current);
      lastFrameRef.current = null;
    };
  }, [syncSegmentWidth]);

  const pause = () => { isPausedRef.current = true; };
  const resume = () => { isPausedRef.current = false; };

  return (
    <section className="section-padding" style={{ minHeight: 420 }}>
      <div className="container-app">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Crown className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-heading text-2xl md:text-3xl text-foreground">Premium Ads</h2>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/search?badge=gold" className="hidden text-base font-medium text-primary hover:underline sm:block">
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
        className="-mx-4 flex touch-auto items-stretch gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide overscroll-x-contain cursor-grab active:cursor-grabbing xl:gap-5"
          style={{ scrollSnapType: "x proximity" }}
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
                  className="h-[330px] min-w-[220px] max-w-[220px] flex-shrink-0 sm:h-[350px] sm:min-w-[240px] sm:max-w-[240px] xl:h-[390px] xl:min-w-[280px] xl:max-w-[280px] [&>*]:h-full"
                >
                  <AdCard ad={item.ad} variant={item.ad.badge === "silver" ? "silver" : "gold"} uniform />
                </div>
              );
            }

            const Icon = cta.icon;
            return (
              <div
                key={`cta-${idx}`}
                className="h-[330px] min-w-[220px] max-w-[220px] flex-shrink-0 sm:h-[350px] sm:min-w-[240px] sm:max-w-[240px] xl:h-[390px] xl:min-w-[280px] xl:max-w-[280px]"
              >
                <Link
                  to={cta.to}
                  className={`group flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br ${cta.bg} p-5 text-center transition-all hover:border-primary hover:shadow-lg xl:p-7`}
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:scale-110">
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="mb-2 text-lg font-bold text-foreground">{cta.title}</p>
                  <p className="mb-4 text-sm text-muted-foreground">{cta.body}</p>
                  <span className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
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
