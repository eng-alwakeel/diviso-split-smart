import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

// تكاليف العمليات بالنقاط مع نظام الـ gating الجديد
export const CREDIT_COSTS = {
  // العمليات المجانية لكن مقفلة عند UC = 0
  add_expense: { type: 'add_expense', cost: 0, nameAr: 'إضافة مصروف', nameEn: 'Add Expense', gated: true },
  
  // العمليات المدفوعة والمقفلة
  create_group: { type: 'create_group', cost: 5, nameAr: 'إنشاء مجموعة', nameEn: 'Create Group', gated: true },
  settlement: { type: 'settlement', cost: 3, nameAr: 'تسوية', nameEn: 'Settlement', gated: true },
  ocr_scan: { type: 'ocr_scan', cost: 1, nameAr: 'مسح إيصال', nameEn: 'Receipt Scan', gated: true },
  smart_category: { type: 'smart_category', cost: 1, nameAr: 'تصنيف ذكي', nameEn: 'Smart Category', gated: true },
  recommendation: { type: 'recommendation', cost: 1, nameAr: 'توصية ذكية', nameEn: 'Smart Recommendation', gated: true },
  advanced_report: { type: 'advanced_report', cost: 2, nameAr: 'تقرير متقدم', nameEn: 'Advanced Report', gated: true },
  export_pdf: { type: 'export_pdf', cost: 1, nameAr: 'تصدير PDF', nameEn: 'PDF Export', gated: true },
  
  // العمليات المسموحة دائماً
  view_data: { type: 'view_data', cost: 0, nameAr: 'عرض البيانات', nameEn: 'View Data', gated: false }
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
  blocked: boolean;
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

      const { data, error } = await supabase.rpc('get_available_credits', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching credits:', error);
        return;
      }

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

  // التحقق من إمكانية تنفيذ عملية مع الـ gating الجديد
  const checkCredits = useCallback(async (actionType: CreditActionType): Promise<CreditCheckResult> => {
    const action = CREDIT_COSTS[actionType];
    const requiredCredits = action.cost;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { canPerform: false, remainingCredits: 0, requiredCredits, shortfall: requiredCredits, blocked: true };
      }

      const { data, error } = await supabase.rpc('get_available_credits', {
        p_user_id: user.id
      });

      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      const availableCredits = row?.total_available ?? 0;
      
      // التحقق من الـ gating - إذا كانت العملية مقفلة وليس لديه نقاط
      const isBlocked = action.gated && availableCredits === 0;
      const canPerform = !isBlocked && availableCredits >= requiredCredits;

      return {
        canPerform,
        remainingCredits: availableCredits,
        requiredCredits,
        shortfall: canPerform ? 0 : Math.max(0, requiredCredits - availableCredits),
        blocked: isBlocked
      };
    } catch (error) {
      console.error('Error checking credits:', error);
      return { canPerform: false, remainingCredits: 0, requiredCredits, shortfall: requiredCredits, blocked: true };
    }
  }, []);

  // التحقق السريع إذا كان المستخدم محجوب (UC = 0)
  const isBlocked = useCallback(async (actionType: CreditActionType): Promise<boolean> => {
    const action = CREDIT_COSTS[actionType];
    if (!action.gated) return false;
    
    return balance.totalAvailable === 0;
  }, [balance.totalAvailable]);

  // استهلاك النقاط
  const consumeCredits = useCallback(async (actionType: CreditActionType): Promise<boolean> => {
    const action = CREDIT_COSTS[actionType];
    
    // لا تستهلك نقاط للعمليات المجانية
    if (action.cost === 0) return true;
    
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
    isBlocked,
    CREDIT_COSTS
  };
}
