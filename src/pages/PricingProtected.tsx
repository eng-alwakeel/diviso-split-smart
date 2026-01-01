import { AppHeader } from "@/components/AppHeader";
import { PricingPlansSection } from "@/components/pricing/PricingPlansSection";
import { CreditPackagesGrid } from "@/components/credits/CreditPackagesGrid";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { UnifiedAdLayout } from "@/components/ads/UnifiedAdLayout";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

const PricingProtected = () => {
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation('credits');
  const isRTL = i18n.language === 'ar';
  
  const preselectedBilling = searchParams.get('billing');

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <AppHeader />
      
      <UnifiedAdLayout 
        placement="pricing_protected"
        showTopBanner={true}
        showBottomBanner={false}
      >
        <main className="page-container space-y-8 py-6 sm:py-8">
          {/* قسم الاشتراكات */}
          <section className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-bold">{t('subscriptions.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('subscriptions.subtitle')}</p>
            </div>
            <PricingPlansSection 
              showTitle={false}
              defaultYearly={preselectedBilling !== 'monthly'}
            />
          </section>

          {/* فاصل بصري */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground font-medium">
                {isRTL ? 'أو' : 'or'}
              </span>
            </div>
          </div>

          {/* قسم شراء النقاط */}
          <section className="space-y-4">
            <CreditPackagesGrid />
          </section>
        </main>
      </UnifiedAdLayout>
      
      <Footer />
      <div className="h-32 lg:hidden" />
      <BottomNav />
    </div>
  );
};

export default PricingProtected;
