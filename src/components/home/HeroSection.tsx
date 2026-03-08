import { Search, Camera, ChevronDown, Sparkles, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KENYA_COUNTIES, CATEGORIES } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { getAdPath } from "@/lib/ad-links";
import type { Tables } from "@/integrations/supabase/types";

type HeroSuggestion = Pick<Tables<"ads">, "id" | "title" | "county" | "town" | "price" | "images">;

const HeroSection = () => {
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState("");
  const [county, setCounty] = useState("");
  const [suggestions, setSuggestions] = useState<HeroSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const term = searchText.trim();
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      const escaped = term.replace(/,/g, " ");
      const { data } = await supabase
        .from("ads")
        .select("id,title,county,town,price,images")
        .eq("status", "active")
        .or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`)
        .order("created_at", { ascending: false })
        .limit(6);

      setSuggestions((data as HeroSuggestion[]) || []);
      setShowSuggestions(true);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [searchText]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (county) params.set("county", county);
    if (searchText) params.set("q", searchText);
    navigate(`/search?${params.toString()}`);
    setShowSuggestions(false);
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleCameraSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
    navigate(`/search?q=${encodeURIComponent(baseName)}&image=${encodeURIComponent(file.name)}`);

    event.target.value = "";
  };

  const handlePickSuggestion = (item: HeroSuggestion) => {
    navigate(getAdPath({ id: item.id, title: item.title }));
    setSearchText("");
    setShowSuggestions(false);
  };

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary via-primary/95 to-secondary">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-primary-foreground/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-accent/40 blur-3xl" />
      </div>

      <div className="relative container-app py-10 md:py-14 lg:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-3 py-1 text-xs text-primary-foreground mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Live marketplace across all 47 counties
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl text-primary-foreground mb-3 leading-tight">
            Buy & Sell on Kenya's
            <span className="block text-accent-foreground">Safest Classifieds</span>
          </h1>
          <p className="text-primary-foreground/80 text-sm md:text-base mb-6 max-w-xl mx-auto">
            Live search, instant listing cards, and verified sellers — all in one trusted marketplace.
          </p>

          <form onSubmit={handleSearch} className="bg-card rounded-2xl p-3 md:p-4 shadow-2xl border border-border/40">
            <div className="relative mb-3">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Search phones, cars, rentals, services..."
                className="input-search pr-24"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                  onClick={handleCameraClick}
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button type="submit" className="p-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-40 top-12 left-0 right-0 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden">
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handlePickSuggestion(item)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors text-left border-b border-border/40 last:border-b-0"
                    >
                      <img src={item.images?.[0] || "/placeholder.svg"} alt={item.title} className="w-12 h-10 rounded-md object-cover flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {item.town ? `${item.town}, ${item.county}` : item.county}
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-primary">KSh {Number(item.price || 0).toLocaleString()}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 pr-8 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative flex-1">
                <select
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="w-full h-10 px-3 pr-8 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                >
                  <option value="">All Counties</option>
                  {KENYA_COUNTIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </form>

          <div className="flex items-center justify-center gap-4 md:gap-8 mt-6 text-primary-foreground/80 text-xs md:text-sm font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-accent rounded-full" />
              <span>50K+ Users</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
              <span>Verified Sellers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-accent-foreground rounded-full" />
              <span>10K+ Daily Ads</span>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraSelected}
      />
    </section>
  );
};

export default HeroSection;
