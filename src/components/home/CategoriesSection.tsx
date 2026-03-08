import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Monitor,
  Home,
  Car,
  Wrench,
  Building2,
  Briefcase,
  Trophy,
  Package,
  Tractor,
  Settings,
  Hammer,
  Shirt,
  Tag,
  Store,
  FileText,
} from "lucide-react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "@/data/mockData";

const iconMap: Record<string, JSX.Element> = {
  Monitor: <Monitor className="h-5 w-5" />,
  Home: <Home className="h-5 w-5" />,
  Car: <Car className="h-5 w-5" />,
  Wrench: <Wrench className="h-5 w-5" />,
  Building2: <Building2 className="h-5 w-5" />,
  Briefcase: <Briefcase className="h-5 w-5" />,
  Trophy: <Trophy className="h-5 w-5" />,
  Package: <Package className="h-5 w-5" />,
  Tractor: <Tractor className="h-5 w-5" />,
  Settings: <Settings className="h-5 w-5" />,
  Hammer: <Hammer className="h-5 w-5" />,
  Shirt: <Shirt className="h-5 w-5" />,
  Tag: <Tag className="h-5 w-5" />,
  Store: <Store className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
};

const CategoriesSection = () => {
  const [expanded, setExpanded] = useState<string | null>(CATEGORIES[0]?.name ?? null);

  return (
    <section className="section-padding !pt-6">
      <div className="page-container">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-foreground md:text-xl">Browse by category</h2>
          <Link to="/search" className="text-xs font-semibold text-primary hover:underline">
            View all
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const isOpen = expanded === cat.name;
            return (
              <article key={cat.name} className="overflow-hidden rounded-2xl border border-border bg-card">
                <button
                  onClick={() => setExpanded(isOpen ? null : cat.name)}
                  className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/40"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {iconMap[cat.icon] || <FileText className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{cat.name}</p>
                    <p className="text-[11px] text-muted-foreground">{cat.subcategories.length} subcategories</p>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-border px-3 pb-3 pt-2">
                    <ul className="space-y-1">
                      {cat.subcategories.map((sub) => (
                        <li key={sub}>
                          <Link
                            to={`/search?category=${encodeURIComponent(cat.name)}&sub=${encodeURIComponent(sub)}`}
                            className="block rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                          >
                            {sub}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
