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
const BlogPreview = lazy(() => import("@/components/home/BlogPreview"));
const AppBanner = lazy(() => import("@/components/home/AppBanner"));
const UpcomingEvents = lazy(() => import("@/components/home/UpcomingEvents"));
const PopularInCounty = lazy(() => import("@/components/home/PopularInCounty"));
const RecentlyViewed = lazy(() => import("@/components/home/RecentlyViewed"));
const StatsBand = lazy(() => import("@/components/home/StatsBand"));
const PriceRanges = lazy(() => import("@/components/home/PriceRanges"));
const TopSellers = lazy(() => import("@/components/home/TopSellers"));
const JustListedTicker = lazy(() => import("@/components/home/JustListedTicker"));

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="KenyaAdvert: Free Classifieds in Kenya | Buy & Sell"
        description="Post free ads in Kenya. Buy and sell cars, phones, property, jobs, electronics and services across all 47 counties on KenyaAdvert."
        canonical="https://www.kenyaadverts.com"
        ogImage="https://www.kenyaadverts.com/og-image.png"
        keywords="free classifieds in Kenya, free classified ads Kenya, classifieds Kenya, buy and sell Kenya, sell online Kenya, post free ads Kenya, online marketplace Kenya, Kenya adverts, KenyaAdvert, Jiji Kenya alternative, PigiaMe alternative, OLX Kenya alternative, cars for sale Kenya, used cars Nairobi, phones for sale Kenya, iPhone for sale Nairobi, electronics Kenya, laptops for sale Kenya, property for rent Kenya, houses for rent Nairobi, land for sale Kenya, jobs in Kenya, services Kenya, business for sale Kenya, furniture Kenya, farm products Kenya, agricultural equipment Kenya, motorcycle Kenya, spare parts Kenya, fashion Kenya, health and beauty Kenya, Nairobi classifieds, Mombasa classifieds, Kisumu marketplace, Nakuru ads, Eldoret classifieds, Thika online shopping, M-Pesa marketplace, trusted sellers Kenya, verified ads Kenya, second hand items Kenya, cheap deals Kenya, buy near me Kenya, sell fast Kenya"
      />
      <Navbar />
      <main className="pb-20 md:pb-0">
        <HeroSection />
        <Suspense fallback={null}>
          <StatsBand />
        </Suspense>
        <CategoriesSection />
        <SiteBanner position="homepage_top" className="container-app my-4" />
        <PremiumAds />
        <Suspense fallback={<div className="h-96" />}>
          <HotDeals />
          <RecentlyViewed />
          <TrendingAds />
          <PriceRanges />
          <LatestAds />
          <TopSellers />
          <PopularInCounty />
          <SiteBanner position="search_results" className="container-app my-4" />
          <UpcomingEvents />
          <PopularLocations />
          <LatestBlogPosts />
          <TrustBadges />
          <HowItWorks />
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
