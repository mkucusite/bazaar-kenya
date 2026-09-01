import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/home/HeroSection";
import LocationBar from "@/components/LocationBar";
import ExploreHub from "@/components/home/ExploreHub";
import CategoriesSection from "@/components/home/CategoriesSection";
import SEOHead from "@/components/SEOHead";
import SiteBanner from "@/components/SiteBanner";

// Everything below the first screen loads on demand — the homepage stays a
// balanced directory of the whole site, not an endless wall of ads.
const NearYou = lazy(() => import("@/components/home/NearYou"));
const ServicesShowcase = lazy(() => import("@/components/home/ServicesShowcase"));
const PoliticiansSpotlight = lazy(() => import("@/components/home/PoliticiansSpotlight"));
const DigitalProductsRail = lazy(() => import("@/components/home/DigitalProductsRail"));
const DirectoryRails = lazy(() => import("@/components/home/DirectoryRails"));
const HotDeals = lazy(() => import("@/components/home/HotDeals"));
const UpcomingEvents = lazy(() => import("@/components/home/UpcomingEvents"));
const LatestAds = lazy(() => import("@/components/home/LatestAds"));
const DirectoryHub = lazy(() => import("@/components/home/DirectoryHub"));
const LatestBlogPosts = lazy(() => import("@/components/home/LatestBlogPosts"));
const LatestBanners = lazy(() => import("@/components/home/LatestBanners"));
const RecentlyViewed = lazy(() => import("@/components/home/RecentlyViewed"));
const PopularLocations = lazy(() => import("@/components/home/PopularLocations"));
const TrustBadges = lazy(() => import("@/components/home/TrustBadges"));
const HowItWorks = lazy(() => import("@/components/home/HowItWorks"));
const GrowBanner = lazy(() => import("@/components/home/GrowBanner"));
const AppBanner = lazy(() => import("@/components/home/AppBanner"));

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
      <LocationBar />
      <main className="pb-20 md:pb-0">
        <HeroSection />

        {/* 1. Where do you want to go — the whole site in one screen */}
        <ExploreHub />

        <Suspense fallback={<div className="h-40" />}>
          {/* 2. Localised picks */}
          <NearYou />

          {/* 3. Services people book every day */}
          <ServicesShowcase />

          {/* 4. Politics gets its own slot high up */}
          <PoliticiansSpotlight />

          {/* 5. Free digital products */}
          <DigitalProductsRail />

          <SiteBanner position="homepage_top" className="container-app my-2" />

          {/* 6. Classifieds — one compact deal rail */}
          <HotDeals />

          {/* 7. Stays, wellness, car hire */}
          <DirectoryRails kinds={["wellness", "hotel", "vehicle"]} />

          {/* 8. Events */}
          <UpcomingEvents />

          {/* 9. Professionals & places */}
          <DirectoryRails kinds={["doctor", "tour", "restaurant", "salon"]} />

          {/* 10. Browse-all categories then one compact ad grid */}
          <CategoriesSection />
          <LatestAds />

          {/* 12. Everything else */}
          <DirectoryHub />
          <LatestBanners />
          <LatestBlogPosts />
          <RecentlyViewed />
          <PopularLocations />
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
