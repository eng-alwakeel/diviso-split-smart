import { ReactNode } from 'react';
import { PersistentAdBanner } from './PersistentAdBanner';
import { PersistentAdSidebar } from './PersistentAdSidebar';
import { useSubscription } from '@/hooks/useSubscription';
import { useIsMobile } from '@/hooks/use-mobile';
import { AD_DISPLAY_RULES } from '@/lib/adConfig';

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
  showSidebar = false,
  showBottomBanner = false,
  className = ""
}: UnifiedAdLayoutProps) => {
  const { subscription } = useSubscription();
  const isMobile = useIsMobile();
  
  // Only show ads for free users (no subscription or not active)
  const shouldShowAds = !subscription || 
    subscription.status !== 'active' || 
    !subscription.plan;

  // Apply AdSense-compliant ad density rules based on device
  const getAdDisplayRules = () => {
    if (isMobile) {
      return AD_DISPLAY_RULES.mobile;
    } else if (window.innerWidth < 1024) { // tablet
      return AD_DISPLAY_RULES.tablet;
    } else { // desktop
      return AD_DISPLAY_RULES.desktop;
    }
  };

  const adRules = getAdDisplayRules();
  
  // Override passed props with density rules
  const finalShowTopBanner = shouldShowAds && showTopBanner && adRules.showTopBanner;
  const finalShowSidebar = shouldShowAds && showSidebar && adRules.showSidebar;
  const finalShowBottomBanner = shouldShowAds && showBottomBanner && adRules.showBottomBanner;

  if (!shouldShowAds) {
    return <>{children}</>;
  }

  return (
    <div className={`unified-ad-layout ${className}`}>
      {/* Top Banner Ad - Only shown based on device rules */}
      {finalShowTopBanner && (
        <div className="mb-6 animate-fade-in">
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

        {/* Sidebar Ad - Desktop only (1024px+) */}
        {finalShowSidebar && (
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <PersistentAdSidebar className="animate-fade-in" />
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Banner Ad - Mobile/Tablet only */}
      {finalShowBottomBanner && (
        <div className="fixed bottom-20 left-0 right-0 z-40 px-4 lg:hidden animate-slide-up">
          <PersistentAdBanner 
            placement={`${placement}_bottom`}
            className="shadow-lg rounded-lg"
          />
        </div>
      )}
    </div>
  );
};
