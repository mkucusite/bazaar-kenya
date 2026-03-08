import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/home/HeroSection";
import TrustBadges from "@/components/home/TrustBadges";
import PremiumAds from "@/components/home/PremiumAds";
import CategoriesSection from "@/components/home/CategoriesSection";

// Lazy load below-the-fold sections
const LatestAds = lazy(() => import("@/components/home/LatestAds"));
const TrendingAds = lazy(() => import("@/components/home/TrendingAds"));
const HowItWorks = lazy(() => import("@/components/home/HowItWorks"));
const PopularLocations = lazy(() => import("@/components/home/PopularLocations"));
const GrowBanner = lazy(() => import("@/components/home/GrowBanner"));
const BlogPreview = lazy(() => import("@/components/home/BlogPreview"));
const AppBanner = lazy(() => import("@/components/home/AppBanner"));

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <TrustBadges />
        <PremiumAds />
        <CategoriesSection />
        <Suspense fallback={<div className="h-96" />}>
          <TrendingAds />
          <LatestAds />
          <HowItWorks />
          <PopularLocations />
          <GrowBanner />
          <BlogPreview />
          <AppBanner />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
