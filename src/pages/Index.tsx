import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/home/HeroSection";
import TrustBadges from "@/components/home/TrustBadges";
import PremiumAds from "@/components/home/PremiumAds";
import CategoriesSection from "@/components/home/CategoriesSection";
import SEOHead from "@/components/SEOHead";
import SiteBanner from "@/components/SiteBanner";

// Lazy load below-the-fold sections
const LatestAds = lazy(() => import("@/components/home/LatestAds"));
const TrendingAds = lazy(() => import("@/components/home/TrendingAds"));
const HowItWorks = lazy(() => import("@/components/home/HowItWorks"));
const PopularLocations = lazy(() => import("@/components/home/PopularLocations"));
const GrowBanner = lazy(() => import("@/components/home/GrowBanner"));
const BlogPreview = lazy(() => import("@/components/home/BlogPreview"));
const AppBanner = lazy(() => import("@/components/home/AppBanner"));
const UpcomingEvents = lazy(() => import("@/components/home/UpcomingEvents"));
const PopularInCounty = lazy(() => import("@/components/home/PopularInCounty"));

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="KenyaAdvert — Buy & Sell on Kenya's Trusted Classifieds"
        description="Kenya's #1 classifieds marketplace. Buy and sell phones, cars, electronics, property, services and more across all 47 counties. Free to post!"
        canonical="https://www.kenyaadverts.com"
        ogImage="https://www.kenyaadverts.com/og-image.png"
        keywords="buy and sell Kenya, classifieds Kenya, online marketplace Kenya, post free ads Kenya, cars for sale Kenya, phones for sale Nairobi, electronics Kenya, property for sale Kenya, jobs Kenya, services Nairobi, free classifieds Kenya, KenyaAdvert, second hand items Kenya, used cars Nairobi, cheap phones Kenya, land for sale Kenya, houses for rent Kenya, Nairobi classifieds, Mombasa classifieds, Kisumu buy sell, Nakuru marketplace, Eldoret ads, Thika online shopping, buy online Kenya, sell online Kenya, OLX Kenya alternative, Jiji Kenya alternative, marketplace Kenya app, M-Pesa payments, classified ads Nairobi, buy used items Kenya, sell second hand Kenya, Kenya online shop, affordable products Kenya, trusted sellers Kenya, verified classifieds Kenya, Kenya 47 counties, motorcycle Kenya, laptop for sale Kenya, furniture Kenya, farm products Kenya, agricultural equipment Kenya"
      />
      <Navbar />
      <main>
        <HeroSection />
        <SiteBanner position="homepage_top" className="container-app my-4" />
        <TrustBadges />
        <PremiumAds />
        <CategoriesSection />
        <Suspense fallback={<div className="h-96" />}>
          <TrendingAds />
          <PopularInCounty />
          <UpcomingEvents />
          <SiteBanner position="search_results" className="container-app my-4" />
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
