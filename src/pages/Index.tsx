import { lazy, Suspense, useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleOneTap } from "@/hooks/useGoogleOneTap";

// Lazy load below-the-fold components for faster FCP
const AnimatedHowItWorks = lazy(() => import("@/components/landing/AnimatedHowItWorks").then(m => ({ default: m.AnimatedHowItWorks })));
const FeaturesSection = lazy(() => import("@/components/FeaturesSection").then(m => ({ default: m.FeaturesSection })));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection").then(m => ({ default: m.TestimonialsSection })));
const QuickStartSection = lazy(() => import("@/components/landing/QuickStartSection").then(m => ({ default: m.QuickStartSection })));
const PricingSection = lazy(() => import("@/components/PricingSection").then(m => ({ default: m.PricingSection })));

// Import non-lazy for above-the-fold
import { DemoSandbox } from "@/components/landing/DemoSandbox";

import { InstallWidget } from "@/components/pwa/InstallWidget";

// Properly sized skeleton to prevent layout shift - using containIntrinsicBlockSize for better CLS
const BelowFoldSkeleton = () => (
  <div 
    className="space-y-0"
    style={{ 
      minHeight: '2000px', 
      contentVisibility: 'auto', 
      containIntrinsicBlockSize: 'auto 2000px' 
    }}
  >
    <div className="bg-gradient-to-b from-muted/30 to-background" style={{ height: '500px' }} />
    <div className="bg-muted/50" style={{ height: '600px' }} />
    <div style={{ height: '400px' }} />
    <div style={{ height: '300px' }} />
    <div className="bg-muted/50" style={{ height: '500px' }} />
  </div>
);

const Index = () => {
  const { t } = useTranslation('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check auth for One Tap
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setIsLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);

  // Google One Tap on landing page for non-logged-in users
  useGoogleOneTap({
    enabled: !isLoggedIn,
  });
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
      
      {/* Interactive Demo Sandbox */}
      <DemoSandbox />
      
      {/* PWA Install Prompt */}
      <div className="page-container !py-0 !pb-0">
        <InstallWidget where="home" />
      </div>
      
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
