import { useRef } from "react";
import { ChevronLeft, ChevronRight, Crown } from "lucide-react";
import { PREMIUM_ADS } from "@/data/mockData";
import AdCard from "@/components/AdCard";
import { Link } from "react-router-dom";

const PremiumAds = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const amount = dir === "left" ? -280 : 280;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <section className="section-padding">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="w-4.5 h-4.5 text-accent-foreground" />
          <h2 className="font-heading font-bold text-lg md:text-xl text-foreground">Premium Ads</h2>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/search?badge=gold" className="text-xs text-primary font-medium hover:underline mr-2 hidden md:block">View All</Link>
          <button onClick={() => scroll("left")} className="w-7 h-7 rounded-full border border-border/60 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => scroll("right")} className="w-7 h-7 rounded-full border border-border/60 flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {PREMIUM_ADS.map((ad) => (
          <div key={ad.id} className="min-w-[200px] max-w-[220px] md:min-w-[230px] md:max-w-[250px] snap-start flex-shrink-0">
            <AdCard ad={ad} variant="gold" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default PremiumAds;
