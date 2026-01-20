import { lazy, Suspense, useEffect } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

// Lazy load below-the-fold components for faster FCP
const AnimatedHowItWorks = lazy(() => import("@/components/landing/AnimatedHowItWorks").then(m => ({ default: m.AnimatedHowItWorks })));
const FeaturesSection = lazy(() => import("@/components/FeaturesSection").then(m => ({ default: m.FeaturesSection })));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection").then(m => ({ default: m.TestimonialsSection })));
const QuickStartSection = lazy(() => import("@/components/landing/QuickStartSection").then(m => ({ default: m.QuickStartSection })));
const PricingSection = lazy(() => import("@/components/PricingSection").then(m => ({ default: m.PricingSection })));

// Import non-lazy for above-the-fold
import { InteractiveSplitDemo } from "@/components/landing/InteractiveSplitDemo";

// Properly sized skeleton to prevent layout shift
const BelowFoldSkeleton = () => (
  <div style={{ minHeight: '2000px', contentVisibility: 'auto', containIntrinsicSize: '0 2000px' }}>
    <div className="py-16 bg-gradient-to-b from-muted/30 to-background" style={{ minHeight: '500px' }} />
    <div className="py-12 bg-muted/50" style={{ minHeight: '600px' }} />
    <div className="py-16" style={{ minHeight: '400px' }} />
    <div className="py-16" style={{ minHeight: '300px' }} />
    <div className="py-16" style={{ minHeight: '500px' }} />
  </div>
);

const Index = () => {
  const { t } = useTranslation('landing');

  // Handle pending invite tokens after Google OAuth redirect
  useEffect(() => {
    const handlePendingInvites = async () => {
      const joinToken = localStorage.getItem('joinToken');
      const phoneInviteToken = localStorage.getItem('phoneInviteToken');
      
      // No pending invites
      if (!joinToken && !phoneInviteToken) return;
      
      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // User is logged in, redirect to invite route
        if (joinToken) {
          console.log('🔗 Found pending joinToken, redirecting...');
          localStorage.removeItem('joinToken');
          window.location.href = `/i/${joinToken}`;
          return;
        }
        
        if (phoneInviteToken) {
          console.log('🔗 Found pending phoneInviteToken, redirecting...');
          localStorage.removeItem('phoneInviteToken');
          window.location.href = `/invite-phone/${phoneInviteToken}`;
          return;
        }
      }
    };
    
    handlePendingInvites();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={t('seo.title')}
        description={t('seo.description')}
        canonical="https://diviso.app/"
      />
      <Header />
      <HeroSection />
      
      {/* Above the fold - not lazy */}
      <InteractiveSplitDemo />
      
      {/* Below the fold - consolidated lazy loading */}
      <Suspense fallback={<BelowFoldSkeleton />}>
        <AnimatedHowItWorks />
        <FeaturesSection />
        <TestimonialsSection />
        <QuickStartSection />
        <PricingSection />
      </Suspense>
      <Footer />
    </div>
  );
};

export default Index;
