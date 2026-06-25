import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdCard from "@/components/AdCard";
import SiteBanner from "@/components/SiteBanner";
import { CATEGORIES, KENYA_COUNTIES, type Ad } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { SlidersHorizontal, X, Search, Loader2, Camera, PlusCircle, LayoutGrid, Rows3 } from "lucide-react";
import { mapDbAdToCard, type DbAd } from "@/lib/ad-mappers";
import { useAuth } from "@/contexts/AuthContext";
import SuggestCategoryDialog from "@/components/SuggestCategoryDialog";
import SubcategoryPanel from "@/components/search/SubcategoryPanel";
import SEOHead from "@/components/SEOHead";

const PAGE_SIZE = 60;
const FETCH_LIMIT = 1000;

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
  const [totalCount, setTotalCount] = useState<number>(0);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window === "undefined") return "grid";
    return (localStorage.getItem("search_view_mode") as "grid" | "list") || "grid";
  });

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("search_view_mode", viewMode);
  }, [viewMode]);

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

      let request = supabase.from("ads").select("*", { count: "exact" }).neq("status", "expired");

      const term = searchTerm.trim();
      if (term) {
        const escaped = term.replace(/,/g, " ");
        request = request.or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%,county.ilike.%${escaped}%,town.ilike.%${escaped}%`);
      }

      if (categoryId) request = request.eq("category_id", categoryId);
      if (county) request = request.eq("county", county);
      if (condition) request = request.ilike("condition", condition);
      if (minPrice) request = request.gte("price", Number(minPrice));
      if (maxPrice) request = request.lte("price", Number(maxPrice));
      if (badge) request = request.eq("badge", badge);

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

      // Always prioritize gold/silver first via DB-side ordering — paid ads always at top.
      request = request.order("badge", { ascending: true, nullsFirst: false });
      if (sortBy === "price-low") request = request.order("price", { ascending: true });
      else if (sortBy === "price-high") request = request.order("price", { ascending: false });
      else if (sortBy === "popular") request = request.order("views_count", { ascending: false });
      else request = request.order("created_at", { ascending: false });

      const { data, error, count } = await request.limit(FETCH_LIMIT);

      if (error) {
        setAds([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const badgeOrder: Record<string, number> = { gold: 0, silver: 1, standard: 2 };
      const mapped = ((data || []) as DbAd[]).map(mapDbAdToCard);
      mapped.sort((a, b) => {
        const aOrder = badgeOrder[a.badge || "standard"] ?? 2;
        const bOrder = badgeOrder[b.badge || "standard"] ?? 2;
        return aOrder - bOrder;
      });
      setAds(mapped);
      setTotalCount(count ?? mapped.length);
      setLoading(false);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [searchTerm, category, county, condition, minPrice, maxPrice, sortBy, badge, subcategory]);

  const filteredAds = useMemo(() => ads.slice(0, visibleCount), [ads, visibleCount]);
  const premiumAds = useMemo(
    () => ads.filter((a) => a.badge === "gold" || a.badge === "silver").slice(0, 8),
    [ads],
  );
  const showPremiumStrip = !badge && premiumAds.length >= 4;
  const hasMoreAds = ads.length > visibleCount;
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Infinite scroll: when the sentinel enters the viewport, reveal another page.
  useEffect(() => {
    if (!hasMoreAds || loading) return;
    const node = sentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setVisibleCount((prev) => prev + PAGE_SIZE);
      }
    }, { rootMargin: "600px 0px" });
    io.observe(node);
    return () => io.disconnect();
  }, [hasMoreAds, loading, ads.length]);


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

  // Per-category SEO copy + intro paragraph (auto-generated from category name).
  const categoryIntros: Record<string, { title: string; description: string; intro: string }> = {
    "Building Supplies": {
      title: "Buy & Sell Building Supplies in Kenya | KenyaAdvert",
      description: "Browse cement, steel, roofing sheets, tiles, paint and hardware deals across Kenya. Compare prices from verified suppliers on KenyaAdvert classifieds.",
      intro: "Find affordable building supplies in Kenya including cement, steel bars, roofing iron sheets, tiles, paint, plumbing fittings and hardware from verified suppliers in Nairobi, Mombasa, Kisumu and across all 47 counties. KenyaAdvert connects contractors, homeowners and developers with trusted hardware merchants offering competitive Kenya shilling prices, bulk discounts and M-Pesa-friendly transactions.",
    },
    "Car Parts & Accessories": {
      title: "Car Parts & Accessories for Sale in Kenya | KenyaAdvert",
      description: "Genuine and aftermarket car parts, tyres, batteries, rims and accessories for Toyota, Nissan, Subaru, Mazda and more. Buy and sell on KenyaAdvert.",
      intro: "Shop genuine and aftermarket car parts in Kenya — engine spares, body panels, tyres, batteries, rims, audio systems and accessories for Toyota, Nissan, Subaru, Mazda, Honda and every popular model. KenyaAdvert is Kenya's most active car-parts classifieds marketplace with daily listings from importers, garages and individual sellers nationwide.",
    },
    "Electronics": {
      title: "Buy & Sell Electronics in Kenya | KenyaAdvert",
      description: "Phones, laptops, TVs, speakers, cameras and gadgets at the best prices in Kenya. New, used and refurbished electronics on KenyaAdvert classifieds.",
      intro: "Discover the best deals on electronics in Kenya — smartphones, laptops, smart TVs, home theatres, gaming consoles, cameras, smartwatches and accessories from trusted Kenyan sellers. Whether you want a brand-new iPhone in Nairobi, a refurbished MacBook in Mombasa or a Samsung TV in Kisumu, KenyaAdvert lists thousands of verified electronics ads with M-Pesa-friendly pricing.",
    },
    "Home Garden & Kids": {
      title: "Home, Garden & Kids Items for Sale in Kenya | KenyaAdvert",
      description: "Furniture, kitchenware, garden tools, baby gear, toys and kids' clothing across Kenya. Affordable home essentials on KenyaAdvert classifieds.",
      intro: "Furnish your home in Kenya the easy way — sofas, beds, dining sets, kitchenware, garden tools, baby cots, strollers, toys and kids' clothing from sellers across Nairobi, Mombasa, Nakuru, Eldoret and beyond. KenyaAdvert's home, garden and kids section is Kenya's favourite place for affordable household items, new and gently used.",
    },
    "Jobs": {
      title: "Jobs in Kenya — Apply Today | KenyaAdvert",
      description: "Latest job vacancies in Kenya — sales, drivers, IT, teachers, hospitality, NGO and government opportunities. Browse and apply free on KenyaAdvert.",
      intro: "Find the latest jobs in Kenya across every industry — sales and marketing, driving, IT and software, teaching, hospitality, NGO, healthcare, engineering and government vacancies. KenyaAdvert publishes fresh jobs daily from Nairobi, Mombasa, Kisumu, Nakuru, Eldoret and all 47 counties. Apply directly to employers, free for all jobseekers.",
    },
    "Property Rentals & Sales": {
      title: "Property for Rent & Sale in Kenya | KenyaAdvert",
      description: "Bedsitters, 1-bedrooms, apartments, houses, land and commercial property for rent and sale across Kenya. Find your next home on KenyaAdvert.",
      intro: "Search property to rent or buy in Kenya — bedsitters and 1-bedrooms in Nairobi, family houses in Kiambu, beachfront homes in Mombasa, plots in Kajiado and commercial space across the country. KenyaAdvert lists thousands of verified property ads from landlords, agents and developers with transparent rent and sale prices in Kenya shillings.",
    },
    "Vehicles": {
      title: "Cars, Motorbikes & Vehicles for Sale in Kenya | KenyaAdvert",
      description: "Used and new cars, motorbikes, trucks, buses and tuktuks for sale in Kenya. Toyota, Nissan, Mazda, Subaru and more on KenyaAdvert classifieds.",
      intro: "Buy and sell vehicles in Kenya on KenyaAdvert — Toyota Probox, Mark X, Nissan Note, Subaru Forester, Mazda Demio, Honda Fit, Boxer motorbikes, lorries, pickups, tuktuks and luxury cars from verified dealers and private owners. Compare prices in Kenya shillings, view photos and contact sellers directly across all 47 counties.",
    },
  };

  const catSeo = category ? categoryIntros[category] : undefined;
  const canonicalParams = new URLSearchParams();
  if (category) canonicalParams.set("category", category);
  if (county) canonicalParams.set("county", county);
  const canonicalQs = canonicalParams.toString();
  const canonicalUrl = `https://www.kenyaadverts.com/search${canonicalQs ? `?${canonicalQs}` : ""}`;
  const computedTitle = searchTerm
    ? `"${searchTerm}" Classified Ads in Kenya | KenyaAdvert`
    : catSeo?.title || (category ? `${category}${county ? ` in ${county}` : ""} for Sale in Kenya | KenyaAdvert` : "Free Classified Ads in Kenya | Browse KenyaAdvert");
  const computedDesc = catSeo?.description
    || (category
      ? `Buy and sell ${category.toLowerCase()}${county ? ` in ${county}` : ""} on KenyaAdvert. Browse ${totalCount || ads.length}+ listings from trusted Kenyan sellers.`
      : `Browse free classified ads in Kenya on KenyaAdvert. Find cars, phones, property, jobs, services and electronics across all 47 counties.`);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title={computedTitle}
        description={computedDesc}
        canonical={canonicalUrl}
        robots={searchTerm || badge || imageHint ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1"}
        ogImage="https://www.kenyaadverts.com/og/og-search.png"
        keywords={`${category || "free classifieds"} Kenya, classified ads Kenya, ${category || "buy sell"} ${county || "Kenya"}, classifieds ${county || "all counties"}, KenyaAdvert, Jiji Kenya alternative, PigiaMe alternative, post free ads Kenya, browse ads Kenya, search listings Kenya, find deals Kenya, cheap ${category || "items"} Kenya, ${county || "Nairobi"} marketplace, online shopping Kenya, second hand ${category || "goods"}, used items Kenya, buy near me Kenya, sell fast Kenya, trusted sellers Kenya, verified ads Kenya, best deals Kenya, affordable prices Kenya, M-Pesa marketplace`}
      />
      <Navbar />
      <SiteBanner position="search_results" className="container-app mt-4" />
      <div className="container-app flex-1 py-8 xl:py-10">
        <div className="mb-8 min-w-0 space-y-4 xl:space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <h1 className="font-heading text-2xl md:text-3xl xl:text-4xl text-foreground">{searchTerm ? `Results for "${searchTerm}"` : category ? `${category} in Kenya` : "Browse Ads"}</h1>
              <p className="mt-1.5 text-sm xl:text-base text-muted-foreground">{(totalCount || ads.length).toLocaleString()} ads found • live search</p>
              {catSeo && !searchTerm && (
                <p className="mt-3 text-sm xl:text-base text-muted-foreground leading-relaxed max-w-4xl">
                  {catSeo.intro}
                </p>
              )}
            </div>
            <div className="grid w-full grid-cols-1 gap-3 min-[420px]:grid-cols-[minmax(0,1fr)_minmax(0,190px)_auto_auto] xl:w-auto xl:flex xl:items-center xl:justify-end">
              <SuggestCategoryDialog triggerClassName="w-full min-w-0 justify-center" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-11 min-w-0 w-full rounded-xl border border-input bg-card px-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="latest">Latest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
              <div className="hidden h-11 items-center gap-0.5 rounded-xl border border-input bg-card p-1 sm:flex">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                  className={`flex h-full w-9 items-center justify-center rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                  className={`flex h-full w-9 items-center justify-center rounded-lg transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
                >
                  <Rows3 className="h-4 w-4" />
                </button>
              </div>
              <Button variant="outline" size="sm" className="h-11 px-4 shrink-0 w-full xl:hidden min-[420px]:w-auto" onClick={() => setShowFilters(!showFilters)}>
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="relative min-w-0">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Live search listings..."
              className="h-12 w-full rounded-xl pr-12 text-base"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          {imageHint && (
            <div className="inline-flex max-w-full items-center gap-2 px-3 py-2 rounded-lg border border-border/60 bg-muted/40 text-xs text-muted-foreground break-all">
              <Camera className="w-3.5 h-3.5 shrink-0" /> Camera search from: {imageHint}
            </div>
          )}
        </div>


        <div className="flex min-w-0 flex-col gap-8 xl:flex-row">
          <aside className="hidden w-72 flex-shrink-0 space-y-4 xl:block">
            {category && (
              <SubcategoryPanel
                category={category}
                onSubcategorySelect={setSubcategory}
                selectedSubcategory={subcategory}
              />
            )}
            <div className="sticky top-24 rounded-2xl border border-border/60 bg-card p-6">
              <h3 className="mb-5 font-heading text-lg font-semibold text-foreground">Filters</h3>
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

          <div className="min-w-0 flex-1">
            {loading ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:gap-4">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
                  >
                    <div className="aspect-[4/3] animate-pulse bg-muted" />
                    <div className="space-y-2 p-3">
                      <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
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
              <>
                {showPremiumStrip && (
                  <div className="mb-6 rounded-2xl border-2 border-amber-300/50 bg-gradient-to-br from-amber-50/60 to-card p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h2 className="flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-wider text-amber-700">
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                        Premium {category ? `${category}` : ""} Listings
                      </h2>
                      <span className="text-[11px] font-medium text-muted-foreground">Verified · Top-ranked</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {premiumAds.map((ad) => (
                        <AdCard key={`premium-${ad.id}`} ad={ad} variant={ad.badge === "gold" ? "gold" : "silver"} uniform />
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:gap-4">
                  {filteredAds.map((ad) => (
                    <AdCard key={ad.id} ad={ad} variant={ad.badge === "gold" ? "gold" : ad.badge === "silver" ? "silver" : "default"} uniform />
                  ))}
                </div>
              </>
            )}

            {!loading && hasMoreAds && (
              <>
                <div ref={sentinelRef} aria-hidden className="h-px w-full" />
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading more listings...
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SearchPage;
