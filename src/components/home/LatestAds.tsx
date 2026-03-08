import { useState } from "react";
import { LATEST_ADS } from "@/data/mockData";
import AdCard from "@/components/AdCard";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const LatestAds = () => {
  const [showAll, setShowAll] = useState(false);
  const ads = showAll ? LATEST_ADS : LATEST_ADS.slice(0, 6);

  return (
    <section className="section-padding bg-muted/30">
      <div className="page-container">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-foreground md:text-xl">Fresh listings</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">New posts from across Kenya</p>
          </div>
          <Link to="/search" className="text-xs font-semibold text-primary hover:underline">
            Explore all
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ads.map((ad) => (
            <AdCard key={ad.id} ad={ad} />
          ))}
        </div>

        {!showAll && LATEST_ADS.length > 6 && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(true)}
              className="rounded-full px-6 text-xs"
            >
              <ChevronDown className="mr-1.5 h-3.5 w-3.5" /> Show more listings
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default LatestAds;
