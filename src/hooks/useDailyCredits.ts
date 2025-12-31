import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface DailyCreditsState {
  canClaim: boolean;
  lastClaimedAt: Date | null;
  nextClaimAt: Date | null;
  hoursUntilNext: number;
  dailyAmount: number;
}

export function useDailyCredits() {
  const [state, setState] = useState<DailyCreditsState>({
    canClaim: true,
    lastClaimedAt: null,
    nextClaimAt: null,
    hoursUntilNext: 0,
    dailyAmount: 5
  });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const checkDailyStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todayCredits } = await supabase
        .from('usage_credits')
        .select('created_at')
        .eq('user_id', user.id)
        .eq('source', 'daily')
        .gte('created_at', today.toISOString())
        .limit(1);

      const alreadyClaimed = todayCredits && todayCredits.length > 0;
      
      setState({
        canClaim: !alreadyClaimed,
        lastClaimedAt: todayCredits?.[0]?.created_at ? new Date(todayCredits[0].created_at) : null,
        nextClaimAt: alreadyClaimed ? new Date(today.getTime() + 24 * 60 * 60 * 1000) : null,
        hoursUntilNext: alreadyClaimed ? Math.max(0, 24 - new Date().getHours()) : 0,
        dailyAmount: 5
      });
    } catch (error) {
      console.error('Error checking daily status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const claimDailyCredits = useCallback(async (): Promise<boolean> => {
    if (!state.canClaim) {
      toast({ title: 'لقد حصلت على نقاطك اليوم' });
      return false;
    }

    setClaiming(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('grant_daily_credits', {
        p_user_id: user.id
      });

      if (error) {
        toast({ title: 'فشل الحصول على النقاط', variant: 'destructive' });
        return false;
      }

      // RPC يرجع JSONB كـ object فيه success
      const result = data as { success?: boolean; reason?: string } | null;
      if (result?.success === true) {
        toast({ 
          title: `🎁 حصلت على ${state.dailyAmount} نقاط!`,
          description: 'نقاطك اليومية متاحة الآن'
        });
        await checkDailyStatus();
        queryClient.invalidateQueries({ queryKey: ['usage-credits'] });
        return true;
      }

      // معالجة حالة "سبق الحصول عليها اليوم"
      if (result?.reason === 'already_claimed_today') {
        toast({ title: 'لقد حصلت على نقاطك اليوم بالفعل' });
      }

      return false;
    } catch (error) {
      console.error('Error in claimDailyCredits:', error);
      return false;
    } finally {
      setClaiming(false);
    }
  }, [state.canClaim, state.dailyAmount, checkDailyStatus, queryClient, toast]);

  useEffect(() => {
    checkDailyStatus();
  }, [checkDailyStatus]);

  return {
    ...state,
    loading,
    claiming,
    checkDailyStatus,
    claimDailyCredits
  };
}
