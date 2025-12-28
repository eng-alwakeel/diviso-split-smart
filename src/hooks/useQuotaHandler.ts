import { useCallback, useState } from "react";
import { useSubscriptionLimits } from "./useSubscriptionLimits";

export function useQuotaHandler() {
  const { limits, currentPlan, isFreePlan, getUsagePercentage, isNearLimit, isAtLimit } = useSubscriptionLimits();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [currentQuotaType, setCurrentQuotaType] = useState<'groups' | 'members' | 'expenses' | 'invites' | 'ocr'>('groups');

  const handleQuotaError = useCallback((error: any) => {
    const errorMessage = error?.message || error?.toString() || '';
    
    if (errorMessage.includes('quota_exceeded:')) {
      const quotaMessage = errorMessage.split('quota_exceeded:')[1];
      
      // Extract quota type from error message
      let quotaType: 'groups' | 'members' | 'expenses' | 'invites' | 'ocr' = 'groups';
      if (quotaMessage.includes('group')) quotaType = 'groups';
      else if (quotaMessage.includes('member')) quotaType = 'members';
      else if (quotaMessage.includes('expense')) quotaType = 'expenses';
      else if (quotaMessage.includes('invite')) quotaType = 'invites';
      else if (quotaMessage.includes('ocr')) quotaType = 'ocr';
      
      setCurrentQuotaType(quotaType);
      setUpgradeDialogOpen(true);
      
      return true; // Indicates the error was handled
    }
    
    return false; // Error was not a quota error
  }, []);

  const showUpgradeDialog = useCallback((quotaType: 'groups' | 'members' | 'expenses' | 'invites' | 'ocr') => {
    setCurrentQuotaType(quotaType);
    setUpgradeDialogOpen(true);
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

  const checkQuotaWarning = useCallback((usage: number, limit: number, quotaType: string) => {
    const percentage = getUsagePercentage(usage, limit);
    const isNear = isNearLimit(usage, limit);
    const isAt = isAtLimit(usage, limit);

    return {
      showWarning: isNear && !isAt,
      showCritical: isAt,
      percentage,
      type: isAt ? 'critical' as const : (isNear ? 'warning' as const : null)
    };
  }, [getUsagePercentage, isNearLimit, isAtLimit]);

  // Return translation keys instead of hardcoded strings
  const getPlanBenefits = useCallback(() => {
    return {
      personal: {
        nameKey: "quota:plans.personal.name",
        priceKey: "quota:plans.personal.price",
        benefitsKey: "quota:plans.personal.benefits"
      },
      family: {
        nameKey: "quota:plans.family.name",
        priceKey: "quota:plans.family.price",
        benefitsKey: "quota:plans.family.benefits"
      }
    };
  }, []);

  return {
    // Original functions
    handleQuotaError,
    currentPlan,
    getPlanLimits,
    isFreePlan,
    
    // New enhanced functions
    showUpgradeDialog,
    upgradeDialogOpen,
    setUpgradeDialogOpen,
    currentQuotaType,
    checkQuotaWarning,
    getPlanBenefits
  };
}
