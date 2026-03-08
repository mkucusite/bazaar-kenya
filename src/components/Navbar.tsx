import { useState } from "react";
import { Menu, Search, Camera, Bell, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import UserSidebar from "./UserSidebar";

const Navbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-card border-b border-border/60 backdrop-blur-xl">
        {/* Desktop */}
        <div className="hidden md:flex items-center justify-between px-6 lg:px-10 h-16 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-5">
            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">KA</span>
              </div>
              <span className="font-heading font-bold text-lg text-foreground">KenyaAdvert</span>
            </Link>
          </div>

          <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-10">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="I'm looking for..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-4 pr-20 rounded-lg border border-input bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
              />
              <div className="absolute right-1.5 flex items-center gap-0.5">
                <button type="button" className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded">
                  <Camera className="w-4 h-4" />
                </button>
                <button type="submit" className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>

          <div className="flex items-center gap-2">
            <Link to="/notifications" className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-destructive rounded-full" />
            </Link>
            <Link to="/post-ad">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-5 rounded-lg shadow-sm h-9 text-sm">
                <Plus className="w-4 h-4 mr-1" /> Sell
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-2">
              <button onClick={() => setSidebarOpen(true)} className="p-1.5">
                <Menu className="w-5 h-5 text-foreground" />
              </button>
              <Link to="/" className="flex items-center gap-1.5">
                <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-[10px]">KA</span>
                </div>
                <span className="font-heading font-bold text-base text-foreground">KenyaAdvert</span>
              </Link>
            </div>
            <div className="flex items-center gap-1.5">
              <Link to="/notifications" className="relative p-1.5">
                <Bell className="w-5 h-5 text-foreground" />
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-destructive rounded-full" />
              </Link>
              <Link to="/post-ad">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-lg text-xs px-3 h-8">
                  <Plus className="w-3.5 h-3.5 mr-0.5" /> Sell
                </Button>
              </Link>
            </div>
          </div>
          <form onSubmit={handleSearch} className="px-4 pb-3">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="I'm looking for..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-4 pr-16 rounded-lg border border-input bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
              <div className="absolute right-1.5 flex items-center gap-0.5">
                <button type="button" className="p-1 text-muted-foreground">
                  <Camera className="w-4 h-4" />
                </button>
                <button type="submit" className="p-1.5 bg-primary text-primary-foreground rounded-md">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </nav>

      <UserSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
};

export default Navbar;
