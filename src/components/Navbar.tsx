import { useEffect, useRef, useState } from "react";
import { Menu, Search, Camera, Plus, MapPin, ChevronDown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import UserSidebar from "./UserSidebar";
import NotificationBell from "./NotificationBell";
import logo from "@/assets/kenyaadvert-logo.webp";
import { supabase } from "@/integrations/supabase/client";
import { getAdPath } from "@/lib/ad-links";
import { CATEGORIES } from "@/data/mockData";
import type { Tables } from "@/integrations/supabase/types";

type SearchSuggestion = Pick<Tables<"ads">, "id" | "title" | "county" | "town" | "price" | "images"> & {slug?: string;};

type NavItem = { to: string; label: string; mega?: "categories" | "more" | "politics" | "directory" };

const desktopNavLinks: NavItem[] = [
  { to: "/search", label: "Browse Ads", mega: "categories" },
  { to: "/doctors", label: "Directories", mega: "directory" },
  { to: "/jobs", label: "Jobs" },
  { to: "/events", label: "Events" },
  { to: "/politics", label: "Politics", mega: "politics" },
  { to: "/digital-store", label: "Digital Store" },
  { to: "/blog", label: "Blog" },
  { to: "/advertise", label: "Advertise", mega: "more" },
];

const directoryLinks = [
  { to: "/doctors", label: "Doctors Directory", desc: "Specialists, dentists & clinics in all 47 counties" },
  { to: "/developers", label: "Developers & Creatives", desc: "Web, app and design portfolios you can preview" },
  { to: "/wellness", label: "Massage, Spa & Booking", desc: "Therapists, spas, salons, hotels & short stays" },
  { to: "/jobs", label: "Jobs in Kenya", desc: "Latest vacancies — free to post, free to apply" },
  { to: "/doctors/new", label: "List yourself as a doctor", desc: "Free profile, live instantly" },
  { to: "/developers/new", label: "Publish your portfolio", desc: "Show live website previews" },
  { to: "/wellness/new", label: "List your spa or stay", desc: "Get calls and WhatsApp bookings" },
  { to: "/jobs/new", label: "Post a job (free)", desc: "Reach thousands of jobseekers" },
];


const politicsLinks = [
  { to: "/politicians", label: "All Politicians", desc: "Browse every aspirant in one place" },
  { to: "/politicians?position=Governor", label: "Governors 2027", desc: "47 county governor races" },
  { to: "/politicians?position=Senator", label: "Senators 2027", desc: "Senate aspirants by county" },
  { to: "/politicians?position=Women%20Rep", label: "Women Reps 2027", desc: "Women representative race" },
  { to: "/politicians?position=MP", label: "MPs 2027", desc: "Constituency contests" },
  { to: "/politicians?position=MCA", label: "MCAs 2027", desc: "Ward-level aspirants" },
  { to: "/politics", label: "Political Parties", desc: "Party profiles and manifestos" },
  { to: "/blog?category=Politics", label: "Politics Blog", desc: "Analysis & election guides" },
];

const moreLinks = [
  { to: "/politicians", label: "2027 Aspirants" },
  { to: "/banners", label: "Banners" },
  { to: "/business-profile", label: "Business Profiles" },
  { to: "/alerts", label: "Search Alerts" },
  { to: "/about", label: "About Us" },
  { to: "/faqs", label: "FAQs" },
  { to: "/safety-tips", label: "Safety Tips" },
  { to: "/terms", label: "Terms" },
  { to: "/privacy", label: "Privacy" },
];





const Navbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const term = searchQuery.trim();
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      const escaped = term.replace(/,/g, " ");
      const { data } = await supabase.
      from("ads").
      select("id,title,county,town,price,images,slug").
      eq("status", "active").
      or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`).
      order("created_at", { ascending: false }).
      limit(5);

      setSuggestions(data as SearchSuggestion[] || []);
      setShowSuggestions(true);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = searchQuery.trim();
    navigate(`/search?q=${encodeURIComponent(term)}`);
    setShowSuggestions(false);
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleCameraSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      navigate(`/search`);
      return;
    }

    const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
    navigate(`/search?q=${encodeURIComponent(baseName || "")}`);
  };

  const handleSelectSuggestion = (ad: SearchSuggestion) => {
    navigate(getAdPath({ id: ad.id, title: ad.title, slug: (ad as any).slug }));
    setSearchQuery("");
    setShowSuggestions(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border/60">
        <div className="container-app hidden min-h-[84px] items-center gap-6 py-3 md:flex">
          <div className="flex min-w-0 items-center gap-4 xl:gap-6">
            <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2.5 hover:bg-muted transition-colors" aria-label="Open menu">
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <Link to="/" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-background p-1.5 ring-1 ring-border/60">
              <img alt="KenyaAdvert" className="max-h-full max-w-full object-contain" width={64} height={64} loading="eager" src={logo} />
            </Link>
            <div className="hidden lg:flex items-center gap-0.5">
              {desktopNavLinks.map((item) => (
                <div key={item.to} className="group/nav relative">
                  <Link
                    to={item.to}
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {item.label}
                    {item.mega && <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
                  </Link>
                  {item.mega === "categories" && (
                    <div className="invisible opacity-0 group-hover/nav:visible group-hover/nav:opacity-100 transition-all duration-150 absolute left-0 top-full pt-2 z-50">
                      <div className="w-[680px] bg-card border border-border/60 rounded-2xl shadow-2xl p-4 grid grid-cols-3 gap-1">
                        {CATEGORIES.slice(0, 12).map((c) => (
                          <Link
                            key={c.name}
                            to={`/search?category=${encodeURIComponent(c.name)}`}
                            className="rounded-lg px-3 py-2 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                          >
                            <span className="font-medium">{c.name}</span>
                            <span className="block text-[11px] text-muted-foreground truncate">{c.subcategories.slice(0, 2).join(" • ")}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.mega === "politics" && (
                    <div className="invisible opacity-0 group-hover/nav:visible group-hover/nav:opacity-100 transition-all duration-150 absolute left-1/2 -translate-x-1/2 top-full pt-2 z-50">
                      <div className="w-[560px] bg-card border border-border/60 rounded-2xl shadow-2xl p-3 grid grid-cols-2 gap-1">
                        {politicsLinks.map((p) => (
                          <Link
                            key={p.to}
                            to={p.to}
                            className="rounded-lg px-3 py-2 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                          >
                            <span className="font-medium block">{p.label}</span>
                            <span className="block text-[11px] text-muted-foreground truncate">{p.desc}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {item.mega === "more" && (
                    <div className="invisible opacity-0 group-hover/nav:visible group-hover/nav:opacity-100 transition-all duration-150 absolute right-0 top-full pt-2 z-50">
                      <div className="w-60 bg-card border border-border/60 rounded-2xl shadow-2xl py-2">
                        {moreLinks.map((m) => (
                          <Link key={m.to} to={m.to} className="block px-4 py-2 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors">
                            {m.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSearch} className="relative mx-2 flex-1 max-w-4xl xl:mx-4">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search for anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="w-full h-14 rounded-2xl border border-input bg-muted/50 pl-6 pr-28 text-base lg:text-lg text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
              
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  className="rounded-lg p-2 text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
                  onClick={handleCameraClick}>
                  
                  <Camera className="w-4 h-4" />
                </button>
                <button type="submit" className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
              </div>
            </div>

            {showSuggestions && suggestions.length > 0 &&
            <div className="absolute top-14 left-0 right-0 bg-card border border-border/60 rounded-2xl shadow-lg overflow-hidden z-50">
                {suggestions.map((ad) =>
              <button
                key={ad.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectSuggestion(ad)}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted/60 transition-colors text-left border-b border-border/40 last:border-b-0">
                
                    <img src={ad.images?.[0] || "/placeholder.svg"} alt={ad.title} className="w-12 h-10 rounded-md object-cover flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{ad.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {ad.town ? `${ad.town}, ${ad.county}` : ad.county}
                      </p>
                    </div>
                    <p className="text-xs font-semibold text-primary">KSh {Number(ad.price || 0).toLocaleString()}</p>
                  </button>
              )}
              </div>
            }
          </form>

          <div className="flex items-center gap-3 shrink-0">
            <NotificationBell />
            <Link to="/post-ad">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-5 rounded-xl shadow-sm h-11 text-base">
                <Plus className="w-4 h-4 mr-1.5" /> Sell
              </Button>
            </Link>
          </div>
        </div>

        <div className="md:hidden">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-2">
              <button onClick={() => setSidebarOpen(true)} className="p-1.5" aria-label="Open menu">
                <Menu className="w-5 h-5 text-foreground" />
              </button>
              <Link to="/" className="flex h-12 w-12 items-center justify-center rounded-lg bg-background p-1 ring-1 ring-border/60">
                <img src={logo} alt="KenyaAdvert" className="max-h-full max-w-full object-contain" width={56} height={56} loading="eager" />
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Link to="/post-ad">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg text-xs px-3 h-8">
                  <Plus className="w-3.5 h-3.5 mr-0.5" /> Sell
                </Button>
              </Link>
            </div>
          </div>
          <form onSubmit={handleSearch} className="px-4 pb-3 relative">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search for anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="w-full h-10 pl-4 pr-16 rounded-xl border border-input bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm" />
              
              <div className="absolute right-1.5 flex items-center gap-0.5">
                <button type="button" className="p-1.5 text-muted-foreground" onClick={handleCameraClick} aria-label="Search by photo">
                  <Camera className="w-4 h-4" />
                </button>
                <button type="submit" className="p-2 bg-primary text-primary-foreground rounded-lg" aria-label="Search">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {showSuggestions && suggestions.length > 0 &&
            <div className="absolute top-12 left-4 right-4 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden z-50">
                {suggestions.map((ad) =>
              <button
                key={ad.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectSuggestion(ad)}
                className="w-full flex items-center gap-2 p-2.5 hover:bg-muted/60 transition-colors text-left border-b border-border/40 last:border-b-0">
                
                    <img src={ad.images?.[0] || "/placeholder.svg"} alt={ad.title} className="w-10 h-9 rounded-md object-cover flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{ad.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{ad.town ? `${ad.town}, ${ad.county}` : ad.county}</p>
                    </div>
                  </button>
              )}
              </div>
            }
          </form>
        </div>
      </nav>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraSelected} />
      

      <UserSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>);

};

export default Navbar;