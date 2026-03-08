import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CATEGORIES } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, Loader2 } from "lucide-react";

interface SubcategoryPanelProps {
  category: string;
  onSubcategorySelect: (sub: string) => void;
  selectedSubcategory: string;
}

interface PreviewAd {
  id: string;
  title: string;
  county: string;
  town: string | null;
}

const SubcategoryPanel = ({ category, onSubcategorySelect, selectedSubcategory }: SubcategoryPanelProps) => {
  const [subcategoryCounts, setSubcategoryCounts] = useState<Record<string, number>>({});
  const [previewAds, setPreviewAds] = useState<Record<string, PreviewAd[]>>({});
  const [hoveredSub, setHoveredSub] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const catData = CATEGORIES.find((c) => c.name === category);

  useEffect(() => {
    if (!category || !catData) {
      setSubcategoryCounts({});
      setPreviewAds({});
      return;
    }

    const fetchCounts = async () => {
      setLoading(true);

      const { data: catRow } = await supabase
        .from("categories")
        .select("id")
        .eq("name", category)
        .single();

      if (!catRow) {
        setSubcategoryCounts({});
        setPreviewAds({});
        setLoading(false);
        return;
      }

      const { data: subs } = await supabase
        .from("subcategories")
        .select("id, name")
        .eq("category_id", catRow.id);

      const { data: ads } = await supabase
        .from("ads")
        .select("id, title, county, town, subcategory_id")
        .eq("category_id", catRow.id)
        .eq("status", "active")
        .limit(1000);

      const counts: Record<string, number> = {};
      const previews: Record<string, PreviewAd[]> = {};

      for (const sub of catData.subcategories) counts[sub] = 0;
      for (const sub of subs || []) if (counts[sub.name] === undefined) counts[sub.name] = 0;

      const subById = new Map((subs || []).map((s) => [s.id, s.name]));
      const uncategorizedAds: PreviewAd[] = [];

      for (const ad of ads || []) {
        if (ad.subcategory_id && subById.has(ad.subcategory_id)) {
          const subName = subById.get(ad.subcategory_id)!;
          counts[subName] = (counts[subName] || 0) + 1;
          if (!previews[subName]) previews[subName] = [];
          if (previews[subName].length < 6) {
            previews[subName].push({
              id: ad.id,
              title: ad.title,
              county: ad.county,
              town: ad.town,
            });
          }
        } else {
          uncategorizedAds.push({
            id: ad.id,
            title: ad.title,
            county: ad.county,
            town: ad.town,
          });
        }
      }

      if (uncategorizedAds.length > 0) {
        counts["__uncategorized__"] = uncategorizedAds.length;
        previews["__uncategorized__"] = uncategorizedAds.slice(0, 6);
      }

      counts["__all__"] = (ads || []).length;

      setSubcategoryCounts(counts);
      setPreviewAds(previews);
      setLoading(false);
    };

    fetchCounts();
  }, [category, catData]);

  const visibleSubcategories = useMemo(() => {
    if (!catData) return [];
    const fromCounts = Object.keys(subcategoryCounts).filter((k) => !k.startsWith("__"));
    return Array.from(new Set([...catData.subcategories, ...fromCounts]));
  }, [catData, subcategoryCounts]);

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

          {visibleSubcategories.map((sub) => (
            <div
              key={sub}
              className="relative"
              onMouseEnter={() => setHoveredSub(sub)}
              onMouseLeave={() => setHoveredSub(null)}
            >
              <button
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
                <span className="text-[11px] text-muted-foreground">{subcategoryCounts[sub] || 0}</span>
              </button>

              {hoveredSub === sub && (
                <div className="hidden lg:block absolute left-full top-0 ml-2 z-30 w-64 bg-card rounded-xl border border-border/60 shadow-lg p-2.5">
                  <p className="text-[11px] font-semibold text-foreground mb-2 truncate">{sub} ads</p>
                  {(previewAds[sub] || []).length === 0 ? (
                    <p className="text-[11px] text-muted-foreground">No active ads yet</p>
                  ) : (
                    <div className="space-y-1.5">
                      {previewAds[sub].map((ad) => (
                        <Link
                          key={ad.id}
                          to={`/ads/${ad.id}`}
                          className="block rounded-md border border-border/50 px-2 py-1.5 hover:bg-muted/50 transition-colors"
                        >
                          <p className="text-xs font-medium text-foreground truncate">{ad.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {ad.town ? `${ad.town}, ${ad.county}` : ad.county}
                          </p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {(subcategoryCounts["__uncategorized__"] || 0) > 0 && (
            <div
              className="relative"
              onMouseEnter={() => setHoveredSub("__uncategorized__")}
              onMouseLeave={() => setHoveredSub(null)}
            >
              <button
                onClick={() => onSubcategorySelect("__uncategorized__")}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm transition-colors ${
                  selectedSubcategory === "__uncategorized__"
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground hover:bg-muted/60"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  Other {category}
                </span>
                <span className="text-[11px] text-muted-foreground">{subcategoryCounts["__uncategorized__"]}</span>
              </button>

              {hoveredSub === "__uncategorized__" && (
                <div className="hidden lg:block absolute left-full top-0 ml-2 z-30 w-64 bg-card rounded-xl border border-border/60 shadow-lg p-2.5">
                  <p className="text-[11px] font-semibold text-foreground mb-2">Other {category} ads</p>
                  <div className="space-y-1.5">
                    {(previewAds["__uncategorized__"] || []).map((ad) => (
                      <Link
                        key={ad.id}
                        to={`/ads/${ad.id}`}
                        className="block rounded-md border border-border/50 px-2 py-1.5 hover:bg-muted/50 transition-colors"
                      >
                        <p className="text-xs font-medium text-foreground truncate">{ad.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {ad.town ? `${ad.town}, ${ad.county}` : ad.county}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubcategoryPanel;

