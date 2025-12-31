import { ReactNode, Component, ErrorInfo } from 'react';
import { PersistentAdBanner } from './PersistentAdBanner';
import { PersistentAdSidebar } from './PersistentAdSidebar';
import { LazyAdLoader } from './LazyAdLoader';
import { useSubscription } from '@/hooks/useSubscription';
import { useIsMobile } from '@/hooks/use-mobile';
import { AD_DISPLAY_RULES, AD_DENSITY_RULES, ENABLE_AMAZON_ADS } from '@/lib/adConfig';

// Error boundary for ads to prevent crashes
class AdErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('Ad component error caught:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return null; // Silently fail - don't show broken ads
    }
    return this.props.children;
  }
}

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
  // ✅ إذا كانت الإعلانات معطلة: لا تعرض أي إعلانات
  if (!ENABLE_AMAZON_ADS) {
    return <>{children}</>;
  }

  const { subscription } = useSubscription();
  const isMobile = useIsMobile();
  
  // Check if user is on free plan
  const isFreePlan = !subscription || 
    !subscription.plan || 
    subscription.status !== 'active';

  // Paid subscribers: no ads
  if (!isFreePlan) {
    return <>{children}</>;
  }

  // Apply AdSense-compliant ad density rules based on device
  const getAdDisplayRules = () => {
    if (isMobile) {
      return AD_DISPLAY_RULES.mobile;
    } else if (typeof window !== 'undefined' && window.innerWidth < 1024) { // tablet
      return AD_DISPLAY_RULES.tablet;
    } else { // desktop
      return AD_DISPLAY_RULES.desktop;
    }
  };

  const adRules = getAdDisplayRules();
  
  // Free users: apply density rules
  const finalShowTopBanner = showTopBanner && adRules.showTopBanner;
  const finalShowSidebar = showSidebar && adRules.showSidebar;
  const finalShowBottomBanner = showBottomBanner && adRules.showBottomBanner;

  return (
    <div className={`unified-ad-layout ${className}`}>
      {/* Top Banner Ad - Only shown based on device rules */}
      {finalShowTopBanner && (
        <AdErrorBoundary>
          <LazyAdLoader minViewportScroll={AD_DENSITY_RULES.minViewportBeforeFirstAd} minHeight={90}>
            <div className="mb-6 animate-fade-in">
              <PersistentAdBanner 
                placement={`${placement}_top`}
                className="rounded-lg"
              />
            </div>
          </LazyAdLoader>
        </AdErrorBoundary>
      )}

      {/* Main Content with Sidebar */}
      <div className="flex gap-6 relative">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0" style={{ minHeight: `${AD_DENSITY_RULES.minContentBetweenAds}px` }}>
          {children}
        </div>

        {/* Sidebar Ad - Desktop only (1024px+) - 3 إعلانات 300x250 */}
        {finalShowSidebar && (
          <aside className="hidden lg:block w-[320px] flex-shrink-0">
            <AdErrorBoundary>
              <LazyAdLoader minViewportScroll={0.2} minHeight={250}>
                <div className="sticky top-20 space-y-4 max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-thin">
                  <PersistentAdSidebar className="animate-fade-in" />
                </div>
              </LazyAdLoader>
            </AdErrorBoundary>
          </aside>
        )}
      </div>

      {/* Bottom Banner Ad - Mobile/Tablet only */}
      {finalShowBottomBanner && (
        <AdErrorBoundary>
          <LazyAdLoader minViewportScroll={0.5} minHeight={100}>
            <div className="fixed bottom-20 left-0 right-0 z-40 px-4 lg:hidden animate-slide-up" 
                 style={{ marginTop: `${AD_DENSITY_RULES.minContentBetweenAds / 2}px` }}>
              <PersistentAdBanner 
                placement={`${placement}_bottom`}
                className="shadow-lg rounded-lg"
              />
            </div>
          </LazyAdLoader>
        </AdErrorBoundary>
      )}
    </div>
  );
};
