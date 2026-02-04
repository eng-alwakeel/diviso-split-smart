import React, { lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ImprovedErrorBoundary } from "@/components/ImprovedErrorBoundary";
import { PageErrorBoundary } from "@/components/PageErrorBoundary";
import { EnhancedPerformanceMonitor } from "@/components/performance/EnhancedPerformanceMonitor";
import { withLazyLoading } from "@/components/LazyComponents";
import { AdPreferencesProvider } from "@/contexts/AdPreferencesContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useServiceWorkerUpdate } from "@/hooks/useServiceWorkerUpdate";
import { useNativeFeatures } from "@/hooks/useNativeFeatures";
import { useDeepLinks } from "@/hooks/useDeepLinks";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { RoleAssignmentNotification } from "@/components/RoleAssignmentNotification";
import { REDIRECTS } from "@/lib/redirects";

// Lazy load critical pages for faster initial load
const LazyIndex = withLazyLoading(lazy(() => import("./pages/Index")));
const LazyDashboard = withLazyLoading(lazy(() => import("./pages/Dashboard")));
const LazyAuth = withLazyLoading(lazy(() => import("./pages/Auth")));
import EmailVerify from "./pages/EmailVerify";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import InviteRoute from "./pages/InviteRoute";
import PhoneInviteRoute from "./pages/PhoneInviteRoute";
import NotFound from "./pages/NotFound";

// Lazy load heavy components
const LazyCreateGroup = withLazyLoading(lazy(() => import("./pages/CreateGroup")));
const LazyAddExpense = withLazyLoading(lazy(() => import("./pages/AddExpense")));
const LazyReferralCenter = withLazyLoading(lazy(() => import("./pages/ReferralCenter")));
const LazyGroupDetails = withLazyLoading(lazy(() => import("./pages/GroupDetails")));
const LazyGroupInvite = withLazyLoading(lazy(() => import("./pages/GroupInvite")));
const LazyFinancialPlan = withLazyLoading(lazy(() => import("./pages/FinancialPlan")));
const LazyCreateUnifiedBudget = withLazyLoading(lazy(() => import("./pages/CreateUnifiedBudget")));
const LazyMyExpenses = withLazyLoading(lazy(() => import("./pages/MyExpenses")));
const LazyMyGroups = withLazyLoading(lazy(() => import("./pages/MyGroups")));
const LazySettings = withLazyLoading(lazy(() => import("./pages/Settings")));
const LazyPricingProtected = withLazyLoading(lazy(() => import("./pages/PricingProtected")));
const LazyNotifications = withLazyLoading(lazy(() => import("./pages/Notifications")));
const LazyPricing = withLazyLoading(lazy(() => import("./pages/Pricing")));
const LazyReferralSignup = withLazyLoading(lazy(() => import("./pages/ReferralSignup")));
const LazyPrivacyPolicy = withLazyLoading(lazy(() => import("./pages/PrivacyPolicy")));
const LazyRefundPolicy = withLazyLoading(lazy(() => import("./pages/RefundPolicy")));
const LazyTermsConditions = withLazyLoading(lazy(() => import("./pages/TermsConditions")));
const LazyCookiesPolicy = withLazyLoading(lazy(() => import("./pages/CookiesPolicy")));
const LazyFAQ = withLazyLoading(lazy(() => import("./pages/FAQ")));
const LazyHowItWorks = withLazyLoading(lazy(() => import("./pages/HowItWorks")));
const LazyAdminDashboard = withLazyLoading(lazy(() => import("./pages/AdminDashboard")));
const LazyAdminManagement = withLazyLoading(lazy(() => import("./pages/AdminManagement")));
const LazyTVDashboard = withLazyLoading(lazy(() => import("./pages/TVDashboard")));
const LazySupportDashboard = withLazyLoading(lazy(() => import("./pages/SupportDashboard")));
const LazyMyTickets = withLazyLoading(lazy(() => import("./pages/MyTickets")));
const AdTestPage = withLazyLoading(lazy(() => import("./components/ads/AdTestPage")));
const LazyCreditStore = withLazyLoading(lazy(() => import("./pages/CreditStore")));
const LazyPaymentCallback = withLazyLoading(lazy(() => import("./pages/PaymentCallback")));
const LazyBlog = withLazyLoading(lazy(() => import("./pages/Blog")));
const LazyBlogPost = withLazyLoading(lazy(() => import("./pages/BlogPost")));
const LazyOfferwall = withLazyLoading(lazy(() => import("./pages/Offerwall")));
const LazyRecommendationTest = withLazyLoading(lazy(() => import("./pages/RecommendationTestPage")));
const LazyGroupSettings = withLazyLoading(lazy(() => import("./pages/GroupSettings")));
const LazyUseCases = withLazyLoading(lazy(() => import("./pages/UseCases")));
const LazyUseCaseDetails = withLazyLoading(lazy(() => import("./pages/UseCaseDetails")));
const LazyLandingPage = withLazyLoading(lazy(() => import("./pages/LandingPage")));
const LazyLaunchPage = withLazyLoading(lazy(() => import("./pages/LaunchPage")));
const LazyInfluencerPage = withLazyLoading(lazy(() => import("./pages/InfluencerPage")));
const LazyWelcome = withLazyLoading(lazy(() => import("./pages/Welcome")));
const LazyFoundingProgram = withLazyLoading(lazy(() => import("./pages/FoundingProgram")));
const LazyDiceDecisionPage = withLazyLoading(lazy(() => import("./pages/DiceDecisionPage")));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3 * 60 * 1000, // 3 minutes (reduced from 5)
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: 'always', // Changed: always refetch on mount for fresh data
      refetchOnReconnect: true, // Changed: refetch when reconnecting
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
    },
  },
});

