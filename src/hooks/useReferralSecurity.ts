import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SecurityCheck {
  is_allowed: boolean;
  reason: string;
  retry_after: number;
}

export function useReferralSecurity() {
  const checkSpamProtection = useCallback(async (phone: string): Promise<SecurityCheck> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { 
          is_allowed: false, 
          reason: "يجب تسجيل الدخول أولاً", 
          retry_after: 0 
        };
      }

      const { data, error } = await supabase.rpc('check_referral_spam_protection', {
        p_user_id: user.id,
        p_phone: phone
      });

      if (error) throw error;

      return data && data.length > 0 ? data[0] : { 
        is_allowed: true, 
        reason: "مسموح", 
        retry_after: 0 
      };
    } catch (error) {
      console.error("Error checking spam protection:", error);
      return { 
        is_allowed: false, 
        reason: "خطأ في التحقق من الحماية", 
        retry_after: 3600 
      };
    }
  }, []);

  const logSuspiciousActivity = useCallback(async (phone: string, reason: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc('log_suspicious_referral', {
        p_user_id: user.id,
        p_phone: phone,
        p_reason: reason
      });
    } catch (error) {
      console.error("Error logging suspicious activity:", error);
    }
  }, []);

  const formatRetryTime = useCallback((seconds: number): string => {
    if (seconds <= 0) return "";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} ساعة و ${minutes} دقيقة`;
    }
    return `${minutes} دقيقة`;
  }, []);

  return {
    checkSpamProtection,
    logSuspiciousActivity,
    formatRetryTime
  };
}