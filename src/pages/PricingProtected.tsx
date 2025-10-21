import { AppHeader } from "@/components/AppHeader";
import { PricingSection } from "@/components/PricingSection";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { UnifiedAdLayout } from "@/components/ads/UnifiedAdLayout";

const PricingProtected = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <UnifiedAdLayout 
        placement="pricing_protected"
        showTopBanner={true}
        showBottomBanner={true}
      >
        <main className="page-container space-y-6">
          <PricingSection />
        </main>
      </UnifiedAdLayout>
      
      <Footer />
      <div className="h-32 lg:hidden" />
      <BottomNav />
    </div>
  );
};

export default PricingProtected;