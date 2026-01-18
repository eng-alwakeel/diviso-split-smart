/**
 * @deprecated This hook is deprecated. The referral system now uses points (UC) only.
 * Free days rewards for inviters have been removed.
 */
export function useReferralRewards() {
  return {
    rewards: [],
    loading: false,
    totalDaysEarned: 0,
    remainingDays: 0,
    applyRewardToSubscription: async () => ({ error: "deprecated" }),
    canApplyRewards: () => false,
    refresh: async () => {}
  };
}
