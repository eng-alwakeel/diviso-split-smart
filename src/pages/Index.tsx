import { lazy, Suspense } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";

// Lazy load below-the-fold components for faster FCP
const InteractiveSplitDemo = lazy(() => import("@/components/landing/InteractiveSplitDemo").then(m => ({ default: m.InteractiveSplitDemo })));
const AnimatedHowItWorks = lazy(() => import("@/components/landing/AnimatedHowItWorks").then(m => ({ default: m.AnimatedHowItWorks })));
const FeaturesSection = lazy(() => import("@/components/FeaturesSection").then(m => ({ default: m.FeaturesSection })));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection").then(m => ({ default: m.TestimonialsSection })));
const QuickStartSection = lazy(() => import("@/components/landing/QuickStartSection").then(m => ({ default: m.QuickStartSection })));
const PricingSection = lazy(() => import("@/components/PricingSection").then(m => ({ default: m.PricingSection })));

// Light skeleton for lazy sections
const SectionSkeleton = () => (
  <div className="py-16 flex justify-center">
    <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

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
      
      {/* Lazy loaded sections below the fold */}
      <Suspense fallback={<SectionSkeleton />}>
        <InteractiveSplitDemo />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <AnimatedHowItWorks />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturesSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <TestimonialsSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <QuickStartSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <PricingSection />
      </Suspense>
      <Footer />
    </div>
  );
};

export default Index;
