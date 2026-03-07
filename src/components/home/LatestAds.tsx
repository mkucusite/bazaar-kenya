import { useState } from "react";
import { LATEST_ADS } from "@/data/mockData";
import AdCard from "@/components/AdCard";
import { Button } from "@/components/ui/button";

const LatestAds = () => {
  const [showAll, setShowAll] = useState(false);
  const ads = showAll ? LATEST_ADS : LATEST_ADS.slice(0, 8);

  return (
    <section className="section-padding">
      <h2 className="font-heading font-bold text-xl md:text-2xl text-foreground mb-6">Latest Ads</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {ads.map((ad) => (
          <AdCard key={ad.id} ad={ad} />
        ))}
      </div>
      {!showAll && LATEST_ADS.length > 8 && (
        <div className="text-center mt-8">
          <Button variant="outline" onClick={() => setShowAll(true)} className="px-8">
            Load More
          </Button>
        </div>
      )}
    </section>
  );
};

export default LatestAds;
