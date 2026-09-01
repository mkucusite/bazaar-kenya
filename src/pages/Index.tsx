import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/home/HeroSection";
import TrustBadges from "@/components/home/TrustBadges";
import PremiumAds from "@/components/home/PremiumAds";
import CategoriesSection from "@/components/home/CategoriesSection";
import SEOHead from "@/components/SEOHead";
import SiteBanner from "@/components/SiteBanner";
import LatestBlogPosts from "@/components/home/LatestBlogPosts";

// Lazy load below-the-fold sections
const HotDeals = lazy(() => import("@/components/home/HotDeals"));
const LatestAds = lazy(() => import("@/components/home/LatestAds"));
const TrendingAds = lazy(() => import("@/components/home/TrendingAds"));
const HowItWorks = lazy(() => import("@/components/home/HowItWorks"));
const PopularLocations = lazy(() => import("@/components/home/PopularLocations"));
const GrowBanner = lazy(() => import("@/components/home/GrowBanner"));
const AppBanner = lazy(() => import("@/components/home/AppBanner"));
const UpcomingEvents = lazy(() => import("@/components/home/UpcomingEvents"));
const RecentlyViewed = lazy(() => import("@/components/home/RecentlyViewed"));
const StatsBand = lazy(() => import("@/components/home/StatsBand"));
const JustListedTicker = lazy(() => import("@/components/home/JustListedTicker"));
const PoliticiansSpotlight = lazy(() => import("@/components/home/PoliticiansSpotlight"));
const DirectoryRails = lazy(() => import("@/components/home/DirectoryRails"));
const DigitalProductsRail = lazy(() => import("@/components/home/DigitalProductsRail"));
const LatestBanners = lazy(() => import("@/components/home/LatestBanners"));
const ServicesShowcase = lazy(() => import("@/components/home/ServicesShowcase"));
const DirectoryHub = lazy(() => import("@/components/home/DirectoryHub"));

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="KenyaAdvert: Free Classifieds in Kenya | Buy & Sell"
        description="Post free ads in Kenya. Buy and sell cars, phones, property, jobs, electronics and services across all 47 counties on KenyaAdvert."
        canonical="https://www.kenyaadverts.com"
        ogImage="https://www.kenyaadverts.com/og-image.png"
        keywords="free classifieds in Kenya, classifieds Kenya, buy and sell Kenya, post free ads Kenya, online marketplace Kenya, room massage Nairobi, spa Kenya, hotel booking Kenya, car hire Kenya, safari packages Kenya, doctors directory Kenya, web developers Kenya, jobs in Kenya, plumber near me Kenya, salon Nairobi, restaurants Kenya, schools Kenya, gyms Nairobi, fundi Kenya, digital products Kenya, cars for sale Kenya, phones for sale Kenya, property for rent Kenya, Nairobi classifieds, Mombasa classifieds, Kisumu marketplace, verified sellers Kenya"
      />
      <Navbar />
      <main className="pb-20 md:pb-0">
        <HeroSection />
        <Suspense fallback={null}>
          <JustListedTicker />
          <StatsBand />
        </Suspense>
        <CategoriesSection />
        <SiteBanner position="homepage_top" className="container-app my-4" />
        <Suspense fallback={<div className="h-96" />}>
          {/* Services first, then verticals interleaved with ads so the page stays balanced */}
          <ServicesShowcase />
          <PremiumAds />
          <DirectoryRails kinds={["wellness", "hotel", "doctor"]} />
          <HotDeals />
          <DirectoryHub />
          <LatestAds />
          <DirectoryRails kinds={["vehicle", "job", "developer"]} />
          <DigitalProductsRail />
          <SiteBanner position="search_results" className="container-app my-4" />
          <UpcomingEvents />
          <DirectoryRails kinds={["tour", "restaurant", "salon", "artisan"]} />
          <PoliticiansSpotlight />
          <LatestBanners />
          <TrendingAds />
          <RecentlyViewed />
          <PopularLocations />
          <LatestBlogPosts />
          <TrustBadges />
          <HowItWorks />
          <GrowBanner />
          <AppBanner />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