// Inner component that uses router hooks
const AppRoutes: React.FC = () => {
  // Initialize native features (status bar, back button, etc.)
  useNativeFeatures();
  
  // Handle deep links
  useDeepLinks();
  
  // Track user activity for founding users monthly credits
  useActivityTracker();

  // Track page views for SPA navigation (GTM/GA4)
  const location = useLocation();
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'page_view',
        page_path: location.pathname,
        page_title: document.title,
        page_location: window.location.href
      });
    }
  }, [location.pathname]);

  return (
    <>
      <EnhancedPerformanceMonitor />
      <Toaster />
      <Sonner />
      <RoleAssignmentNotification />
      <ImprovedErrorBoundary>
        <Routes>
            <Route path="/auth" element={<LazyAuth />} />
            <Route path="/auth/verify" element={<EmailVerify />} />
            <Route path="/welcome" element={<ProtectedRoute><LazyWelcome /></ProtectedRoute>} />
            <Route path="/" element={<LazyIndex />} />
            <Route path="/i/:code" element={<InviteRoute />} />
            <Route path="/invite-phone/:token" element={<PhoneInviteRoute />} />
            <Route path="/join/:referralCode" element={<LazyReferralSignup />} />
            <Route path="/privacy-policy" element={<LazyPrivacyPolicy />} />
            <Route path="/refund-policy" element={<LazyRefundPolicy />} />
            <Route path="/terms" element={<LazyTermsConditions />} />
            <Route path="/cookies" element={<LazyCookiesPolicy />} />
            <Route path="/faq" element={<LazyFAQ />} />
            <Route path="/how-it-works" element={<LazyHowItWorks />} />
            <Route path="/blog" element={<LazyBlog />} />
            <Route path="/blog/:slug" element={<LazyBlogPost />} />
            <Route path="/use-cases" element={<LazyUseCases />} />
            <Route path="/use-cases/:slug" element={<LazyUseCaseDetails />} />
            {/* Landing Pages for Ad Campaigns - Zero Distraction */}
            <Route path="/lp/:slug" element={<LazyLandingPage />} />
            <Route path="/launch" element={<LazyLaunchPage />} />
            <Route path="/from" element={<LazyInfluencerPage />} />
            <Route path="/founding" element={<LazyFoundingProgram />} />
            <Route path="/offerwall" element={<LazyOfferwall />} />
            <Route path="/dashboard" element={<ProtectedRoute><PageErrorBoundary><LazyDashboard /></PageErrorBoundary></ProtectedRoute>} />
            <Route path="/dice" element={<ProtectedRoute><PageErrorBoundary><LazyDiceDecisionPage /></PageErrorBoundary></ProtectedRoute>} />
            <Route path="/create-group" element={<ProtectedRoute><PageErrorBoundary><LazyCreateGroup /></PageErrorBoundary></ProtectedRoute>} />
            <Route path="/group/:id" element={<ProtectedRoute><PageErrorBoundary><LazyGroupDetails /></PageErrorBoundary></ProtectedRoute>} />
            <Route path="/group/:id/invite" element={<ProtectedRoute><PageErrorBoundary><LazyGroupInvite /></PageErrorBoundary></ProtectedRoute>} />
            <Route path="/group/:id/settings" element={<ProtectedRoute><PageErrorBoundary><LazyGroupSettings /></PageErrorBoundary></ProtectedRoute>} />
            <Route path="/add-expense" element={<ProtectedRoute><PageErrorBoundary><LazyAddExpense /></PageErrorBoundary></ProtectedRoute>} />
            <Route path="/my-expenses" element={<ProtectedRoute><PageErrorBoundary><LazyMyExpenses /></PageErrorBoundary></ProtectedRoute>} />
            <Route path="/my-groups" element={<ProtectedRoute><PageErrorBoundary><LazyMyGroups /></PageErrorBoundary></ProtectedRoute>} />
            <Route path="/financial-plan" element={<ProtectedRoute><PageErrorBoundary><LazyFinancialPlan /></PageErrorBoundary></ProtectedRoute>} />
            <Route path="/create-unified-budget" element={<ProtectedRoute><PageErrorBoundary><LazyCreateUnifiedBudget /></PageErrorBoundary></ProtectedRoute>} />
            <Route path="/referral" element={<ProtectedRoute><PageErrorBoundary><LazyReferralCenter /></PageErrorBoundary></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><PageErrorBoundary><LazyNotifications /></PageErrorBoundary></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><PageErrorBoundary><LazySettings /></PageErrorBoundary></ProtectedRoute>} />
            <Route path="/pricing-protected" element={<ProtectedRoute><PageErrorBoundary><LazyPricingProtected /></PageErrorBoundary></ProtectedRoute>} />
            <Route path="/admin-dashboard" element={<AdminProtectedRoute><LazyAdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin-management" element={<AdminProtectedRoute><LazyAdminManagement /></AdminProtectedRoute>} />
            <Route path="/admin-tv" element={<AdminProtectedRoute><LazyTVDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/support" element={<AdminProtectedRoute><LazySupportDashboard /></AdminProtectedRoute>} />
            <Route path="/my-tickets" element={<ProtectedRoute><PageErrorBoundary><LazyMyTickets /></PageErrorBoundary></ProtectedRoute>} />
            <Route path="/ad-test" element={<AdTestPage />} />
            <Route path="/recommendation-test" element={<ProtectedRoute><PageErrorBoundary><LazyRecommendationTest /></PageErrorBoundary></ProtectedRoute>} />
            <Route path="/credit-store" element={<ProtectedRoute><PageErrorBoundary><LazyCreditStore /></PageErrorBoundary></ProtectedRoute>} />
            <Route path="/payment-callback" element={<ProtectedRoute><PageErrorBoundary><LazyPaymentCallback /></PageErrorBoundary></ProtectedRoute>} />
            <Route path="/pricing" element={<LazyPricing />} />
            
            {/* Centralized redirects from lib/redirects.ts */}
            {Object.entries(REDIRECTS).map(([from, to]) => (
              <Route key={from} path={from} element={<Navigate to={to} replace />} />
            ))}
            
            <Route path="*" element={<NotFound />} />
        </Routes>
      </ImprovedErrorBoundary>
    </>
  );
};

const App: React.FC = () => {
  // Monitor service worker for updates (doesn't need router)
  useServiceWorkerUpdate();

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AdPreferencesProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AdPreferencesProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
