import { useState } from "react";
import { LATEST_ADS } from "@/data/mockData";
import AdCard from "@/components/AdCard";
import { Button } from "@/components/ui/button";
import { ArrowDown } from "lucide-react";

const LatestAds = () => {
  const [showAll, setShowAll] = useState(false);
  const ads = showAll ? LATEST_ADS : LATEST_ADS.slice(0, 8);

  return (
    <section className="px-4 md:px-8 lg:px-16 xl:px-24 py-10">
      <h2 className="font-heading font-bold text-lg md:text-xl text-foreground mb-6">Latest Ads</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {ads.map((ad) => (
          <AdCard key={ad.id} ad={ad} />
        ))}
      </div>
      {!showAll && LATEST_ADS.length > 8 && (
        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => setShowAll(true)} className="px-8 rounded-lg">
            <ArrowDown className="w-4 h-4 mr-2" /> Load More
          </Button>
        </div>
      )}
    </section>
  );
};

export default LatestAds;
