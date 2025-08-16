import { useCallback } from "react";
import { toast } from "sonner";
import { useSubscription } from "./useSubscription";

export function useQuotaHandler() {
  const { subscription } = useSubscription();

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

  const getCurrentPlan = useCallback(() => {
    if (!subscription) return 'free';
    
    if (subscription.status === 'active' || 
        (subscription.status === 'trialing' && new Date(subscription.expires_at) > new Date())) {
      return subscription.plan;
    }
    
    return 'free';
  }, [subscription]);

  const getPlanLimits = useCallback((plan: string) => {
    const limits = {
      free: {
        members: 5,
        groups: 3,
        expenses: 100,
        invites: 10,
        ocr: 5
      },
      personal: {
        members: -1, // Unlimited
        groups: -1, // Unlimited
        expenses: 1000,
        invites: 50,
        ocr: 100
      },
      family: {
        members: 5,
        groups: 25,
        expenses: 5000,
        invites: 100,
        ocr: 500
      },
      lifetime: {
        members: 100,
        groups: 50,
        expenses: 10000,
        invites: 500,
        ocr: 1000
      }
    };
    
    return limits[plan as keyof typeof limits] || limits.free;
  }, []);

  return {
    handleQuotaError,
    getCurrentPlan,
    getPlanLimits,
    isFreePlan: getCurrentPlan() === 'free'
  };
}