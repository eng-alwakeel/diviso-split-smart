import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

// تكاليف العمليات بالنقاط
export const CREDIT_COSTS = {
  ocr_scan: { type: 'ocr_scan', cost: 1, nameAr: 'مسح إيصال', nameEn: 'Receipt Scan' },
  smart_category: { type: 'smart_category', cost: 1, nameAr: 'تصنيف ذكي', nameEn: 'Smart Category' },
  recommendation: { type: 'recommendation', cost: 1, nameAr: 'توصية ذكية', nameEn: 'Smart Recommendation' },
  advanced_report: { type: 'advanced_report', cost: 2, nameAr: 'تقرير متقدم', nameEn: 'Advanced Report' },
  export_pdf: { type: 'export_pdf', cost: 1, nameAr: 'تصدير PDF', nameEn: 'PDF Export' },
  create_group: { type: 'create_group', cost: 5, nameAr: 'إنشاء مجموعة', nameEn: 'Create Group' },
  settlement: { type: 'settlement', cost: 3, nameAr: 'تسوية', nameEn: 'Settlement' }
} as const;

export type CreditActionType = keyof typeof CREDIT_COSTS;

interface UsageCreditBalance {
  totalAvailable: number;
  expiringSoon: number;
  expiringSoonDate: Date | null;
}

interface CreditCheckResult {
  canPerform: boolean;
  remainingCredits: number;
  requiredCredits: number;
  shortfall: number;
}

export function useUsageCredits() {
  const [balance, setBalance] = useState<UsageCreditBalance>({
    totalAvailable: 0,
    expiringSoon: 0,
    expiringSoonDate: null
  });
  const [loading, setLoading] = useState(true);
  const [consuming, setConsuming] = useState(false);
  const queryClient = useQueryClient();

  // جلب الرصيد الحالي
  const fetchBalance = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // استخدام الـ RPC function للحصول على الرصيد
      const { data, error } = await supabase.rpc('get_available_credits', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching credits:', error);
        return;
      }

      // RPC يرجع TABLE كـ array أو object واحد
      const row = Array.isArray(data) ? data[0] : data;
      
      setBalance({
        totalAvailable: row?.total_available ?? 0,
        expiringSoon: row?.expiring_soon ?? 0,
        expiringSoonDate: row?.expiring_soon_date ? new Date(row.expiring_soon_date) : null
      });
    } catch (error) {
      console.error('Error in fetchBalance:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // التحقق من إمكانية تنفيذ عملية
  const checkCredits = useCallback(async (actionType: CreditActionType): Promise<CreditCheckResult> => {
    const action = CREDIT_COSTS[actionType];
    const requiredCredits = action.cost;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { canPerform: false, remainingCredits: 0, requiredCredits, shortfall: requiredCredits };
      }

      const { data, error } = await supabase.rpc('get_available_credits', {
        p_user_id: user.id
      });

      if (error) throw error;

      // RPC يرجع TABLE كـ array أو object واحد
      const row = Array.isArray(data) ? data[0] : data;
      const availableCredits = row?.total_available ?? 0;
      const canPerform = availableCredits >= requiredCredits;

      return {
        canPerform,
        remainingCredits: availableCredits,
        requiredCredits,
        shortfall: canPerform ? 0 : requiredCredits - availableCredits
      };
    } catch (error) {
      console.error('Error checking credits:', error);
      return { canPerform: false, remainingCredits: 0, requiredCredits, shortfall: requiredCredits };
    }
  }, []);

  // استهلاك النقاط
  const consumeCredits = useCallback(async (actionType: CreditActionType): Promise<boolean> => {
    const action = CREDIT_COSTS[actionType];
    setConsuming(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('consume_credits', {
        p_user_id: user.id,
        p_amount: action.cost,
        p_action_type: actionType
      });

      if (error) {
        console.error('Error consuming credits:', error);
        return false;
      }

      // RPC يرجع JSONB كـ object فيه success
      const result = data as { success?: boolean } | null;
      const success = result?.success === true;
      if (success) {
        await fetchBalance();
        queryClient.invalidateQueries({ queryKey: ['usage-credits'] });
      }

      return success;
    } catch (error) {
      console.error('Error in consumeCredits:', error);
      return false;
    } finally {
      setConsuming(false);
    }
  }, [fetchBalance, queryClient]);

  // التحقق عبر can_perform_action
  const canPerformAction = useCallback(async (actionType: CreditActionType): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const action = CREDIT_COSTS[actionType];

      const { data, error } = await supabase.rpc('can_perform_action', {
        p_user_id: user.id,
        p_action_type: actionType
      });

      if (error) throw error;
      return data === true;
    } catch (error) {
      console.error('Error checking can_perform_action:', error);
      return false;
    }
  }, []);

  // جلب سجل الاستهلاك
  const getConsumptionHistory = useCallback(async (limit = 20) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('credit_consumption_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching consumption history:', error);
      return [];
    }
  }, []);

  // الحصول على تكلفة عملية
  const getActionCost = useCallback((actionType: CreditActionType) => {
    return CREDIT_COSTS[actionType];
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    loading,
    consuming,
    fetchBalance,
    checkCredits,
    consumeCredits,
    canPerformAction,
    getConsumptionHistory,
    getActionCost,
    CREDIT_COSTS
  };
}
