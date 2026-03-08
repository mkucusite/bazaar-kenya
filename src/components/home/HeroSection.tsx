import { Search, TrendingUp, Shield, Users } from "lucide-react";
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
    <section className="relative overflow-hidden bg-primary">
      {/* Geometric pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary-foreground/3 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-accent rounded-full" />
        <div className="absolute top-1/4 right-1/3 w-3 h-3 bg-accent/40 rounded-full" />
      </div>

      <div className="relative px-4 md:px-8 lg:px-16 xl:px-24 py-14 md:py-20 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-foreground/10 backdrop-blur-sm rounded-full text-primary-foreground/90 text-xs font-medium mb-8"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Kenya's #1 Classifieds Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-heading font-bold text-3xl md:text-5xl lg:text-[3.5rem] text-primary-foreground mb-5 leading-[1.1]"
          >
            Buy and Sell on Kenya's
            <br />
            <span className="text-accent">Safest</span> Classifieds
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-primary-foreground/70 text-sm md:text-base mb-10 max-w-lg mx-auto leading-relaxed"
          >
            Post your ad for FREE. Reach thousands of buyers across all 47 counties in Kenya.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-card rounded-xl p-3 shadow-2xl shadow-primary/20">
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex-1 h-11 px-4 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={county}
                  onChange={(e) => setCounty(e.target.value)}
                  className="flex-1 h-11 px-4 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">All Counties</option>
                  {KENYA_COUNTIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  onClick={handleSearch}
                  className="h-11 px-8 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <Search className="w-4 h-4" /> Search
                </button>
              </div>
            </div>
          </motion.div>

          {/* Quick stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center justify-center gap-8 mt-10 text-primary-foreground/60"
          >
            {[
              { icon: Users, text: "50K+ Users" },
              { icon: Shield, text: "Verified Sellers" },
              { icon: TrendingUp, text: "10K+ Ads Daily" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-xs font-medium">
                <Icon className="w-3.5 h-3.5" />
                {text}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
