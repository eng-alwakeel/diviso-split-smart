import React, { useEffect, useState } from 'react';
import { ContextualAdBanner } from './ContextualAdBanner';
import { SmartProductRecommendations } from './SmartProductRecommendations';
import { useAdTracking } from '@/hooks/useAdTracking';
import { useSmartAdLearning } from '@/hooks/useSmartAdLearning';
import { useUserBehavior } from '@/hooks/useUserBehavior';

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
}

export const SmartAdManager: React.FC<SmartAdManagerProps> = ({
  context,
  placement,
  maxAds = 1,
  className = '',
  compact = false
}) => {
  const [adType, setAdType] = useState<'banner' | 'recommendations' | 'none'>('none');
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

    // Determine best ad type based on context and user behavior
    if (context.type === 'dashboard') {
      // Dashboard gets personalized recommendations for engaged users
      if (behavior?.engagementLevel === 'high') {
        setAdType('recommendations');
      } else if (behavior?.engagementLevel === 'medium') {
        setAdType(Math.random() > 0.5 ? 'banner' : 'recommendations');
      } else {
        setAdType('banner'); // Simple banner for low engagement
      }
    } else if (context.type === 'expense' && context.category) {
      // Expense context gets targeted recommendations
      setAdType('recommendations');
    } else if (context.type === 'group') {
      // Group context gets banners
      setAdType('banner');
    } else {
      setAdType('banner');
    }

    // Track that we decided to show an ad
    recordAdInteraction({
      ad_type: adType,
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