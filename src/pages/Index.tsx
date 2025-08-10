import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { PricingSection } from "@/components/PricingSection";
import { Footer } from "@/components/Footer";
import { AdSlot } from "@/components/ads/AdSlot";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* إعلان: بانر الصفحة الرئيسية */}
      <div className="container mx-auto px-4">
        <AdSlot placement="home_banner" />
      </div>
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <Footer />
    </div>
  );
};

export default Index;
