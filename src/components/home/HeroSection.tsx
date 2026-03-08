import { Search, Camera, ChevronDown } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KENYA_COUNTIES, CATEGORIES } from "@/data/mockData";

const HeroSection = () => {
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState("");
  const [county, setCounty] = useState("");
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (county) params.set("county", county);
    if (searchText) params.set("q", searchText);
    navigate(`/search?${params.toString()}`);
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

  return (
    <section className="bg-gradient-to-br from-primary via-primary to-emerald-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative container-app py-8 md:py-14 lg:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white mb-3 leading-tight">
            Buy & Sell on Kenya's
            <span className="block text-amber-400">Safest Classifieds</span>
          </h1>
          <p className="text-white/70 text-sm md:text-base mb-6 max-w-md mx-auto">
            Post your ad for FREE. Reach thousands of buyers across all 47 counties.
          </p>

          <div className="bg-white rounded-2xl p-3 md:p-4 shadow-2xl shadow-black/20">
            <div className="relative mb-3">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="What are you looking for?"
                className="input-search pr-24"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                  onClick={handleCameraClick}
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button onClick={() => handleSearch()} className="p-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 pr-8 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              <div className="relative flex-1">
                <select
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="w-full h-10 px-3 pr-8 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                >
                  <option value="">All Counties</option>
                  {KENYA_COUNTIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 md:gap-8 mt-6 text-white/60 text-xs md:text-sm font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
              <span>50K+ Users</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
              <span>Verified Sellers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
              <span>10K+ Daily Ads</span>
            </div>
          </div>
        </div>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraSelected}
      />
    </section>
  );
};

export default HeroSection;
