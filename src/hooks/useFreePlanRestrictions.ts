import { useCallback } from 'react';
import { useSubscriptionLimits } from './useSubscriptionLimits';
import { useToast } from './use-toast';

export function useFreePlanRestrictions() {
  const { limits, isFreePlan, currentPlan } = useSubscriptionLimits();
  const { toast } = useToast();

  const checkReportExportLimit = useCallback((currentExports: number = 0) => {
    if (!isFreePlan || !limits) return { allowed: true };
    
    const limit = limits.reportExport;
    if (limit === -1) return { allowed: true };
    
    if (currentExports >= limit) {
      toast({
        title: "تم الوصول للحد الأقصى",
        description: `لقد وصلت للحد الأقصى من تصدير التقارير (${limit} تقارير شهرياً). قم بالترقية للحصول على تقارير غير محدودة.`,
        variant: "destructive"
      });
      return { allowed: false, limit, current: currentExports };
    }

    // Warning at 80%
    if (currentExports / limit >= 0.8) {
      toast({
        title: "قريب من الحد الأقصى",
        description: `تم استخدام ${Math.round((currentExports / limit) * 100)}% من حد تصدير التقارير. فكر في الترقية قبل النفاد.`,
        variant: "default"
      });
    }

    return { allowed: true, limit, current: currentExports };
  }, [isFreePlan, limits, toast]);

  const checkDataRetention = useCallback((createdAt: string) => {
    if (!isFreePlan || !limits) return { expired: false };
    
    const retentionMonths = limits.dataRetentionMonths;
    if (retentionMonths === -1) return { expired: false };
    
    const createdDate = new Date(createdAt);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - createdDate.getFullYear()) * 12 + 
                      (now.getMonth() - createdDate.getMonth());
    
    if (monthsDiff >= retentionMonths) {
      return { 
        expired: true, 
        monthsOld: monthsDiff, 
        retentionLimit: retentionMonths 
      };
    }

    // Warning when approaching expiration (within 1 month)
    if (monthsDiff >= retentionMonths - 1) {
      return {
        expired: false,
        warningNearExpiry: true,
        monthsRemaining: retentionMonths - monthsDiff
      };
    }

    return { expired: false };
  }, [isFreePlan, limits]);

  const getFreePlanWarning = useCallback((featureType: 'reports' | 'retention') => {
    if (!isFreePlan) return null;

    const warnings = {
      reports: {
        title: "باقة مجانية",
        description: "في الباقة المجانية، يمكنك تصدير 5 تقارير شهرياً فقط مع علامة مائية. قم بالترقية للحصول على تقارير احترافية غير محدودة.",
        action: "ترقية الباقة"
      },
      retention: {
        title: "مدة حفظ البيانات",
        description: "في الباقة المجانية، يتم حفظ البيانات لمدة 6 أشهر فقط. البيانات الأقدم قد تكون غير متاحة. قم بالترقية للحصول على حفظ دائم.",
        action: "ترقية الباقة"
      }
    };

    return warnings[featureType];
  }, [isFreePlan]);

  return {
    isFreePlan,
    currentPlan,
    limits,
    checkReportExportLimit,
    checkDataRetention,
    getFreePlanWarning
  };
}