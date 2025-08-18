import { lazy, Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load heavy components for better performance
export const LazyGroupDetails = lazy(() => import('@/pages/GroupDetails'));
export const LazyMyExpenses = lazy(() => import('@/pages/MyExpenses'));
export const LazyAddExpense = lazy(() => import('@/pages/AddExpense'));
export const LazyCreateGroup = lazy(() => import('@/pages/CreateGroup'));
export const LazyAdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
export const LazySettings = lazy(() => import('@/pages/Settings'));
export const LazyPricing = lazy(() => import('@/pages/Pricing'));
export const LazyNotifications = lazy(() => import('@/pages/Notifications'));

// Loading skeleton component
const ComponentSkeleton = () => (
  <div className="min-h-screen bg-background p-6">
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
      <Skeleton className="h-64" />
    </div>
  </div>
);

// HOC for consistent loading states
export const withLazyLoading = (Component: React.ComponentType<any>) => {
  return (props: any) => (
    <Suspense fallback={<ComponentSkeleton />}>
      <Component {...props} />
    </Suspense>
  );
};