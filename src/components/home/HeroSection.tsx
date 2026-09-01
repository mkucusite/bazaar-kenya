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
    <section className="relative overflow-hidden bg-[hsl(var(--primary))]">
      {/* Layered brand backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-emerald-800 to-teal-900" />
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-accent/25 blur-3xl" />
      <div className="absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-teal-300/10 blur-3xl" />

      <div className="container-app relative grid gap-8 pb-12 pt-10 md:grid-cols-[1.05fr_0.95fr] md:items-center md:pb-16 md:pt-14">
        {/* Editorial column */}
        <div className="text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/85 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            47 counties · one marketplace
          </span>

          <h1 className="mt-5 font-heading text-[2.3rem] font-black leading-[0.98] tracking-tight text-white sm:text-5xl xl:text-[4.1rem]">
            Buy it. Book it.
            <span className="block text-accent">Hire it. Own it.</span>
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/75 md:text-base">
            Kenya's multipurpose marketplace — classifieds, spas and salons, hotels and stays, car hire,
            safaris, doctors, schools, fundis, jobs, digital products and every 2027 aspirant.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {INTENTS.slice(0, 6).map((i) => (
              <Link
                key={i.to}
                to={i.to}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white/90 backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                {i.label} <ArrowRight className="h-3 w-3 opacity-70" />
              </Link>
            ))}
          </div>
        </div>

        {/* Search card */}
        <form
          onSubmit={handleSearch}
          className="rounded-3xl border border-white/15 bg-card p-4 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.55)] md:p-5"
        >
          <p className="mb-3 font-heading text-sm font-bold text-foreground">
            Search {county ? county : "all of Kenya"}
          </p>

          <div className="relative">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Toyota Vitz, bedsitter, massage, plumber…"
              aria-label="Search listings"
              className="h-14 w-full rounded-2xl border border-input bg-background pl-4 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
            />

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-16 z-40 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl">
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
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-input bg-background px-4 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-input bg-background px-4 pr-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
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
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
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
      </div>
    </section>
  );
};

export default HeroSection;
