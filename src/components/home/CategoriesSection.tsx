import { useState } from "react";
import { ChevronRight, ChevronDown, Monitor, Home, Car, Wrench, Building2, Briefcase, Trophy, Package, Tractor, Settings, Hammer, Shirt, Tag, Store, FileText } from "lucide-react";
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
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section className="section-padding">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading font-bold text-lg md:text-xl text-foreground">Categories</h2>
        <Link to="/search" className="text-xs text-primary font-medium hover:underline">View All</Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {CATEGORIES.map((cat) => (
          <div key={cat.name} className="bg-card rounded-xl border border-border/50 overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === cat.name ? null : cat.name)}
              className="w-full flex items-center gap-3 px-3.5 py-3 hover:bg-muted/40 transition-colors"
            >
              <div className={`w-9 h-9 rounded-lg ${cat.color} flex items-center justify-center flex-shrink-0`}>
                {iconMap[cat.icon] || <FileText className="w-5 h-5" />}
              </div>
              <span className="font-medium text-sm text-foreground flex-1 text-left">{cat.name}</span>
              {expanded === cat.name ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {expanded === cat.name && (
              <div className="px-3.5 pb-3 border-t border-border/50">
                <ul className="py-1.5 space-y-0.5">
                  {cat.subcategories.map((sub) => (
                    <li key={sub}>
                      <Link
                        to={`/search?category=${encodeURIComponent(cat.name)}&sub=${encodeURIComponent(sub)}`}
                        className="block text-sm text-muted-foreground hover:text-primary px-3 py-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        {sub}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoriesSection;
