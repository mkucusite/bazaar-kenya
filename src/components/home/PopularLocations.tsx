import { MapPin } from "lucide-react";
import { Link } from "react-router-dom";

const locations = [
  { name: "Nairobi", count: "15K+ ads", image: "https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=200&h=150&fit=crop" },
  { name: "Mombasa", count: "8K+ ads", image: "https://images.unsplash.com/photo-1596005554384-d293674c91d7?w=200&h=150&fit=crop" },
  { name: "Kisumu", count: "4K+ ads", image: "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=200&h=150&fit=crop" },
  { name: "Nakuru", count: "3K+ ads", image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=200&h=150&fit=crop" },
  { name: "Eldoret", count: "2K+ ads", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=150&fit=crop" },
  { name: "Thika", count: "1.5K+ ads", image: "https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=200&h=150&fit=crop" },
];

const PopularLocations = () => {
  return (
    <section className="section-padding">
      <div className="container-app">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-100">
              <MapPin className="w-4 h-4 text-violet-600" />
            </div>
            <h2 className="font-heading text-lg md:text-xl text-foreground">Popular Locations</h2>
          </div>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {locations.map((loc) => (
            <Link
              key={loc.name}
              to={`/search?county=${encodeURIComponent(loc.name)}`}
              className="group relative rounded-xl overflow-hidden aspect-[4/3]"
            >
              <img 
                src={loc.image} 
                alt={loc.name} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <h3 className="font-semibold text-sm text-white">{loc.name}</h3>
                <p className="text-[10px] text-white/70">{loc.count}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularLocations;
