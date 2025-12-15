import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

interface CoinBalance {
  coins: number;
  totalEarned: number;
  totalSpent: number;
}

interface CoinTransaction {
  id: string;
  amount: number;
  transactionType: 'earned' | 'spent';
  source: string;
  descriptionAr: string | null;
  createdAt: string;
}

interface StoreItem {
  id: string;
  name: string;
  nameAr: string;
  cost: number;
  featureType: string;
  durationDays: number;
  restrictions: Json;
  icon: string;
}

interface RpcResult {
  success: boolean;
  new_balance?: number;
  error?: string;
  current_balance?: number;
  required?: number;
  amount_added?: number;
  amount_spent?: number;
}

interface UnlockResult {
  success: boolean;
  unlock_id?: string;
  feature_type?: string;
  expires_at?: string;
}

// عناصر المتجر الثابتة
const STORE_ITEMS: StoreItem[] = [
  {
    id: 'ai_report',
    name: 'AI Report',
    nameAr: 'تقرير AI واحد',
    cost: 15,
    featureType: 'ai_insight',
    durationDays: 7,
    restrictions: { count: 1 },
    icon: 'Sparkles'
  },
  {
    id: 'analytics_3days',
    name: 'Advanced Analytics',
    nameAr: 'تحليلات متقدمة (3 أيام)',
    cost: 30,
    featureType: 'advanced_analytics',
    durationDays: 3,
    restrictions: { read_only: true },
    icon: 'BarChart'
  },
  {
    id: 'ocr_boost',
    name: 'OCR Boost',
    nameAr: 'رفع حد OCR ليوم',
    cost: 20,
    featureType: 'ocr_boost',
    durationDays: 1,
    restrictions: { boost_amount: 5 },
    icon: 'Camera'
  },
  {
    id: 'export_once',
    name: 'Export PDF',
    nameAr: 'تصدير PDF مرة واحدة',
    cost: 10,
    featureType: 'export',
    durationDays: 1,
    restrictions: { count: 1 },
    icon: 'Download'
  }
];

export const useDivisoCoins = () => {
  const [balance, setBalance] = useState<CoinBalance>({
    coins: 0,
    totalEarned: 0,
    totalSpent: 0
  });
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const fetchBalance = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_streaks')
        .select('coins, total_coins_earned, total_coins_spent')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      setBalance({
        coins: data?.coins ?? 0,
        totalEarned: data?.total_coins_earned ?? 0,
        totalSpent: data?.total_coins_spent ?? 0
      });
    } catch (error) {
      console.error('Error fetching coin balance:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (limit = 20) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('coin_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      setTransactions(data?.map(t => ({
        id: t.id,
        amount: t.amount,
        transactionType: t.transaction_type as 'earned' | 'spent',
        source: t.source,
        descriptionAr: t.description_ar,
        createdAt: t.created_at
      })) ?? []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, []);

  const addCoins = useCallback(async (amount: number, source: string, descriptionAr?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'not_authenticated' };

      const { data, error } = await supabase.rpc('add_coins', {
        p_user_id: user.id,
        p_amount: amount,
        p_source: source,
        p_description_ar: descriptionAr ?? null
      });

      if (error) throw error;

      const result = data as unknown as RpcResult;
      if (result?.success) {
        setBalance(prev => ({
          ...prev,
          coins: result.new_balance ?? prev.coins + amount,
          totalEarned: prev.totalEarned + amount
        }));
      }

      return result;
    } catch (error) {
      console.error('Error adding coins:', error);
      return { success: false, error: 'add_failed' };
    }
  }, []);

  const spendCoins = useCallback(async (amount: number, source: string, descriptionAr?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'not_authenticated' };

      const { data, error } = await supabase.rpc('spend_coins', {
        p_user_id: user.id,
        p_amount: amount,
        p_source: source,
        p_description_ar: descriptionAr ?? null
      });

      if (error) throw error;

      const result = data as unknown as RpcResult;
      if (result?.success) {
        setBalance(prev => ({
          ...prev,
          coins: result.new_balance ?? prev.coins - amount,
          totalSpent: prev.totalSpent + amount
        }));
      }

      return result;
    } catch (error) {
      console.error('Error spending coins:', error);
      return { success: false, error: 'spend_failed' };
    }
  }, []);

  const purchaseItem = useCallback(async (item: StoreItem) => {
    if (balance.coins < item.cost) {
      toast.error('رصيد غير كافٍ', {
        description: `تحتاج ${item.cost} عملة، لديك ${balance.coins} فقط`
      });
      return { success: false, error: 'insufficient_balance' };
    }

    setPurchasing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'not_authenticated' };

      // خصم العملات
      const spendResult = await spendCoins(
        item.cost,
        `purchase_${item.id}`,
        `شراء: ${item.nameAr}`
      );

      if (!spendResult?.success) {
        toast.error('فشل الشراء', { description: 'حدث خطأ أثناء خصم العملات' });
        return spendResult;
      }

      // منح الفتح المؤقت
      const { data: unlockResult, error: unlockError } = await supabase.rpc('grant_temporary_unlock', {
        p_user_id: user.id,
        p_feature_type: item.featureType,
        p_duration_days: item.durationDays,
        p_source: 'coin_purchase',
        p_restrictions: item.restrictions
      });

      if (unlockError) throw unlockError;

      const typedUnlockResult = unlockResult as unknown as UnlockResult;

      toast.success('تم الشراء بنجاح! 🎉', {
        description: `${item.nameAr} متاح الآن لمدة ${item.durationDays} ${item.durationDays === 1 ? 'يوم' : 'أيام'}`
      });

      return { success: true, unlock: typedUnlockResult };
    } catch (error) {
      console.error('Error purchasing item:', error);
      toast.error('فشل الشراء');
      return { success: false, error: 'purchase_failed' };
    } finally {
      setPurchasing(false);
    }
  }, [balance.coins, spendCoins]);

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, [fetchBalance, fetchTransactions]);

  return {
    balance,
    transactions,
    loading,
    purchasing,
    storeItems: STORE_ITEMS,
    addCoins,
    spendCoins,
    purchaseItem,
    refetch: fetchBalance,
    refetchTransactions: fetchTransactions
  };
};
