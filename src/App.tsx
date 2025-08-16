import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CreateGroup from "./pages/CreateGroup";
import AddExpense from "./pages/AddExpense";
import ReferralCenter from "./pages/ReferralCenter";
import GroupDetails from "./pages/GroupDetails";
import FinancialPlan from "./pages/FinancialPlan";
import MyExpenses from "./pages/MyExpenses";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import InviteRoute from "./pages/InviteRoute";
import ReferralSignup from "./pages/ReferralSignup";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Index />} />
          <Route path="/i/:code" element={<InviteRoute />} />
          <Route path="/join/:referralCode" element={<ReferralSignup />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/create-group" element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
          <Route path="/group/:id" element={<ProtectedRoute><GroupDetails /></ProtectedRoute>} />
          <Route path="/add-expense" element={<ProtectedRoute><AddExpense /></ProtectedRoute>} />
          <Route path="/my-expenses" element={<ProtectedRoute><MyExpenses /></ProtectedRoute>} />
          <Route path="/financial-plan" element={<ProtectedRoute><FinancialPlan /></ProtectedRoute>} />
          <Route path="/referral" element={<ProtectedRoute><ReferralCenter /></ProtectedRoute>} />
          <Route path="/referral-center" element={<Navigate to="/referral" replace />} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
