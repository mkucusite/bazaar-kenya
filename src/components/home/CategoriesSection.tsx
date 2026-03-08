import { ChevronRight, Monitor, Home, Car, Wrench, Building2, Briefcase, Trophy, Package, Tractor, Settings, Hammer, Shirt, Tag, Store, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "@/data/mockData";

const iconMap: Record<string, React.ReactNode> = {
  Monitor: <Monitor className="w-5 h-5" />,
  Home: <Home className="w-5 h-5" />,
  Car: <Car className="w-5 h-5" />,
  Wrench: <Wrench className="w-5 h-5" />,
  Building2: <Building2 className="w-5 h-5" />,
  Briefcase: <Briefcase className="w-5 h-5" />,
  Trophy: <Trophy className="w-5 h-5" />,
  Package: <Package className="w-5 h-5" />,
  Tractor: <Tractor className="w-5 h-5" />,
  Settings: <Settings className="w-5 h-5" />,
  Hammer: <Hammer className="w-5 h-5" />,
  Shirt: <Shirt className="w-5 h-5" />,
  Tag: <Tag className="w-5 h-5" />,
  Store: <Store className="w-5 h-5" />,
  FileText: <FileText className="w-5 h-5" />,
};

const CategoriesSection = () => {
  return (
    <section className="section-padding bg-secondary/30">
      <div className="container-app">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-lg md:text-xl text-foreground">Categories</h2>
          <Link to="/search" className="text-sm text-primary font-medium hover:underline">View All</Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {CATEGORIES.slice(0, 12).map((cat) => (
            <Link
              key={cat.name}
              to={`/search?category=${encodeURIComponent(cat.name)}`}
              className="group bg-card rounded-xl p-3 md:p-4 border border-border/50 hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${cat.color} flex items-center justify-center mb-2 md:mb-3 transition-transform group-hover:scale-105`}>
                {iconMap[cat.icon] || <FileText className="w-5 h-5" />}
              </div>
              <h3 className="font-medium text-xs md:text-sm text-foreground leading-tight line-clamp-2">
                {cat.name}
              </h3>
              <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                {cat.subcategories.length} subcategories
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
