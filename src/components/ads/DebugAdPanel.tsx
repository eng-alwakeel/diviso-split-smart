import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdTracking } from '@/hooks/useAdTracking';
import { useSmartAdLearning } from '@/hooks/useSmartAdLearning';
import { useUserBehavior } from '@/hooks/useUserBehavior';
import { useSubscription } from '@/hooks/useSubscription';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export const DebugAdPanel: React.FC = () => {
  const { preferences, shouldShowAds, sessionAdCount, getTargetedCategories } = useAdTracking();
  const { adProfile, getOptimalAdTiming, shouldShowAdInContext } = useSmartAdLearning();
  const { behavior, loading: behaviorLoading } = useUserBehavior();
  const { subscription } = useSubscription();

  console.log('🎯 AdTracking Debug:', {
    preferences,
    shouldShowAds: shouldShowAds(),
    sessionAdCount,
    targetedCategories: getTargetedCategories()
  });

  console.log('🧠 AdLearning Debug:', {
    adProfile,
    optimalTiming: getOptimalAdTiming(),
    contextCheck: shouldShowAdInContext('dashboard_main')
  });

  console.log('👤 UserBehavior Debug:', {
    behavior,
    behaviorLoading
  });

  console.log('💳 Subscription Debug:', {
    subscription,
    plan: subscription?.plan,
    status: subscription?.status
  });

  const debugItems = [
    {
      name: 'shouldShowAds()',
      status: shouldShowAds(),
      details: `Session ads: ${sessionAdCount}, Show ads: ${preferences?.show_ads}`
    },
    {
      name: 'getOptimalAdTiming()',
      status: getOptimalAdTiming(),
      details: 'Timing optimization check'
    },
    {
      name: 'shouldShowAdInContext("dashboard_main")',
      status: shouldShowAdInContext('dashboard_main'),
      details: 'Context placement check'
    },
    {
      name: 'User Behavior',
      status: !behaviorLoading && behavior !== null,
      details: behavior ? `Type: ${behavior.userType}, Engagement: ${behavior.engagementLevel}` : 'Loading...'
    },
    {
      name: 'Ad Preferences',
      status: preferences !== null,
      details: preferences ? `Max per session: ${preferences.max_ads_per_session}` : 'No preferences'
    }
  ];

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          Ad System Debug Panel
          <Badge variant="secondary" className="text-xs">DEV</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {debugItems.map((item, index) => (
          <div key={index} className="flex items-center gap-3 text-sm">
            {item.status ? (
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <span className="font-medium">{item.name}</span>
              <p className="text-xs text-muted-foreground">{item.details}</p>
            </div>
          </div>
        ))}

        <div className="mt-4 pt-3 border-t border-orange-200">
          <p className="text-xs text-muted-foreground">
            Targeted Categories: {getTargetedCategories().join(', ') || 'None'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};