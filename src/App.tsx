import React, { lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ImprovedErrorBoundary } from "@/components/ImprovedErrorBoundary";
import { EnhancedPerformanceMonitor } from "@/components/performance/EnhancedPerformanceMonitor";
import { withLazyLoading } from "@/components/LazyComponents";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
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
const LazyAdminDashboard = withLazyLoading(lazy(() => import("./pages/AdminDashboard")));
const LazyAdminManagement = withLazyLoading(lazy(() => import("./pages/AdminManagement")));
const AdTestPage = withLazyLoading(lazy(() => import("./components/ads/AdTestPage")));
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster />
        <Sonner />
        <EnhancedPerformanceMonitor />
        <ImprovedErrorBoundary>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/verify" element={<EmailVerify />} />
            <Route path="/" element={<Index />} />
            <Route path="/i/:code" element={<InviteRoute />} />
            <Route path="/invite-phone/:token" element={<PhoneInviteRoute />} />
            <Route path="/join/:referralCode" element={<LazyReferralSignup />} />
            <Route path="/privacy-policy" element={<LazyPrivacyPolicy />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/create-group" element={<ProtectedRoute><LazyCreateGroup /></ProtectedRoute>} />
            <Route path="/group/:id" element={<ProtectedRoute><LazyGroupDetails /></ProtectedRoute>} />
            <Route path="/add-expense" element={<ProtectedRoute><LazyAddExpense /></ProtectedRoute>} />
            <Route path="/my-expenses" element={<ProtectedRoute><LazyMyExpenses /></ProtectedRoute>} />
            <Route path="/my-groups" element={<ProtectedRoute><LazyMyGroups /></ProtectedRoute>} />
            <Route path="/financial-plan" element={<ProtectedRoute><LazyFinancialPlan /></ProtectedRoute>} />
            <Route path="/create-unified-budget" element={<ProtectedRoute><LazyCreateUnifiedBudget /></ProtectedRoute>} />
            <Route path="/referral" element={<ProtectedRoute><LazyReferralCenter /></ProtectedRoute>} />
            <Route path="/referral-center" element={<Navigate to="/referral" replace />} />
            <Route path="/notifications" element={<ProtectedRoute><LazyNotifications /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><LazySettings /></ProtectedRoute>} />
            <Route path="/pricing-protected" element={<ProtectedRoute><LazyPricingProtected /></ProtectedRoute>} />
            <Route path="/admin-dashboard" element={<AdminProtectedRoute><LazyAdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin-management" element={<AdminProtectedRoute><LazyAdminManagement /></AdminProtectedRoute>} />
            <Route path="/ad-test" element={<AdTestPage />} />
            <Route path="/pricing" element={<LazyPricing />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ImprovedErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
