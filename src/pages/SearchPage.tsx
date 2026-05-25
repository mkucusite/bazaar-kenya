import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdCard from "@/components/AdCard";
import SiteBanner from "@/components/SiteBanner";
import { CATEGORIES, KENYA_COUNTIES, type Ad } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { SlidersHorizontal, X, Search, Loader2, Camera, PlusCircle } from "lucide-react";
import { mapDbAdToCard, type DbAd } from "@/lib/ad-mappers";
import { useAuth } from "@/contexts/AuthContext";
import SuggestCategoryDialog from "@/components/SuggestCategoryDialog";
import SubcategoryPanel from "@/components/search/SubcategoryPanel";
import SEOHead from "@/components/SEOHead";

const PAGE_SIZE = 30;

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const query = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";
  const countyParam = searchParams.get("county") || "";
  const badgeParam = searchParams.get("badge") || "";
  const imageHint = searchParams.get("image") || "";

  const [searchTerm, setSearchTerm] = useState(query);
  const [category, setCategory] = useState(categoryParam);
  const [county, setCounty] = useState(
    countyParam || (typeof window !== "undefined" ? localStorage.getItem("preferred_county") || "" : "")
  );
  const [condition, setCondition] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [badge, setBadge] = useState(badgeParam);
  const [subcategory, setSubcategory] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<Ad[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setSearchTerm(query);
    setCategory(categoryParam);
    if (countyParam) setCounty(countyParam);
    setBadge(badgeParam);
    setSubcategory("");
  }, [query, categoryParam, countyParam, badgeParam]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (county) localStorage.setItem("preferred_county", county);
    else localStorage.removeItem("preferred_county");
  }, [county]);


  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, category, county, condition, minPrice, maxPrice, sortBy, badge, subcategory]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);

      // Resolve category_id if category is selected
      let categoryId: string | null = null;
      if (category) {
        const { data: catRow } = await supabase.from("categories").select("id").eq("name", category).single();
        if (catRow) categoryId = catRow.id;
      }

      let request = supabase.from("ads").select("*").neq("status", "expired");

      const term = searchTerm.trim();
      if (term) {
        const escaped = term.replace(/,/g, " ");
        request = request.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%,county.ilike.%${escaped}%,town.ilike.%${escaped}%`);
      }

      // Filter by category_id directly instead of text fallback
      if (categoryId) request = request.eq("category_id", categoryId);

      if (county) request = request.eq("county", county);
      if (condition) request = request.ilike("condition", condition);
      if (minPrice) request = request.gte("price", Number(minPrice));
      if (maxPrice) request = request.lte("price", Number(maxPrice));
      if (badge) request = request.eq("badge", badge);

      // Subcategory filtering
      if (categoryId && subcategory) {
        if (subcategory === "__uncategorized__") {
          request = request.is("subcategory_id", null);
        } else {
          const { data: subRow } = await supabase
            .from("subcategories")
            .select("id")
            .eq("category_id", categoryId)
            .eq("name", subcategory)
            .single();

          if (subRow) request = request.eq("subcategory_id", subRow.id);
          else request = request.eq("id", "00000000-0000-0000-0000-000000000000");
        }
      }

      // Always sort gold first, then silver, then standard — THEN apply user's sort within each tier
      if (sortBy === "price-low") request = request.order("price", { ascending: true });
      else if (sortBy === "price-high") request = request.order("price", { ascending: false });
      else if (sortBy === "popular") request = request.order("views_count", { ascending: false });
      else request = request.order("created_at", { ascending: false });

      const { data, error } = await request.limit(120);

      if (error) {
        setAds([]);
        setLoading(false);
        return;
      }

      // Sort by badge priority: gold > silver > standard
      const badgeOrder: Record<string, number> = { gold: 0, silver: 1, standard: 2 };
      const mapped = ((data || []) as DbAd[]).map(mapDbAdToCard);
      mapped.sort((a, b) => {
        const aOrder = badgeOrder[a.badge || "standard"] ?? 2;
        const bOrder = badgeOrder[b.badge || "standard"] ?? 2;
        return aOrder - bOrder;
      });
      setAds(mapped);
      setLoading(false);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [searchTerm, category, county, condition, minPrice, maxPrice, sortBy, badge, subcategory]);

  const filteredAds = useMemo(() => ads.slice(0, visibleCount), [ads, visibleCount]);
  const hasMoreAds = ads.length > visibleCount;

  const FilterPanel = () => (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Category</label>
        <select value={category} onChange={(e) => { setCategory(e.target.value); setSubcategory(""); }} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm">
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">County</label>
        <select value={county} onChange={(e) => setCounty(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm">
          <option value="">All Counties</option>
          {KENYA_COUNTIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
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
        <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Boost</label>
        <select value={badge} onChange={(e) => setBadge(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm">
          <option value="">All listings</option>
          <option value="gold">Gold</option>
          <option value="silver">Silver</option>
          <option value="standard">Standard</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Price Range</label>
        <div className="flex gap-2">
          <Input placeholder="Min" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="h-9" />
          <Input placeholder="Max" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="h-9" />
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => {
          setCategory("");
          setCounty("");
          setCondition("");
          setMinPrice("");
          setMaxPrice("");
          setBadge("");
          setSubcategory("");
        }}
      >
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={searchTerm ? `"${searchTerm}" — Search Results` : category ? `${category} — Browse Ads` : "Browse All Ads"}
        description={`Find ${category || "anything"} on KenyaAdvert. ${ads.length} listings available across Kenya.`}
        canonical={`https://www.kenyaadverts.com/search${category ? `?category=${encodeURIComponent(category)}` : ""}`}
        robots={searchTerm || county || badge || imageHint ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1"}
        ogImage="https://www.kenyaadverts.com/og/og-search.png"
        keywords={`${category || "buy sell"} Kenya, classifieds ${county || "all counties"}, KenyaAdvert, browse ads Kenya, search listings, find deals Kenya, cheap ${category || "items"} Kenya, ${county || "Nairobi"} marketplace, online shopping Kenya, second hand ${category || "goods"}, used items Kenya, buy near me Kenya, sell fast Kenya, trusted sellers, verified ads, free classifieds, best deals Kenya, affordable prices, M-Pesa payment`}
      />
      <Navbar />
      <SiteBanner position="search_results" className="container-app mt-4" />
      <div className="container-app flex-1 py-6">
        <div className="space-y-3 mb-6 min-w-0">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h1 className="font-heading text-lg md:text-xl text-foreground">{searchTerm ? `Results for "${searchTerm}"` : "Browse Ads"}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{ads.length} ads found • live search</p>
            </div>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-[minmax(0,1fr)_minmax(0,150px)_auto] gap-2 w-full md:w-auto md:flex md:items-center md:justify-end">
              <SuggestCategoryDialog triggerClassName="w-full min-w-0 justify-center" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 min-w-0 w-full px-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="latest">Latest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
              <Button variant="outline" size="sm" className="md:hidden h-9 px-3 shrink-0 w-full min-[420px]:w-auto" onClick={() => setShowFilters(!showFilters)}>
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="relative min-w-0">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Live search listings..."
              className="h-10 w-full pr-10"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          {imageHint && (
            <div className="inline-flex max-w-full items-center gap-2 px-3 py-2 rounded-lg border border-border/60 bg-muted/40 text-xs text-muted-foreground break-all">
              <Camera className="w-3.5 h-3.5 shrink-0" /> Camera search from: {imageHint}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6 md:flex-row min-w-0">
          <aside className="hidden md:block w-60 flex-shrink-0 space-y-3">
            {category && (
              <SubcategoryPanel
                category={category}
                onSubcategorySelect={setSubcategory}
                selectedSubcategory={subcategory}
              />
            )}
            <div className="bg-card rounded-xl border border-border/60 p-5 sticky top-20">
              <h3 className="font-heading font-semibold text-sm text-foreground mb-4">Filters</h3>
              <FilterPanel />
            </div>
          </aside>

          {showFilters && (
            <div className="fixed inset-0 z-50 bg-card p-6 overflow-auto md:hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading font-bold text-lg">Filters</h3>
                <button onClick={() => setShowFilters(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              {category && (
                <SubcategoryPanel
                  category={category}
                  onSubcategorySelect={setSubcategory}
                  selectedSubcategory={subcategory}
                />
              )}
              <FilterPanel />
              <Button className="w-full mt-6" onClick={() => setShowFilters(false)}>
                Apply Filters
              </Button>
            </div>
          )}

          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="text-center py-20 bg-card rounded-xl border border-border/60">
                <Loader2 className="w-10 h-10 text-primary mx-auto mb-3 animate-spin" />
                <p className="text-muted-foreground font-medium mb-1">Loading ads...</p>
              </div>
            ) : filteredAds.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border border-border/60">
                <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium mb-1">No ads found</p>
                <p className="text-xs text-muted-foreground mb-4">Try adjusting your filters</p>
                <div className="space-y-2">
                  <p className="text-sm text-foreground font-medium">Have something to sell{category ? ` in ${category}` : ""}?</p>
                  <Button
                    onClick={() => {
                      if (user) {
                        navigate(`/post-ad${category ? `?category=${encodeURIComponent(category)}` : ""}`);
                      } else {
                        navigate("/login?redirect=" + encodeURIComponent(`/post-ad${category ? `?category=${encodeURIComponent(category)}` : ""}`));
                      }
                    }}
                    className="gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Post Your Ad
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredAds.map((ad) => (
                  <AdCard key={ad.id} ad={ad} />
                ))}
              </div>
            )}

            {!loading && hasMoreAds && (
              <div className="mt-6 flex justify-center">
                <Button variant="outline" onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}>
                  Load More Ads
                </Button>
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
