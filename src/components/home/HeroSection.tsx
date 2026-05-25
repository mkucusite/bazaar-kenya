import { Search, ChevronDown, MapPin, TrendingUp, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { KENYA_COUNTIES, CATEGORIES } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { getAdPath } from "@/lib/ad-links";
import type { Tables } from "@/integrations/supabase/types";
import { useAdmin } from "@/hooks/use-admin";

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
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      setTotalAds(0);
      return;
    }

    supabase.from("ads").select("id", { count: "exact", head: true }).eq("status", "active").then(({ count }) => {
      setTotalAds(count || 0);
    });
  }, [isAdmin]);

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
        <div className="absolute bottom-0 left-0 w-full h-24 bg-background hero-clip" />
      </div>

      <div className="relative container-app pt-12 pb-24 md:pt-16 md:pb-28 xl:pt-20 xl:pb-32">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-2 text-sm text-white/90 backdrop-blur-sm">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            {isAdmin && totalAds > 0 ? `${totalAds.toLocaleString()} live ads` : "Live marketplace"} across 47 counties
          </div>

          <h1 className="mb-5 font-heading text-4xl text-white leading-[1.02] sm:text-5xl md:text-6xl xl:text-7xl">
            Find What You Need
            <span className="block text-accent mt-1">Sell What You Don't</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-base text-white/75 md:text-lg xl:text-xl">
            Kenya's own classifieds marketplace. Cars, phones, property, jobs — everything in one place.
          </p>

          {/* Search box - distinctive rounded design */}
          <form onSubmit={handleSearch} className="mx-auto max-w-4xl rounded-[28px] border border-white/10 bg-card p-3 shadow-2xl md:p-4">
            <div className="relative mb-3">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="What are you looking for?"
                className="h-14 w-full rounded-2xl border border-input bg-background pl-5 pr-32 text-base text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button type="submit" className="absolute right-2 top-1/2 flex h-10 -translate-y-1/2 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                <Search className="w-4 h-4" /> Search
              </button>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-16 z-40 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg">
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

            <div className="grid gap-3 md:grid-cols-2">
              <div className="relative flex-1">
                <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category" className="h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 pr-10 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                  <option value="">All Categories</option>
                  {CATEGORIES.map((c) => (<option key={c.name} value={c.name}>{c.name}</option>))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              <div className="relative flex-1">
                <select value={county} onChange={(e) => setCounty(e.target.value)} aria-label="County" className="h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 pr-10 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                  <option value="">All Counties</option>
                  {KENYA_COUNTIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
