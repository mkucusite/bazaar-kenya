import { Search, ChevronDown, MapPin, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { KENYA_COUNTIES, CATEGORIES } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { getAdPath } from "@/lib/ad-links";
import type { Tables } from "@/integrations/supabase/types";
import { useLocationPref } from "@/contexts/LocationContext";

type HeroSuggestion = Pick<Tables<"ads">, "id" | "title" | "county" | "town" | "price" | "images"> & { slug?: string };

/** "I want to…" shortcuts — the site is far more than classifieds. */
const INTENTS = [
  { label: "Buy something", to: "/search" },
  { label: "Book a massage or spa", to: "/wellness" },
  { label: "Find a hotel", to: "/hotels" },
  { label: "Hire a fundi", to: "/artisans" },
  { label: "Hire a car", to: "/vehicles" },
  { label: "Get a job", to: "/jobs" },
  { label: "See a doctor", to: "/doctors" },
  { label: "Follow 2027 politics", to: "/politicians" },
];

const HeroSection = () => {
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState("");
  const [county, setCounty] = useState("");
  const [countyTouched, setCountyTouched] = useState(false);
  const [suggestions, setSuggestions] = useState<HeroSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { county: detectedCounty } = useLocationPref();
  const navigate = useNavigate();

  // Pre-select the visitor's own county so the first search is already local.
  useEffect(() => {
    if (!countyTouched && detectedCounty) setCounty(detectedCounty);
  }, [detectedCounty, countyTouched]);

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
        .select("id,title,county,town,price,images,slug")
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
    if (searchText.trim()) params.set("q", searchText.trim());
    navigate(`/search?${params.toString()}`);
    setShowSuggestions(false);
  };

  const handlePickSuggestion = (item: HeroSuggestion) => {
    navigate(getAdPath({ id: item.id, title: item.title, slug: (item as any).slug }));
    setSearchText("");
    setShowSuggestions(false);
  };

  return (
    <section className="relative overflow-hidden border-b border-border bg-secondary/30">
      <div className="container-app relative pb-12 pt-12 text-center md:pb-16 md:pt-16">
        <div className="mx-auto max-w-3xl">
          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">47 counties · one connected marketplace</span>
          <h1 className="mt-4 font-heading text-[2.35rem] font-black leading-[1.04] text-foreground sm:text-5xl xl:text-6xl">
            Your gateway to <span className="text-primary">everything</span> in Kenya
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-lg">
            Buy, book, hire, campaign and discover trusted opportunities — from everyday classifieds to services, jobs, politics and digital products.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="mx-auto mt-8 max-w-3xl rounded-lg border border-border bg-card p-3 shadow-xl md:p-4"
        >
          <div className="relative">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Toyota Vitz, bedsitter, massage, plumber…"
              aria-label="Search listings"
               className="h-12 w-full rounded-md border border-input bg-background pl-4 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 md:h-14 md:text-base"
            />

            {showSuggestions && suggestions.length > 0 && (
               <div className="absolute left-0 right-0 top-16 z-40 overflow-hidden rounded-md border border-border/60 bg-card shadow-2xl">
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handlePickSuggestion(item)}
                    className="flex w-full items-center gap-3 border-b border-border/40 px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-muted/60"
                  >
                    <img src={item.images?.[0] || "/placeholder.svg"} alt={item.title} className="h-10 w-12 flex-shrink-0 rounded-md object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {item.town ? `${item.town}, ${item.county}` : item.county}
                      </p>
                    </div>
                    <p className="text-xs font-semibold text-primary">KSh {Number(item.price || 0).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Category"
                 className="h-12 w-full cursor-pointer appearance-none rounded-md border border-input bg-background px-4 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <div className="relative">
              <select
                value={county}
                onChange={(e) => {
                  setCountyTouched(true);
                  setCounty(e.target.value);
                }}
                aria-label="County"
                 className="h-12 w-full cursor-pointer appearance-none rounded-md border border-input bg-background px-4 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All counties</option>
                {KENYA_COUNTIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <button
            type="submit"
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Search className="h-4 w-4" /> Search
          </button>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
            <span className="text-[11px] text-muted-foreground">Got something to offer?</span>
            <Link to="/post" className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">
              Publish it free <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </form>

        <div className="mx-auto mt-7 flex max-w-5xl gap-2 overflow-x-auto pb-2 scrollbar-hide sm:flex-wrap sm:justify-center">
          {INTENTS.map((item) => (
            <Link key={item.to} to={item.to} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm transition hover:border-primary hover:text-primary">
              {item.label} <ArrowRight className="h-3 w-3" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
