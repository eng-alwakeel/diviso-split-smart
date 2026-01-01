import { AppHeader } from "@/components/AppHeader";
import { PricingSection } from "@/components/PricingSection";
import { PricingPlansSection } from "@/components/pricing/PricingPlansSection";
import { CreditPackagesGrid } from "@/components/credits/CreditPackagesGrid";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { UnifiedAdLayout } from "@/components/ads/UnifiedAdLayout";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";

const PricingProtected = () => {
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation('credits');
  const isRTL = i18n.language === 'ar';
  
  const preselectedPlan = searchParams.get('plan');
  const preselectedBilling = searchParams.get('billing');
  const preselectedPackage = searchParams.get('package');

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <AppHeader />
      
      <UnifiedAdLayout 
        placement="pricing_protected"
        showTopBanner={true}
        showBottomBanner={false}
      >
        <main className="page-container space-y-8 py-8">
          {/* Free Credits Section */}
          <PricingSection />

          {/* Tabs for Subscriptions and Credit Packages */}
          <Tabs defaultValue="subscriptions" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="subscriptions">
                {t('subscriptions.title')}
              </TabsTrigger>
              <TabsTrigger value="packages">
                {t('packages.title')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="subscriptions" className="mt-6">
              <PricingPlansSection 
                showTitle={false}
                defaultYearly={preselectedBilling !== 'monthly'}
              />
            </TabsContent>
            
            <TabsContent value="packages" className="mt-6">
              <CreditPackagesGrid 
                preselectedPackage={preselectedPackage || 'large'}
              />
            </TabsContent>
          </Tabs>
        </main>
      </UnifiedAdLayout>
      
      <Footer />
      <div className="h-32 lg:hidden" />
      <BottomNav />
    </div>
  );
};

export default PricingProtected;
