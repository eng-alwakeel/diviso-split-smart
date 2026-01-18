import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { PricingSection } from "@/components/PricingSection";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { InteractiveSplitDemo } from "@/components/landing/InteractiveSplitDemo";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { AnimatedHowItWorks } from "@/components/landing/AnimatedHowItWorks";
import { QuickStartSection } from "@/components/landing/QuickStartSection";

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
      <InteractiveSplitDemo />
      <AnimatedHowItWorks />
      <FeaturesSection />
      <TestimonialsSection />
      <QuickStartSection />
      <PricingSection />
      <Footer />
    </div>
  );
};

export default Index;
