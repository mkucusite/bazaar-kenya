import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { CATEGORIES } from "@/data/mockData";

const CategoriesSection = () => {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <section className="bg-surface-grey section-padding">
      <h2 className="font-heading font-bold text-xl md:text-2xl text-foreground mb-6">Browse by Category</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
        {CATEGORIES.map((cat) => (
          <div key={cat.name} className="bg-card rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === cat.name ? null : cat.name)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
            >
              <span className={`w-9 h-9 rounded-full ${cat.color} flex items-center justify-center text-lg flex-shrink-0`}>
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
                <ul className="py-2 space-y-1">
                  {cat.subcategories.map((sub) => (
                    <li key={sub}>
                      <button className="w-full text-left text-sm text-muted-foreground hover:text-primary px-3 py-1.5 rounded hover:bg-muted transition-colors">
                        {sub}
                      </button>
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
