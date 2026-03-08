import { ChevronRight, Monitor, Home, Car, Wrench, Building2, Briefcase, Trophy, Package, Tractor, Settings, Hammer, Shirt, Tag, Store, FileText, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "@/data/mockData";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCounts = async () => {
      const { data: cats } = await supabase.from("categories").select("id, name");
      if (!cats) return;

      // Get counts per category
      const counts: Record<string, number> = {};
      const { data: ads } = await supabase.from("ads").select("category_id").eq("status", "active");
      if (ads) {
        for (const ad of ads) {
          if (ad.category_id) {
            const cat = cats.find(c => c.id === ad.category_id);
            if (cat) counts[cat.name] = (counts[cat.name] || 0) + 1;
          }
        }
      }
      setCategoryCounts(counts);
    };
    fetchCounts();
  }, []);

  return (
    <section className="section-padding bg-secondary/30">
      <div className="container-app">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-lg md:text-xl text-foreground">Browse Categories</h2>
          <Link to="/search" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
            All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        
        {/* Unique 2-column list layout on mobile, grid on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {CATEGORIES.slice(0, 12).map((cat) => (
            <Link
              key={cat.name}
              to={`/search?category=${encodeURIComponent(cat.name)}`}
              className="group flex items-center gap-3 bg-card rounded-xl p-3 border border-border/50 hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                {iconMap[cat.icon] || <FileText className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-foreground leading-tight truncate">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {categoryCounts[cat.name] ? `${categoryCounts[cat.name].toLocaleString()} ads` : `${cat.subcategories.length} subcategories`}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
