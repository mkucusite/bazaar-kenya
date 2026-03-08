import { Search, Camera, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KENYA_COUNTIES, CATEGORIES } from "@/data/mockData";

const HeroSection = () => {
  const [category, setCategory] = useState("");
  const [county, setCounty] = useState("");
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();

  const trending = useMemo(() => CATEGORIES.slice(0, 5).map((item) => item.name), []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (county) params.set("county", county);
    if (searchText) params.set("q", searchText);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden border-b border-border/60 bg-background">
      <div className="absolute -top-20 -right-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative section-padding !pt-6 !pb-6 md:!pt-10 md:!pb-10">
        <div className="page-container">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Kenya’s trusted local marketplace
          </div>

          <h1 className="max-w-2xl font-heading text-2xl font-bold leading-tight text-foreground md:text-4xl lg:text-5xl">
            Discover great deals nearby, post in minutes, and sell faster.
          </h1>

          <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            Browse verified listings across all counties with smart filters built for mobile-first shopping.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-5 rounded-2xl border border-border bg-card p-3 shadow-sm md:p-4"
          >
            <div className="relative">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search by product, service, or keyword"
                className="h-11 w-full rounded-xl border border-input bg-background pl-4 pr-20 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
                <button
                  type="button"
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Search by image"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/90"
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Counties</option>
                {KENYA_COUNTIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Popular searches:</span>
            {trending.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setCategory(item);
                  navigate(`/search?category=${encodeURIComponent(item)}`);
                }}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
