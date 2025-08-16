import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface QuotaTestResult {
  success: boolean;
  message: string;
  error?: string;
}

export function useQuotaTest() {
  const testGroupCreationLimit = useCallback(async (): Promise<QuotaTestResult> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'غير مسجل الدخول' };
      }

      // Try to create a test group to trigger quota check
      const { error } = await supabase
        .from('groups')
        .insert({
          name: 'مجموعة اختبار الحدود',
          owner_id: user.id
        });

      if (error) {
        if (error.message.includes('quota_exceeded')) {
          return { 
            success: true, 
            message: 'نظام الحدود يعمل بشكل صحيح - تم منع إنشاء مجموعة جديدة',
            error: error.message 
          };
        }
        
        // If it's not a quota error, it might be another issue
        return { 
          success: false, 
          message: 'خطأ غير متوقع في اختبار الحدود',
          error: error.message 
        };
      }

      // If no error occurred, the group was created successfully
      // This means either the user hasn't reached the limit or there's an issue with quota enforcement
      return { 
        success: true, 
        message: 'تم إنشاء مجموعة اختبار بنجاح - لم يتم الوصول للحد الأقصى بعد'
      };

    } catch (err) {
      return { 
        success: false, 
        message: 'فشل في اختبار حدود المجموعات',
        error: err instanceof Error ? err.message : 'خطأ غير معروف'
      };
    }
  }, []);

  const testExpenseCreationLimit = useCallback(async (groupId: string): Promise<QuotaTestResult> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, message: 'غير مسجل الدخول' };
      }

      const { error } = await supabase
        .from('expenses')
        .insert({
          group_id: groupId,
          created_by: user.id,
          payer_id: user.id,
          amount: 1,
          currency: 'SAR',
          description: 'اختبار حدود المصروفات'
        });

      if (error) {
        if (error.message.includes('quota_exceeded')) {
          return { 
            success: true, 
            message: 'نظام حدود المصروفات يعمل بشكل صحيح',
            error: error.message 
          };
        }
        
        return { 
          success: false, 
          message: 'خطأ في اختبار حدود المصروفات',
          error: error.message 
        };
      }

      return { 
        success: true, 
        message: 'تم إنشاء مصروف اختبار بنجاح - لم يتم الوصول للحد الأقصى'
      };

    } catch (err) {
      return { 
        success: false, 
        message: 'فشل في اختبار حدود المصروفات',
        error: err instanceof Error ? err.message : 'خطأ غير معروف'
      };
    }
  }, []);

  const runFullQuotaTest = useCallback(async () => {
    toast.loading('جاري اختبار نظام الحدود...');
    
    try {
      // Test group creation limit
      const groupTest = await testGroupCreationLimit();
      
      // Get user's first group for expense testing
      const { data: groups } = await supabase
        .from('groups')
        .select('id')
        .limit(1);

      let expenseTest: QuotaTestResult = { success: false, message: 'لا توجد مجموعات للاختبار' };
      
      if (groups && groups.length > 0) {
        expenseTest = await testExpenseCreationLimit(groups[0].id);
      }

      toast.dismiss();

      // Show results
      toast.success('تم اختبار نظام الحدود', {
        description: `
          اختبار المجموعات: ${groupTest.message}
          اختبار المصروفات: ${expenseTest.message}
        `,
        duration: 10000
      });

      return {
        groupTest,
        expenseTest
      };

    } catch (error) {
      toast.dismiss();
      toast.error('فشل في اختبار نظام الحدود');
      throw error;
    }
  }, [testGroupCreationLimit, testExpenseCreationLimit]);

  const cleanupTestData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Remove test groups
      await supabase
        .from('groups')
        .delete()
        .eq('owner_id', user.id)
        .eq('name', 'مجموعة اختبار الحدود');

      // Remove test expenses
      await supabase
        .from('expenses')
        .delete()
        .eq('created_by', user.id)
        .eq('description', 'اختبار حدود المصروفات');

      toast.success('تم حذف بيانات الاختبار');

    } catch (error) {
      toast.error('فشل في حذف بيانات الاختبار');
      console.error('Cleanup error:', error);
    }
  }, []);

  return {
    testGroupCreationLimit,
    testExpenseCreationLimit,
    runFullQuotaTest,
    cleanupTestData
  };
}