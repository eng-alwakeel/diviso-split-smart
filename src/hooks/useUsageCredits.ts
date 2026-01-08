import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

// تكاليف العمليات بالنقاط - Updated per Final Spec
export const CREDIT_COSTS = {
  // العمليات المجانية دائماً (لا gating)
  add_expense: { type: 'add_expense', cost: 0, nameAr: 'إضافة مصروف', nameEn: 'Add Expense', gated: false },
  split_expense: { type: 'split_expense', cost: 0, nameAr: 'تقسيم مصاريف', nameEn: 'Split Expense', gated: false },
  view_data: { type: 'view_data', cost: 0, nameAr: 'عرض البيانات', nameEn: 'View Data', gated: false },
  
  // العمليات المدفوعة والمقفلة عند UC = 0
  ocr_scan: { type: 'ocr_scan', cost: 1, nameAr: 'مسح إيصال', nameEn: 'Receipt Scan', gated: true },
  smart_category: { type: 'smart_category', cost: 1, nameAr: 'تصنيف ذكي', nameEn: 'Smart Category', gated: true },
  recommendation: { type: 'recommendation', cost: 1, nameAr: 'توصية ذكية', nameEn: 'Smart Recommendation', gated: true },
  export_pdf: { type: 'export_pdf', cost: 1, nameAr: 'تصدير PDF', nameEn: 'PDF Export', gated: true },
  export_excel: { type: 'export_excel', cost: 1, nameAr: 'تصدير Excel', nameEn: 'Excel Export', gated: true },
  advanced_report: { type: 'advanced_report', cost: 2, nameAr: 'تقرير متقدم', nameEn: 'Advanced Report', gated: true },
  settlement: { type: 'settlement', cost: 3, nameAr: 'تسوية', nameEn: 'Settlement', gated: true },
  create_group: { type: 'create_group', cost: 5, nameAr: 'إنشاء مجموعة', nameEn: 'Create Group', gated: true }
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
  hasAdToken?: boolean;
}

interface DeductResult {
  success: boolean;
  method: 'ad_token' | 'credits_deducted' | 'failed';
  tokenId?: string;
  error?: string;
}

interface ReferralLimits {
  used: number;
  max: number;
  remaining: number;
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

  // التحقق من وجود Ad Token صالح
  const checkAdToken = useCallback(async (actionType: CreditActionType): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('check_valid_ad_token', {
        p_user_id: user.id,
        p_action_type: actionType
      });

      if (error) {
        console.error('Error checking ad token:', error);
        return false;
      }

      const result = data as { has_token?: boolean };
      return result?.has_token ?? false;
    } catch (error) {
      console.error('Error in checkAdToken:', error);
      return false;
    }
  }, []);

  // التحقق من إمكانية تنفيذ عملية مع الـ gating الجديد + Ad Token
  const checkCredits = useCallback(async (actionType: CreditActionType): Promise<CreditCheckResult> => {
    const action = CREDIT_COSTS[actionType];
    const requiredCredits = action.cost;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { canPerform: false, remainingCredits: 0, requiredCredits, shortfall: requiredCredits, blocked: true };
      }

      // Check for Ad Token first
      const hasAdToken = await checkAdToken(actionType);
      if (hasAdToken) {
        return {
          canPerform: true,
          remainingCredits: balance.totalAvailable,
          requiredCredits,
          shortfall: 0,
          blocked: false,
          hasAdToken: true
        };
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
        blocked: isBlocked,
        hasAdToken: false
      };
    } catch (error) {
      console.error('Error checking credits:', error);
      return { canPerform: false, remainingCredits: 0, requiredCredits, shortfall: requiredCredits, blocked: true };
    }
  }, [checkAdToken, balance.totalAvailable]);

  // التحقق السريع إذا كان المستخدم محجوب (UC = 0)
  const isBlocked = useCallback(async (actionType: CreditActionType): Promise<boolean> => {
    const action = CREDIT_COSTS[actionType];
    if (!action.gated) return false;
    
    // Check for Ad Token
    const hasToken = await checkAdToken(actionType);
    if (hasToken) return false;
    
    return balance.totalAvailable === 0;
  }, [balance.totalAvailable, checkAdToken]);

  // استهلاك النقاط باستخدام FEFO + Ad Token
  const consumeCredits = useCallback(async (actionType: CreditActionType): Promise<boolean> => {
    const action = CREDIT_COSTS[actionType];
    
    // لا تستهلك نقاط للعمليات المجانية
    if (action.cost === 0) return true;
    
    setConsuming(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Use the new FEFO function that checks Ad Token first
      const { data, error } = await supabase.rpc('deduct_credits_fefo', {
        p_user_id: user.id,
        p_amount: action.cost,
        p_action_type: actionType
      });

      if (error) {
        console.error('Error consuming credits:', error);
        return false;
      }

      const result = data as unknown as DeductResult | null;
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

  // استهلاك مع معلومات تفصيلية عن الطريقة
  const consumeCreditsDetailed = useCallback(async (actionType: CreditActionType): Promise<DeductResult> => {
    const action = CREDIT_COSTS[actionType];
    
    // لا تستهلك نقاط للعمليات المجانية
    if (action.cost === 0) {
      return { success: true, method: 'credits_deducted' };
    }
    
    setConsuming(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, method: 'failed', error: 'not_authenticated' };
      }

      const { data, error } = await supabase.rpc('deduct_credits_fefo', {
        p_user_id: user.id,
        p_amount: action.cost,
        p_action_type: actionType
      });

      if (error) {
        console.error('Error consuming credits:', error);
        return { success: false, method: 'failed', error: error.message };
      }

      const result = data as unknown as DeductResult | null;
      
      if (result?.success) {
        await fetchBalance();
        queryClient.invalidateQueries({ queryKey: ['usage-credits'] });
      }

      return result || { success: false, method: 'failed', error: 'unknown_error' };
    } catch (error) {
      console.error('Error in consumeCreditsDetailed:', error);
      return { success: false, method: 'failed', error: 'exception' };
    } finally {
      setConsuming(false);
    }
  }, [fetchBalance, queryClient]);

  // التحقق عبر can_perform_action
  const canPerformAction = useCallback(async (actionType: CreditActionType): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check for Ad Token first
      const hasToken = await checkAdToken(actionType);
      if (hasToken) return true;

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
  }, [checkAdToken]);

  // جلب حدود الإحالة للدورة الحالية
  const getReferralLimits = useCallback(async (): Promise<ReferralLimits> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { used: 0, max: 5, remaining: 5 };

      const { data, error } = await supabase.rpc('get_referral_limits', {
        p_user_id: user.id
      });

      if (error) throw error;

      const result = data as unknown as ReferralLimits;
      return {
        used: result?.used ?? 0,
        max: result?.max ?? 5,
        remaining: result?.remaining ?? 5
      };
    } catch (error) {
      console.error('Error fetching referral limits:', error);
      return { used: 0, max: 5, remaining: 5 };
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
    consumeCreditsDetailed,
    canPerformAction,
    getConsumptionHistory,
    getActionCost,
    isBlocked,
    checkAdToken,
    getReferralLimits,
    CREDIT_COSTS
  };
}
