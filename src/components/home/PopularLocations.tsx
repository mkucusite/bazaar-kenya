import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const locations = [
  { name: "Nairobi", ads: "12,400+" },
  { name: "Mombasa", ads: "3,200+" },
  { name: "Kisumu", ads: "1,800+" },
  { name: "Nakuru", ads: "2,100+" },
  { name: "Eldoret", ads: "1,500+" },
  { name: "Thika", ads: "950+" },
];

const PopularLocations = () => {
  return (
    <section className="section-padding bg-muted/30">
      <h2 className="font-heading font-bold text-lg md:text-xl text-foreground mb-4">Popular Locations</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {locations.map((loc) => (
          <Link
            key={loc.name}
            to={`/search?county=${encodeURIComponent(loc.name)}`}
            className="bg-card border border-border/50 rounded-xl px-3.5 py-3 hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">{loc.name}</span>
            </div>
            <span className="text-[11px] text-muted-foreground pl-5.5">{loc.ads} ads</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default PopularLocations;
