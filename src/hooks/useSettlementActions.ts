import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { useReferralProgress } from '@/hooks/useReferralProgress';

export const useSettlementActions = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation('groups');
  const { notifyMilestone } = useReferralProgress();

  const confirmSettlement = async (settlementId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('settlements')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: user.id
        })
        .eq('id', settlementId);

      if (error) throw error;

      // منح 20 نقطة للمُحيل عند أول تسوية
      await notifyMilestone('settlement');

      toast({
        title: t('settlements_tab.confirmed'),
        description: t('settlements_tab.confirmed_desc'),
      });

      return true;
    } catch (error: any) {
      console.error('Error confirming settlement:', error);
      toast({
        title: t('settlements_tab.confirm_failed'),
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const disputeSettlement = async (settlementId: string, reason?: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('settlements')
        .update({
          status: 'disputed',
          confirmed_at: new Date().toISOString(),
          confirmed_by: user.id
        })
        .eq('id', settlementId);

      if (error) throw error;

      toast({
        title: t('settlements_tab.disputed'),
        description: t('settlements_tab.disputed_desc'),
      });

      return true;
    } catch (error: any) {
      console.error('Error disputing settlement:', error);
      toast({
        title: t('settlements_tab.dispute_failed'),
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    confirmSettlement,
    disputeSettlement,
    loading
  };
};
