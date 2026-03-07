import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "@/data/mockData";

const CategoriesSection = () => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section className="bg-surface-grey section-padding">
      <h2 className="font-heading font-bold text-xl md:text-2xl text-foreground mb-6">Browse by Category</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
        {CATEGORIES.map((cat) => (
          <div key={cat.name} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-sm transition-shadow">
            <button
              onClick={() => setExpanded(expanded === cat.name ? null : cat.name)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors"
            >
              <span className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center text-lg flex-shrink-0 shadow-sm`}>
                {cat.icon}
              </span>
              <span className="font-medium text-sm text-foreground flex-1 text-left">{cat.name}</span>
              {expanded === cat.name ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            {expanded === cat.name && (
              <div className="px-4 pb-3 border-t border-border">
                <ul className="py-2 space-y-0.5">
                  {cat.subcategories.map((sub) => (
                    <li key={sub}>
                      <Link
                        to={`/search?category=${encodeURIComponent(cat.name)}`}
                        className="w-full block text-left text-sm text-muted-foreground hover:text-primary px-3 py-2 rounded-lg hover:bg-muted transition-colors"
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
