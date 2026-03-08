import { Search, ChevronDown, MapPin, TrendingUp, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { KENYA_COUNTIES, CATEGORIES } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { getAdPath } from "@/lib/ad-links";
import type { Tables } from "@/integrations/supabase/types";

type HeroSuggestion = Pick<Tables<"ads">, "id" | "title" | "county" | "town" | "price" | "images"> & { slug?: string };

const trendingSearches = [
  "iPhone 16", "Toyota Vitz", "Bedsitter Nairobi", "Samsung TV", "Motorcycle", "Land for Sale",
];

const HeroSection = () => {
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState("");
  const [county, setCounty] = useState("");
  const [suggestions, setSuggestions] = useState<HeroSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [totalAds, setTotalAds] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from("ads").select("id", { count: "exact", head: true }).eq("status", "active").then(({ count }) => {
      setTotalAds(count || 0);
    });
  }, []);

  useEffect(() => {
    const term = searchText.trim();
    if (term.length < 2) { setSuggestions([]); return; }
    const timer = window.setTimeout(async () => {
      const escaped = term.replace(/,/g, " ");
      const { data } = await supabase
        .from("ads").select("id,title,county,town,price,images,slug")
        .eq("status", "active")
        .or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`)
        .order("created_at", { ascending: false }).limit(6);
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

  const handlePickSuggestion = (item: HeroSuggestion) => {
    navigate(getAdPath({ id: item.id, title: item.title, slug: (item as any).slug }));
    setSearchText("");
    setShowSuggestions(false);
  };

  return (
    <section className="relative overflow-hidden">
      {/* Unique diagonal background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-emerald-700 to-teal-800" />
      <div className="absolute inset-0">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-full h-24 bg-background" style={{ clipPath: "polygon(0 60%, 100% 0%, 100% 100%, 0% 100%)" }} />
      </div>

      <div className="relative container-app pt-10 pb-20 md:pt-14 md:pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 text-xs text-white/90 mb-5 border border-white/10">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            {totalAds > 0 ? `${totalAds.toLocaleString()} live ads` : "Live marketplace"} across 47 counties
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-4 leading-[1.1]">
            Find What You Need
            <span className="block text-accent mt-1">Sell What You Don't</span>
          </h1>
          <p className="text-white/70 text-sm md:text-base mb-8 max-w-lg mx-auto">
            Kenya's own classifieds marketplace. Cars, phones, property, jobs — everything in one place.
          </p>

          {/* Search box - distinctive rounded design */}
          <form onSubmit={handleSearch} className="bg-card rounded-2xl p-2 md:p-3 shadow-2xl border border-white/10 max-w-2xl mx-auto">
            <div className="relative mb-2">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="What are you looking for?"
                className="w-full h-12 pl-4 pr-14 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 px-5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5 text-sm font-medium">
                <Search className="w-4 h-4" /> Search
              </button>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-40 top-14 left-0 right-0 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden">
                  {suggestions.map((item) => (
                    <button key={item.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => handlePickSuggestion(item)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors text-left border-b border-border/40 last:border-b-0">
                      <img src={item.images?.[0] || "/placeholder.svg"} alt={item.title} className="w-12 h-10 rounded-md object-cover flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {item.town ? `${item.town}, ${item.county}` : item.county}</p>
                      </div>
                      <p className="text-xs font-semibold text-primary">KSh {Number(item.price || 0).toLocaleString()}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-10 px-3 pr-8 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                  <option value="">All Categories</option>
                  {CATEGORIES.map((c) => (<option key={c.name} value={c.name}>{c.name}</option>))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative flex-1">
                <select value={county} onChange={(e) => setCounty(e.target.value)} className="w-full h-10 px-3 pr-8 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
                  <option value="">All Counties</option>
                  {KENYA_COUNTIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </form>

          {/* Trending searches - unique to KenyaAdvert */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="flex items-center gap-1 text-white/50 text-xs"><TrendingUp className="w-3 h-3" /> Trending:</span>
            {trendingSearches.map((t) => (
              <Link key={t} to={`/search?q=${encodeURIComponent(t)}`} className="px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs hover:bg-white/20 transition-colors border border-white/10">
                {t}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
