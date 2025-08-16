import { useCallback } from "react";
import { toast } from "sonner";
import { useSubscriptionLimits } from "./useSubscriptionLimits";

export function useQuotaHandler() {
  const { limits, currentPlan, isFreePlan } = useSubscriptionLimits();

  const handleQuotaError = useCallback((error: any) => {
    const errorMessage = error?.message || error?.toString() || '';
    
    if (errorMessage.includes('quota_exceeded:')) {
      const quotaMessage = errorMessage.split('quota_exceeded:')[1];
      
      toast.error(quotaMessage, {
        duration: 5000,
          action: {
            label: "ترقية الباقة",
            onClick: () => {
              // Navigate to pricing/upgrade page
              window.location.href = '/pricing';
            },
          },
      });
      
      return true; // Indicates the error was handled
    }
    
    return false; // Error was not a quota error
  }, []);

  const getPlanLimits = useCallback(() => {
    return limits || {
      members: 5,
      groups: 3,
      expenses: 100,
      invites: 10,
      ocr: 5
    };
  }, [limits]);

  return {
    handleQuotaError,
    currentPlan,
    getPlanLimits,
    isFreePlan
  };
}