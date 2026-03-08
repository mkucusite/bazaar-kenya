import { useState } from "react";
import { LATEST_ADS } from "@/data/mockData";
import AdCard from "@/components/AdCard";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const LatestAds = () => {
  const [showAll, setShowAll] = useState(false);
  const ads = showAll ? LATEST_ADS : LATEST_ADS.slice(0, 8);

  return (
    <section className="section-padding bg-muted/30">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-lg md:text-xl text-foreground">Latest Ads</h2>
        <Link to="/search" className="text-xs text-primary font-medium hover:underline">View All</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-3">
        {ads.map((ad) => (
          <AdCard key={ad.id} ad={ad} />
        ))}
      </div>
      {!showAll && LATEST_ADS.length > 8 && (
        <div className="text-center mt-6">
          <Button variant="outline" size="sm" onClick={() => setShowAll(true)} className="rounded-full px-6 text-xs">
            <ChevronDown className="w-3.5 h-3.5 mr-1.5" /> Load More
          </Button>
        </div>
      )}
    </section>
  );
};

export default LatestAds;
