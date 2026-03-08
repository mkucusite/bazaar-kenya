import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const locations = [
  { name: "Nairobi", ads: "12,400+" },
  { name: "Mombasa", ads: "3,200+" },
  { name: "Kisumu", ads: "1,800+" },
  { name: "Nakuru", ads: "2,100+" },
  { name: "Eldoret", ads: "1,500+" },
  { name: "Thika", ads: "950+" },
  { name: "Kiambu", ads: "2,700+" },
  { name: "Machakos", ads: "1,100+" },
];

const PopularLocations = () => {
  return (
    <section className="section-padding bg-muted/20">
      <div className="page-container">
        <h2 className="mb-4 font-heading text-lg font-bold text-foreground md:text-xl">Popular counties</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {locations.map((loc) => (
            <Link
              key={loc.name}
              to={`/search?county=${encodeURIComponent(loc.name)}`}
              className="rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:border-primary/30"
            >
              <div className="mb-0.5 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-semibold text-foreground">{loc.name}</span>
              </div>
              <span className="pl-5.5 text-[11px] text-muted-foreground">{loc.ads} active ads</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularLocations;
