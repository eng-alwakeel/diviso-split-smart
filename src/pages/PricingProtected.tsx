import { AppHeader } from "@/components/AppHeader";
import { PricingSection } from "@/components/PricingSection";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";

const PricingProtected = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="pt-20 pb-20">
        <PricingSection />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default PricingProtected;