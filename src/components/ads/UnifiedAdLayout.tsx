import { ReactNode } from 'react';
import { PersistentAdBanner } from './PersistentAdBanner';
import { PersistentAdSidebar } from './PersistentAdSidebar';
import { useSubscription } from '@/hooks/useSubscription';

interface UnifiedAdLayoutProps {
  children: ReactNode;
  placement: string;
  showTopBanner?: boolean;
  showSidebar?: boolean;
  showBottomBanner?: boolean;
  className?: string;
}

export const UnifiedAdLayout = ({
  children,
  placement,
  showTopBanner = true,
  showSidebar = true,
  showBottomBanner = false,
  className = ""
}: UnifiedAdLayoutProps) => {
  const { subscription } = useSubscription();
  
  // Only show ads for free users (no subscription or not active)
  const shouldShowAds = !subscription || 
    subscription.status !== 'active' || 
    !subscription.plan;

  if (!shouldShowAds) {
    return <>{children}</>;
  }

  return (
    <div className={`unified-ad-layout ${className}`}>
      {/* Top Banner Ad - Fixed position for all pages */}
      {showTopBanner && (
        <div className="mb-4 animate-fade-in">
          <PersistentAdBanner 
            placement={`${placement}_top`}
            className="rounded-lg"
          />
        </div>
      )}

      {/* Main Content with Sidebar */}
      <div className="flex gap-6 relative">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {children}
        </div>

        {/* Sidebar Ad - Visible on larger screens (lg+ instead of xl+) */}
        {showSidebar && (
          <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              <PersistentAdSidebar className="animate-fade-in" />
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Banner Ad - Fixed at bottom for mobile/tablet */}
      {showBottomBanner && (
        <div className="fixed bottom-16 left-0 right-0 z-40 px-4 lg:hidden animate-slide-up">
          <PersistentAdBanner 
            placement={`${placement}_bottom`}
            className="shadow-lg rounded-lg backdrop-blur-sm"
          />
        </div>
      )}
    </div>
  );
};
