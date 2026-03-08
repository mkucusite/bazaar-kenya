import { useEffect, useRef, useState } from "react";
import { Menu, Search, Camera, Plus, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import UserSidebar from "./UserSidebar";
import NotificationBell from "./NotificationBell";
import logo from "@/assets/kenyaadvert-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { getAdPath } from "@/lib/ad-links";
import type { Tables } from "@/integrations/supabase/types";

type SearchSuggestion = Pick<Tables<"ads">, "id" | "title" | "county" | "town" | "price" | "images"> & { slug?: string };

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
      const { data } = await supabase
        .from("ads")
        .select("id,title,county,town,price,images,slug")
        .eq("status", "active")
        .or(`title.ilike.%${escaped}%,description.ilike.%${escaped}%`)
        .order("created_at", { ascending: false })
        .limit(5);

      setSuggestions((data as SearchSuggestion[]) || []);
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
    if (!file) return;

    const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]+/g, " ").trim();
    navigate(`/search?q=${encodeURIComponent(baseName)}&image=${encodeURIComponent(file.name)}`);

    event.target.value = "";
  };

  const handleSelectSuggestion = (ad: SearchSuggestion) => {
    navigate(getAdPath({ id: ad.id, title: ad.title, slug: (ad as any).slug }));
    setSearchQuery("");
    setShowSuggestions(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border/60">
        <div className="hidden md:flex items-center justify-between px-6 lg:px-8 h-16 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="KenyaAdvert" className="h-14 w-auto" width={56} height={56} />
            </Link>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-md mx-8 relative">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search for anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="w-full h-10 pl-4 pr-20 rounded-xl border border-input bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
              />
              <div className="absolute right-1.5 flex items-center gap-0.5">
                <button
                  type="button"
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded"
                  onClick={handleCameraClick}
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button type="submit" className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-12 left-0 right-0 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden z-50">
                {suggestions.map((ad) => (
                  <button
                    key={ad.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectSuggestion(ad)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted/60 transition-colors text-left border-b border-border/40 last:border-b-0"
                  >
                    <img src={ad.images?.[0] || "/placeholder.svg"} alt={ad.title} className="w-12 h-10 rounded-md object-cover flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{ad.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {ad.town ? `${ad.town}, ${ad.county}` : ad.county}
                      </p>
                    </div>
                    <p className="text-xs font-semibold text-primary">KSh {Number(ad.price || 0).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            )}
          </form>

          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link to="/post-ad">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-5 rounded-lg shadow-sm h-9 text-sm">
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
              <Link to="/" className="flex items-center gap-1.5">
                <img src={logo} alt="KenyaAdvert" className="h-14 w-auto" width={56} height={56} />
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
                className="w-full h-10 pl-4 pr-16 rounded-xl border border-input bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
              <div className="absolute right-1.5 flex items-center gap-0.5">
                <button type="button" className="p-1.5 text-muted-foreground" onClick={handleCameraClick}>
                  <Camera className="w-4 h-4" />
                </button>
                <button type="submit" className="p-2 bg-primary text-primary-foreground rounded-lg">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-12 left-4 right-4 bg-card border border-border/60 rounded-xl shadow-lg overflow-hidden z-50">
                {suggestions.map((ad) => (
                  <button
                    key={ad.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectSuggestion(ad)}
                    className="w-full flex items-center gap-2 p-2.5 hover:bg-muted/60 transition-colors text-left border-b border-border/40 last:border-b-0"
                  >
                    <img src={ad.images?.[0] || "/placeholder.svg"} alt={ad.title} className="w-10 h-9 rounded-md object-cover flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate">{ad.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{ad.town ? `${ad.town}, ${ad.county}` : ad.county}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>
      </nav>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraSelected}
      />

      <UserSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
};

export default Navbar;
