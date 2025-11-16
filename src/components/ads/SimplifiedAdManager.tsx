import React, { useState, useEffect } from 'react';
import { SimpleAdBanner } from './SimpleAdBanner';
import { DebugAdPanel } from './DebugAdPanel';
import { useSubscription } from '@/hooks/useSubscription';
import { ENABLE_AMAZON_ADS } from '@/lib/adConfig';

interface SimplifiedAdManagerProps {
  placement: string;
  className?: string;
  showDebug?: boolean;
}

export const SimplifiedAdManager: React.FC<SimplifiedAdManagerProps> = ({
  placement,
  className = '',
  showDebug = false
}) => {
  // ✅ إذا كانت الإعلانات معطلة: لا تعرض شيء
  if (!ENABLE_AMAZON_ADS) {
    return null;
  }

  const [showAd, setShowAd] = useState(false);
  const [adCount, setAdCount] = useState(0);
  const { subscription } = useSubscription();

  useEffect(() => {
    checkAndShowAd();
  }, []);

  const checkAndShowAd = () => {
    console.log('🎯 SimplifiedAdManager: Checking ad display conditions', {
      placement,
      subscription: subscription?.plan,
      status: subscription?.status,
      adCount
    });

    // Simple logic: Show ads to free users and trial users
    const isFreePlan = !subscription || !subscription.plan;
    const isTrial = subscription?.status === 'trialing';
    const shouldShow = (isFreePlan || isTrial) && adCount < 3;

    console.log('🎯 SimplifiedAdManager: Ad decision', {
      isFreePlan,
      isTrial, 
      shouldShow,
      currentAdCount: adCount
    });

    setShowAd(shouldShow);
  };

  const handleAdDismiss = () => {
    console.log('🎯 SimplifiedAdManager: Ad dismissed by user');
    setShowAd(false);
    setAdCount(prev => prev + 1);
    
    // Show again after 30 seconds (for demo purposes)
    setTimeout(() => {
      if (adCount < 2) {
        console.log('🎯 SimplifiedAdManager: Re-showing ad after timeout');
        setShowAd(true);
      }
    }, 30000);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {showDebug && <DebugAdPanel />}
      
      {showAd && (
        <div>
          <SimpleAdBanner 
            onDismiss={handleAdDismiss}
            className="animate-in fade-in-50 duration-500"
          />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            الإعلانات تساعدنا في تطوير التطبيق وتقديم خدمات أفضل
          </p>
        </div>
      )}
    </div>
  );
};