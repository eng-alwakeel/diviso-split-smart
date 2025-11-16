import React, { useEffect, useState } from 'react';
import { ContextualAdBanner } from './ContextualAdBanner';
import { SmartProductRecommendations } from './SmartProductRecommendations';
import { ProductGridAd } from './ProductGridAd';
import { ProductCarouselAd } from './ProductCarouselAd';
import { useAdTracking } from '@/hooks/useAdTracking';
import { useSmartAdLearning } from '@/hooks/useSmartAdLearning';
import { useUserBehavior } from '@/hooks/useUserBehavior';
import { useIsMobile } from '@/hooks/use-mobile';
import { ENABLE_AMAZON_ADS } from '@/lib/adConfig';

interface SmartAdManagerProps {
  context: {
    type: 'expense' | 'group' | 'dashboard' | 'category';
    category?: string;
    groupType?: string;
    amount?: number;
    location?: string;
  };
  placement: string;
  maxAds?: number;
  className?: string;
  compact?: boolean;
  layout?: 'banner' | 'grid' | 'carousel' | 'recommendations' | 'auto';
}

export const SmartAdManager: React.FC<SmartAdManagerProps> = ({
  context,
  placement,
  maxAds = 1,
  className = '',
  compact = false,
  layout = 'auto'
}) => {
  // ✅ إذا كانت الإعلانات معطلة: لا تعرض شيء
  if (!ENABLE_AMAZON_ADS) {
    return null;
  }

  const [adType, setAdType] = useState<'banner' | 'grid' | 'carousel' | 'recommendations' | 'none'>('none');
  const isMobile = useIsMobile();
  const { shouldShowAds, getTargetedCategories, trackAdImpression } = useAdTracking();
  const { 
    shouldShowAdInContext, 
    getOptimalAdTiming, 
    recordAdInteraction,
    adProfile 
  } = useSmartAdLearning();
  const { behavior } = useUserBehavior();

  useEffect(() => {
    determineOptimalAdType();
  }, [context, behavior, adProfile]);

  const determineOptimalAdType = () => {
    // Smart decision making for ad type
    if (!shouldShowAds()) {
      setAdType('none');
      return;
    }

    // Check timing optimization
    if (!getOptimalAdTiming()) {
      setAdType('none');
      return;
    }

    // Check context success
    if (!shouldShowAdInContext(placement)) {
      setAdType('none');
      return;
    }

    // If layout is specified and not 'auto', use it
    if (layout !== 'auto') {
      setAdType(layout);
      recordAdInteraction({
        ad_type: layout,
        ad_category: context.category || 'general',
        context: placement,
        interaction_type: 'view'
      });
      return;
    }

    // Auto-determine best ad type based on context, device, and user behavior
    let selectedType: 'banner' | 'grid' | 'carousel' | 'recommendations' = 'banner';

    if (context.type === 'dashboard') {
      // Dashboard: Grid for desktop, Carousel for mobile
      if (isMobile) {
        selectedType = 'carousel';
      } else if (behavior?.engagementLevel === 'high') {
        selectedType = 'grid'; // Grid layout for engaged users on desktop
      } else {
        selectedType = 'recommendations'; // Smart recommendations for others
      }
    } else if (context.type === 'expense' && context.category) {
      // Expense context: Recommendations or Grid
      if (behavior?.engagementLevel === 'high' && !isMobile) {
        selectedType = 'grid';
      } else {
        selectedType = 'recommendations';
      }
    } else if (context.type === 'group') {
      // Group context: Carousel for mobile, Banner for desktop
      selectedType = isMobile ? 'carousel' : 'banner';
    } else {
      // Default: Banner
      selectedType = 'banner';
    }

    setAdType(selectedType);

    // Track that we decided to show an ad
    recordAdInteraction({
      ad_type: selectedType,
      ad_category: context.category || 'general',
      context: placement,
      interaction_type: 'view'
    });
  };

  const handleAdInteraction = (type: 'click' | 'dismiss') => {
    recordAdInteraction({
      ad_type: adType,
      ad_category: context.category || 'general',
      context: placement,
      interaction_type: type
    });
  };

  if (adType === 'none') {
    return null;
  }

  // Smart ad rendering based on determined type
  if (adType === 'recommendations') {
    return (
      <div className={`smart-ad-container ${className}`}>
        <SmartProductRecommendations
          context={context}
          maxProducts={compact ? 2 : 3}
          compact={compact}
          showTitle={true}
          className="opacity-90 hover:opacity-100 transition-opacity"
        />
      </div>
    );
  }

  if (adType === 'grid') {
    return (
      <div className={`smart-ad-container ${className}`}>
        <ProductGridAd
          context={context}
          placement={placement}
          maxProducts={compact ? 2 : 4}
          className="opacity-90 hover:opacity-100 transition-opacity"
        />
      </div>
    );
  }

  if (adType === 'carousel') {
    return (
      <div className={`smart-ad-container ${className}`}>
        <ProductCarouselAd
          context={context}
          placement={placement}
          maxProducts={6}
          autoRotate={true}
          className="opacity-90 hover:opacity-100 transition-opacity"
        />
      </div>
    );
  }

  // Default: Banner
  return (
    <div className={`smart-ad-container ${className}`}>
      <ContextualAdBanner
        context={context}
        placement={placement}
        maxAds={maxAds}
        className="opacity-90 hover:opacity-100 transition-opacity"
      />
    </div>
  );
};

export default SmartAdManager;