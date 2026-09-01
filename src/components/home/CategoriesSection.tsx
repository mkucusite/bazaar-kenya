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
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-primary">Explore the marketplace</p>
            <h2 className="font-heading text-lg md:text-xl text-foreground">Browse Categories</h2>
          </div>
          <Link to="/search" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
            All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
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
                  className="group flex min-h-[112px] flex-col items-center justify-start gap-2 rounded-xl border border-border/50 bg-card p-3 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="w-full min-w-0">
                    <h3 className="text-[12px] sm:text-sm font-medium leading-tight text-foreground line-clamp-2 break-words">
                      {cat.name}
                    </h3>
                    <p className="mt-1 truncate text-[10px] text-muted-foreground">
                      {cat.subcategories.slice(0, 2).join(" • ")}
                    </p>
                  </div>
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
