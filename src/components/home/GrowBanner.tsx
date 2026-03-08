import { TrendingUp, Star, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const GrowBanner = () => {
  return (
    <section className="section-padding">
      <div className="container-app">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-emerald-600 to-teal-600 p-6 md:p-10">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
          
          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 text-center md:text-left">
              <h2 className="font-heading text-xl md:text-2xl lg:text-3xl text-white mb-2">
                Grow Your Business Today!
              </h2>
              <p className="text-white/80 text-sm md:text-base mb-4 max-w-md">
                We've created tailored ad packages to boost, promote, and highlight your business.
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>6x More Views</span>
                </div>
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>Homepage Featured</span>
                </div>
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>Priority Listing</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <Link 
                  to="/post-ad" 
                  className="px-6 py-2.5 bg-white text-primary font-semibold text-sm rounded-lg hover:bg-white/90 transition-colors"
                >
                  Post an Ad
                </Link>
                <Link 
                  to="/subscriptions" 
                  className="px-6 py-2.5 bg-white/10 text-white font-semibold text-sm rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                >
                  View Packages
                </Link>
              </div>
            </div>
            
            <div className="hidden md:flex items-center justify-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center">
                  <TrendingUp className="w-16 h-16 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-900" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GrowBanner;
