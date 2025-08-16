import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MemberSubscription {
  user_id: string;
  plan: 'free' | 'personal' | 'family' | 'lifetime';
}

export function useMemberSubscriptions(memberIds: string[]) {
  const [subscriptions, setSubscriptions] = useState<Record<string, MemberSubscription>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (memberIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('user_id, plan, status, expires_at')
          .in('user_id', memberIds);

        if (error) {
          console.error('Error fetching member subscriptions:', error);
          return;
        }

        const subscriptionMap: Record<string, MemberSubscription> = {};
        
        // Initialize all members as free plan
        memberIds.forEach(id => {
          subscriptionMap[id] = { user_id: id, plan: 'free' };
        });

        // Update with actual subscription data
        data?.forEach(sub => {
          if (sub.status === 'active' || 
              (sub.status === 'trialing' && new Date(sub.expires_at) > new Date())) {
            subscriptionMap[sub.user_id] = {
              user_id: sub.user_id,
              plan: sub.plan as 'personal' | 'family' | 'lifetime'
            };
          }
        });

        setSubscriptions(subscriptionMap);
      } catch (error) {
        console.error('Error fetching member subscriptions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [memberIds.join(',')]);

  return { subscriptions, loading };
}