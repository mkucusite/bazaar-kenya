import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdCard from "@/components/AdCard";
import { CATEGORIES, KENYA_COUNTIES, LATEST_ADS, PREMIUM_ADS } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal, X } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="section-padding py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading font-bold text-xl text-foreground">
              {query ? `Results for "${query}"` : "Browse Ads"}
            </h1>
            <p className="text-sm text-muted-foreground">{filteredAds.length} ads found</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="h-9 px-3 rounded-lg border border-input bg-background text-sm">
              <option value="latest">Latest</option>
              <option value="price-low">Price: Low-High</option>
              <option value="price-high">Price: High-Low</option>
              <option value="popular">Most Popular</option>
            </select>
            <Button variant="outline" size="sm" className="md:hidden" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className={`${showFilters ? "fixed inset-0 z-50 bg-card p-6 overflow-auto" : "hidden"} md:block md:relative md:w-64 flex-shrink-0 space-y-5`}>
            <div className="flex items-center justify-between md:hidden">
              <h3 className="font-heading font-bold text-lg">Filters</h3>
              <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm">
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">County</label>
              <select value={county} onChange={(e) => setCounty(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm">
                <option value="">All Counties</option>
                {KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Condition</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm">
                <option value="">Any</option>
                <option value="New">New</option>
                <option value="Used">Used</option>
                <option value="Refurbished">Refurbished</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Price Range</label>
              <div className="flex gap-2">
                <Input placeholder="Min" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="h-9" />
                <Input placeholder="Max" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="h-9" />
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setCategory(""); setCounty(""); setCondition(""); setMinPrice(""); setMaxPrice(""); }}>
              Clear Filters
            </Button>
          </aside>

          {/* Results Grid */}
          <div className="flex-1">
            {filteredAds.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg mb-2">No ads found</p>
                <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4">
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
