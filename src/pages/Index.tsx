import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { PricingSection } from "@/components/PricingSection";
import { Footer } from "@/components/Footer";
import { SimplifiedAdManager } from "@/components/ads/SimplifiedAdManager";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <FeaturesSection />
      
      {/* Ads for visitors */}
      <div className="container mx-auto px-4 py-8">
        <SimplifiedAdManager 
          placement="homepage_features" 
          className="max-w-2xl mx-auto"
        />
      </div>
      
      <PricingSection />
      
      {/* Another ad placement */}
      <div className="container mx-auto px-4 py-8">
        <SimplifiedAdManager 
          placement="homepage_pricing" 
          className="max-w-2xl mx-auto"
        />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
