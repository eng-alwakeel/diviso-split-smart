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
        <div className="mb-6 animate-fade-in">
          <PersistentAdBanner 
            placement={`${placement}_top`}
            className="sticky top-[72px] z-40 backdrop-blur-sm"
          />
        </div>
      )}

      {/* Main Content with Sidebar */}
      <div className="flex gap-6 relative">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {children}
        </div>

        {/* Sidebar Ad - Visible on larger screens */}
        {showSidebar && (
          <aside className="hidden xl:block w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              <PersistentAdSidebar className="animate-fade-in" />
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Banner Ad - For mobile devices */}
      {showBottomBanner && (
        <div className="mt-6 lg:hidden animate-fade-in">
          <PersistentAdBanner 
            placement={`${placement}_bottom`}
            className="sticky bottom-20 z-40 backdrop-blur-sm"
          />
        </div>
      )}
    </div>
  );
};
