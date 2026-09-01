import { ChevronRight, Monitor, Home, Car, Wrench, Building2, Briefcase, Trophy, Package, Tractor, Settings, Hammer, Shirt, Tag, Store, FileText, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "@/data/mockData";
import { useState, useRef } from "react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Monitor, Home, Car, Wrench, Building2, Briefcase, Trophy, Package,
  Tractor, Settings, Hammer, Shirt, Tag, Store, FileText,
};

const CategoriesSection = () => {
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">Explore the marketplace</p>
            <h2 className="font-heading text-2xl md:text-3xl text-foreground">Browse Categories</h2>
          </div>
          <Link to="/search" className="text-base text-primary font-medium hover:underline flex items-center gap-1.5">
            All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:gap-3">
          {CATEGORIES.map((cat) => {
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
                  className="group flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-xl border border-border/50 bg-card p-2 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md sm:min-h-[110px]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground sm:h-12 sm:w-12">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="w-full text-[11px] sm:text-xs font-semibold leading-tight text-foreground line-clamp-2 break-words">
                    {cat.name}
                  </h3>
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
