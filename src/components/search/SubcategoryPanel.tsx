import { useEffect, useState } from "react";
import { CATEGORIES } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Loader2 } from "lucide-react";

interface SubcategoryPanelProps {
  category: string;
  onSubcategorySelect: (sub: string) => void;
  selectedSubcategory: string;
}

const SubcategoryPanel = ({ category, onSubcategorySelect, selectedSubcategory }: SubcategoryPanelProps) => {
  const [subcategoryCounts, setSubcategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const catData = CATEGORIES.find(c => c.name === category);

  useEffect(() => {
    if (!category || !catData) {
      setSubcategoryCounts({});
      return;
    }

    const fetchCounts = async () => {
      setLoading(true);
      // Get category id
      const { data: catRow } = await supabase
        .from("categories")
        .select("id")
        .eq("name", category)
        .single();

      if (!catRow) { setLoading(false); return; }

      // Get subcategories with their IDs
      const { data: subs } = await supabase
        .from("subcategories")
        .select("id, name")
        .eq("category_id", catRow.id);

      if (!subs || subs.length === 0) { setLoading(false); return; }

      // Count ads per subcategory
      const counts: Record<string, number> = {};
      const { data: ads } = await supabase
        .from("ads")
        .select("subcategory_id")
        .eq("category_id", catRow.id)
        .eq("status", "active");

      if (ads) {
        for (const ad of ads) {
          if (ad.subcategory_id) {
            const sub = subs.find(s => s.id === ad.subcategory_id);
            if (sub) counts[sub.name] = (counts[sub.name] || 0) + 1;
          }
        }
      }

      // Also count total for "All" 
      const totalAds = ads?.length || 0;
      counts["__all__"] = totalAds;

      setSubcategoryCounts(counts);
      setLoading(false);
    };

    fetchCounts();
  }, [category]);

  if (!category || !catData) return null;

  return (
    <div className="bg-card rounded-xl border border-border/60 p-3 mb-3">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        {category} Subcategories
      </p>
      {loading ? (
        <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading...
        </div>
      ) : (
        <div className="space-y-0.5">
          <button
            onClick={() => onSubcategorySelect("")}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-colors ${
              !selectedSubcategory
                ? "bg-primary/10 text-primary font-medium"
                : "text-foreground hover:bg-muted/60"
            }`}
          >
            <span>All {category}</span>
            <span className="text-[11px] text-muted-foreground">
              {subcategoryCounts["__all__"] || 0} ads
            </span>
          </button>
          {catData.subcategories.map((sub) => (
            <button
              key={sub}
              onClick={() => onSubcategorySelect(sub)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-colors ${
                selectedSubcategory === sub
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-muted/60"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                {sub}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {subcategoryCounts[sub] || 0}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubcategoryPanel;
