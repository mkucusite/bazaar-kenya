import { useState } from "react";
import { Menu, Search, Camera, Bell, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import UserSidebar from "./UserSidebar";

const Navbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <>
      <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        {/* Desktop */}
        <div className="hidden md:flex items-center justify-between px-4 lg:px-8 h-16">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">KA</span>
              </div>
              <span className="font-heading font-bold text-xl text-foreground">KenyaAdvert</span>
            </Link>
          </div>

          <div className="flex-1 max-w-xl mx-8">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="I'm looking for..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-4 pr-20 rounded-full border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
                <button className="p-1.5 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-foreground" />
              <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">NEW</span>
            </button>
            <Link to="/post-ad">
              <Button className="bg-primary text-primary-foreground hover:opacity-90 font-semibold px-6 rounded-full">
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
                  <span className="text-primary-foreground font-bold text-xs">KA</span>
                </div>
                <span className="font-heading font-bold text-lg text-foreground">KenyaAdvert</span>
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative p-1.5">
                <Bell className="w-5 h-5 text-foreground" />
                <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[9px] font-bold px-1 py-0.5 rounded-full leading-none">NEW</span>
              </button>
              <Link to="/post-ad">
                <Button size="sm" className="bg-primary text-primary-foreground hover:opacity-90 font-semibold rounded-full text-xs px-4">
                  <Plus className="w-3.5 h-3.5 mr-0.5" /> Sell
                </Button>
              </Link>
            </div>
          </div>
          <div className="px-4 pb-3">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="I'm looking for..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-4 pr-16 rounded-full border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button className="p-1 text-muted-foreground">
                  <Camera className="w-4 h-4" />
                </button>
                <button className="p-1.5 bg-primary text-primary-foreground rounded-full">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <UserSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
};

export default Navbar;
