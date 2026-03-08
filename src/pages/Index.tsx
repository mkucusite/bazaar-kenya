import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/home/HeroSection";
import TrustBadges from "@/components/home/TrustBadges";
import PremiumAds from "@/components/home/PremiumAds";
import CategoriesSection from "@/components/home/CategoriesSection";
import LatestAds from "@/components/home/LatestAds";
import HowItWorks from "@/components/home/HowItWorks";
import PopularLocations from "@/components/home/PopularLocations";
import GrowBanner from "@/components/home/GrowBanner";
import BlogPreview from "@/components/home/BlogPreview";
import AppBanner from "@/components/home/AppBanner";
import QuickLinksStrip from "@/components/home/QuickLinksStrip";
import SafetyHighlights from "@/components/home/SafetyHighlights";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <QuickLinksStrip />
        <TrustBadges />
        <PremiumAds />
        <CategoriesSection />
        <LatestAds />
        <HowItWorks />
        <SafetyHighlights />
        <PopularLocations />
        <BlogPreview />
        <GrowBanner />
        <AppBanner />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
