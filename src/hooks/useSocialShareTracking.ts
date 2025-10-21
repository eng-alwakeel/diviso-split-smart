import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { detectBrowser, isMobileDevice, type SocialPlatform } from '@/lib/socialShareConfig';

export const useSocialShareTracking = () => {
  const trackShare = async (
    platform: SocialPlatform,
    referralCode: string,
    userId?: string
  ) => {
    if (!userId) return;
    
    try {
      const { error } = await supabase
        .from('social_share_analytics' as any)
        .insert({
          user_id: userId,
          referral_code: referralCode,
          platform,
          action: 'shared',
          device_type: isMobileDevice() ? 'mobile' : 'desktop',
          browser: detectBrowser()
        });

      if (error) {
        console.error('Error tracking share:', error);
      }
    } catch (error) {
      console.error('Failed to track share:', error);
    }
  };

  const trackConversion = async (
    referralCode: string,
    platform: string
  ) => {
    try {
      // Update the analytics record to mark conversion
      const { error } = await supabase
        .from('social_share_analytics' as any)
        .update({
          action: 'converted',
          converted_at: new Date().toISOString()
        })
        .eq('referral_code', referralCode)
        .eq('platform', platform)
        .eq('action', 'shared')
        .order('shared_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error tracking conversion:', error);
      }
    } catch (error) {
      console.error('Failed to track conversion:', error);
    }
  };

  const getShareStats = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('social_share_analytics' as any)
        .select('platform, action, shared_at, converted_at')
        .eq('user_id', userId)
        .order('shared_at', { ascending: false });

      if (error) throw error;

      // Calculate stats by platform
      const statsByPlatform = (data as any[])?.reduce((acc: any, record: any) => {
        const platform = record.platform;
        if (!acc[platform]) {
          acc[platform] = {
            total_shares: 0,
            conversions: 0,
            conversion_rate: 0
          };
        }
        
        acc[platform].total_shares++;
        if (record.action === 'converted') {
          acc[platform].conversions++;
        }
        
        acc[platform].conversion_rate = 
          (acc[platform].conversions / acc[platform].total_shares) * 100;
        
        return acc;
      }, {} as Record<string, { total_shares: number; conversions: number; conversion_rate: number }>);

      return statsByPlatform || {};
    } catch (error) {
      console.error('Error fetching share stats:', error);
      return {};
    }
  };

  return {
    trackShare,
    trackConversion,
    getShareStats
  };
};
