import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdCard from "@/components/AdCard";
import { CATEGORIES, KENYA_COUNTIES, LATEST_ADS, PREMIUM_ADS } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal, X, Search } from "lucide-react";

const ALL_ADS = [...PREMIUM_ADS, ...LATEST_ADS];

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";
  const countyParam = searchParams.get("county") || "";

  const [category, setCategory] = useState(categoryParam);
  const [county, setCounty] = useState(countyParam);
  const [condition, setCondition] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [showFilters, setShowFilters] = useState(false);

  const filteredAds = ALL_ADS.filter((ad) => {
    if (query && !ad.title.toLowerCase().includes(query.toLowerCase())) return false;
    if (category && ad.category !== category) return false;
    if (county && ad.county !== county) return false;
    if (condition && ad.condition !== condition) return false;
    if (minPrice && ad.price < Number(minPrice)) return false;
    if (maxPrice && ad.price > Number(maxPrice)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "popular") return b.views - a.views;
    return 0;
  });

  const FilterPanel = () => (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">County</label>
        <select value={county} onChange={(e) => setCounty(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm">
          <option value="">All Counties</option>
          {KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Condition</label>
        <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm">
          <option value="">Any</option>
          <option value="New">New</option>
          <option value="Used">Used</option>
          <option value="Refurbished">Refurbished</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Price Range</label>
        <div className="flex gap-2">
          <Input placeholder="Min" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="h-9" />
          <Input placeholder="Max" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="h-9" />
        </div>
      </div>
      <Button variant="outline" size="sm" className="w-full" onClick={() => { setCategory(""); setCounty(""); setCondition(""); setMinPrice(""); setMaxPrice(""); }}>
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container-app py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-lg md:text-xl text-foreground">
              {query ? `Results for "${query}"` : category ? category : "Browse Ads"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{filteredAds.length} ads found</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-9 px-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="latest">Latest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>
            <Button variant="outline" size="sm" className="md:hidden h-9" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-60 flex-shrink-0">
            <div className="bg-card rounded-xl border border-border/60 p-5 sticky top-20">
              <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Filters</h3>
              <FilterPanel />
            </div>
          </aside>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="fixed inset-0 z-50 bg-card p-6 overflow-auto md:hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading font-bold text-lg">Filters</h3>
                <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
              </div>
              <FilterPanel />
              <Button className="w-full mt-6" onClick={() => setShowFilters(false)}>Apply Filters</Button>
            </div>
          )}

          {/* Results */}
          <div className="flex-1">
            {filteredAds.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border border-border/60">
                <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium mb-1">No ads found</p>
                <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {filteredAds.map((ad) => <AdCard key={ad.id} ad={ad} />)}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SearchPage;
