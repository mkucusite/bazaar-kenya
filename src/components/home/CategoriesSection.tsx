import { ChevronRight, Monitor, Home, Car, Wrench, Building2, Briefcase, Trophy, Package, Tractor, Settings, Hammer, Shirt, Tag, Store, FileText, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "@/data/mockData";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Monitor, Home, Car, Wrench, Building2, Briefcase, Trophy, Package,
  Tractor, Settings, Hammer, Shirt, Tag, Store, FileText,
};

const CategoriesSection = () => {
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      const { data: cats } = await supabase.from("categories").select("id, name");
      if (!cats) return;
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

  const handleMouseEnter = (catName: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHoveredCat(catName);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setHoveredCat(null), 150);
  };

  return (
    <section className="section-padding bg-secondary/30">
      <div className="container-app">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-lg md:text-xl text-foreground">Browse Categories</h2>
          <Link to="/search" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
            All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {CATEGORIES.slice(0, 12).map((cat) => {
            const Icon = iconMap[cat.icon] || FileText;
            return (
              <div
                key={cat.name}
                className="relative"
                onMouseEnter={() => handleMouseEnter(cat.name)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  to={`/search?category=${encodeURIComponent(cat.name)}`}
                  className="group flex items-center gap-3 bg-card rounded-xl p-3 border border-border/50 hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <div className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                    <Icon className="w-5 h-5" />
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

                {hoveredCat === cat.name && cat.subcategories.length > 0 && (
                  <div
                    className="hidden lg:block absolute left-full top-0 ml-2 z-50 w-56 bg-card border border-border/60 rounded-xl shadow-xl py-2 animate-in fade-in-0 slide-in-from-left-2 duration-150"
                    onMouseEnter={() => handleMouseEnter(cat.name)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{cat.name}</p>
                    {cat.subcategories.map((sub) => (
                      <Link
                        key={sub}
                        to={`/search?category=${encodeURIComponent(cat.name)}&q=${encodeURIComponent(sub)}`}
                        className="flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                      >
                        <span>{sub}</span>
                        <ChevronRight className="w-3 h-3 text-muted-foreground" />
                      </Link>
                    ))}
                    <div className="border-t border-border/40 mt-1 pt-1">
                      <Link
                        to={`/search?category=${encodeURIComponent(cat.name)}`}
                        className="flex items-center px-3 py-2 text-xs text-primary font-medium hover:bg-primary/5 transition-colors"
                      >
                        View all in {cat.name} →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
