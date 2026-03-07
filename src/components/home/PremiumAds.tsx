import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PREMIUM_ADS } from "@/data/mockData";
import AdCard from "@/components/AdCard";

const PremiumAds = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const amount = dir === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <section className="section-padding">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading font-bold text-xl md:text-2xl text-foreground">Premium Ads</h2>
        <div className="flex gap-2">
          <button onClick={() => scroll("left")} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => scroll("right")} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x" style={{ scrollbarWidth: "none" }}>
        {PREMIUM_ADS.map((ad) => (
          <div key={ad.id} className="min-w-[260px] max-w-[280px] snap-start flex-shrink-0">
            <AdCard ad={ad} variant="gold" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default PremiumAds;
