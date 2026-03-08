import { Search, Camera } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KENYA_COUNTIES, CATEGORIES } from "@/data/mockData";

const HeroSection = () => {
  const [category, setCategory] = useState("");
  const [county, setCounty] = useState("");
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (county) params.set("county", county);
    if (searchText) params.set("q", searchText);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <section className="bg-gradient-to-br from-primary via-primary to-primary/90 relative overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative px-4 md:px-8 lg:px-16 xl:px-24 py-10 md:py-16 lg:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-heading font-bold text-2xl md:text-4xl lg:text-5xl text-primary-foreground mb-3 leading-tight">
            Buy & sell on Kenya's
            <span className="block text-accent">safest classifieds</span>
          </h1>
          <p className="text-primary-foreground/70 text-sm md:text-base mb-6 max-w-md mx-auto">
            Post your ad for FREE. Reach thousands of buyers across all 47 counties.
          </p>

          {/* Search box */}
          <div className="bg-card rounded-xl p-2.5 md:p-3 shadow-2xl max-w-2xl mx-auto">
            {/* Text search row */}
            <div className="relative mb-2">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="What are you looking for?"
                className="w-full h-11 md:h-12 pl-4 pr-20 rounded-lg border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button type="button" className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSearch()}
                  className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Filters row */}
            <div className="flex gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-foreground text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
              <select
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                className="flex-1 h-10 px-3 rounded-lg border border-input bg-background text-foreground text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
              >
                <option value="">All Counties</option>
                {KENYA_COUNTIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex items-center justify-center gap-6 md:gap-10 mt-6 text-primary-foreground/60 text-[11px] md:text-xs font-medium">
            <span>50K+ Users</span>
            <span className="w-1 h-1 bg-primary-foreground/30 rounded-full" />
            <span>Verified Sellers</span>
            <span className="w-1 h-1 bg-primary-foreground/30 rounded-full" />
            <span>10K+ Ads Daily</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
