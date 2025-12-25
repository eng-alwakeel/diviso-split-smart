import { Header } from "@/components/Header";
import { PricingSection } from "@/components/PricingSection";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";

const Pricing = () => {
  const { t } = useTranslation('pricing');

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={t('seo.title')}
        description={t('seo.description')}
        canonical="https://diviso.app/pricing"
      />
      <Header />
      <main className="pt-20">
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;