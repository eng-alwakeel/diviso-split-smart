import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { PricingSection } from "@/components/PricingSection";
import { Footer } from "@/components/Footer";
import { PersistentAdBanner } from "@/components/ads/PersistentAdBanner";
import { PersistentAdSidebar } from "@/components/ads/PersistentAdSidebar";
import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { AdsterraAd } from "@/components/ads/AdsterraAd";

const Index = () => {
  const { t } = useTranslation('landing');

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={t('seo.title')}
        description={t('seo.description')}
        canonical="https://diviso.app/"
      />
      <Header />
      <HeroSection />
      <FeaturesSection />
      
      {/* Adsterra Ad */}
      <div className="container mx-auto px-4 py-4">
        <AdsterraAd className="max-w-2xl mx-auto" />
      </div>
      
      {/* Persistent ads for all visitors */}
      <div className="container mx-auto px-4 py-2">
        <PersistentAdBanner 
          placement="homepage_features" 
          className="max-w-2xl mx-auto"
        />
      </div>
      
      <PricingSection />
      
      {/* Sidebar-style ad placement */}
      <div className="container mx-auto px-4 py-4">
        <PersistentAdSidebar className="max-w-sm mx-auto" />
      </div>
      <Footer />
    </div>
  );
};

export default Index;
