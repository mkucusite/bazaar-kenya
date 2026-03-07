import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/home/HeroSection";
import TrustBadges from "@/components/home/TrustBadges";
import PremiumAds from "@/components/home/PremiumAds";
import CategoriesSection from "@/components/home/CategoriesSection";
import LatestAds from "@/components/home/LatestAds";
import GrowBanner from "@/components/home/GrowBanner";
import BlogPreview from "@/components/home/BlogPreview";
import AppBanner from "@/components/home/AppBanner";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <TrustBadges />
        <PremiumAds />
        <CategoriesSection />
        <LatestAds />
        <GrowBanner />
        <BlogPreview />
        <AppBanner />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
