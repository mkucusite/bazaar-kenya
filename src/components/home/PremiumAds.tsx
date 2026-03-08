import { useRef } from "react";
import { ChevronLeft, ChevronRight, Crown } from "lucide-react";
import { PREMIUM_ADS } from "@/data/mockData";
import AdCard from "@/components/AdCard";

const PremiumAds = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const amount = dir === "left" ? -320 : 320;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <section className="px-4 md:px-8 lg:px-16 xl:px-24 py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
            <Crown className="w-4 h-4 text-accent-foreground" />
          </div>
          <h2 className="font-heading font-bold text-lg md:text-xl text-foreground">Premium Ads</h2>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => scroll("left")} className="w-8 h-8 rounded-lg border border-border/60 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll("right")} className="w-8 h-8 rounded-lg border border-border/60 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 snap-x" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {PREMIUM_ADS.map((ad) => (
          <div key={ad.id} className="min-w-[240px] max-w-[260px] snap-start flex-shrink-0">
            <AdCard ad={ad} variant="gold" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default PremiumAds;
