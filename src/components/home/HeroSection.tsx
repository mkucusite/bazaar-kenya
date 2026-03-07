import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KENYA_COUNTIES, CATEGORIES } from "@/data/mockData";
import { motion } from "framer-motion";

const HeroSection = () => {
  const [category, setCategory] = useState("");
  const [county, setCounty] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (county) params.set("county", county);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden" style={{ background: "var(--hero-gradient)" }}>
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, rgba(255,255,255,0.2) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
      
      <div className="relative section-padding py-16 md:py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-block px-4 py-1.5 bg-primary-foreground/15 backdrop-blur-sm rounded-full text-primary-foreground text-xs font-medium mb-6"
        >
          Kenya's #1 Classifieds Platform
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-heading font-extrabold text-3xl md:text-5xl lg:text-6xl text-primary-foreground mb-4 leading-tight"
        >
          Buy and Sell on Kenya's<br />
          <span className="text-gold">Safest</span> Classifieds
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="text-primary-foreground/80 text-base md:text-lg mb-10 max-w-xl mx-auto"
        >
          Post your ad for FREE. Reach thousands of buyers across all 47 counties in Kenya
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-3xl mx-auto bg-card rounded-2xl p-4 md:p-5 shadow-2xl"
        >
          <div className="flex flex-col md:flex-row gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 h-12 px-4 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
              ))}
            </select>
            <select
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              className="flex-1 h-12 px-4 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Counties</option>
              {KENYA_COUNTIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button onClick={handleSearch} className="h-12 px-10 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg">
              <Search className="w-4 h-4" /> Search
            </button>
          </div>
        </motion.div>
      </div>
      
      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-foreground/5 rounded-full translate-y-1/2 -translate-x-1/3" />
      <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-gold/10 rounded-full" />
    </section>
  );
};

export default HeroSection;
