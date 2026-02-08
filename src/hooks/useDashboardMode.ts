import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOnboarding, OnboardingTask } from './useOnboarding';
import { useDailyHub, DailyHubData } from './useDailyHub';
import { supabase } from '@/integrations/supabase/client';

export type DashboardMode = 'onboarding' | 'daily_hub' | 'reengagement';
export type SessionHint = 'action' | 'done' | 'curiosity';

export interface ActivePlan {
  id: string;
  title: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget_value: number | null;
  budget_currency: string;
  destination: string | null;
}

export interface DashboardModeData {
  mode: DashboardMode;
  // Session
  sessionHint: SessionHint;
  lastMeaningfulAction: string | null;
  lastActionHint: string | null;
  hasActivePlan: boolean;
  // Display flags
  showOnboardingChecklist: boolean;
  showDailyFocus: boolean;
  showSmartPlanCard: boolean;
  showDice: boolean;
  showMiniFeed: boolean;
  showStats: boolean;
  showStatsLite: boolean;
  showBalanceCard: boolean;
  showDailyRewardCard: boolean;
  showRecentActivity: boolean;
  // Onboarding data
  tasks: OnboardingTask[];
  nextIncompleteTask: OnboardingTask | null;
  completedCount: number;
  totalTasks: number;
  progressPercent: number;
  allCompleted: boolean;
  rewardClaimed: boolean;
  isWithinOnboardingWindow: boolean;
  // Daily Hub data
  hubData: DailyHubData | null;
  streakCount: number;
  // Plan data
  activePlan: ActivePlan | null;
  // Stats
  daysSinceLastAction: number;
  // Loading
  isLoading: boolean;
  // Refresh
  refreshOnboarding: () => void;
  refreshHub: () => void;
}

// Fetch the user's profile for created_at and last_active_at
async function fetchProfileDates(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('created_at, last_active_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile dates:', error);
    return null;
  }
  return data;
}

// Fetch the user's active plan
async function fetchActivePlan(userId: string): Promise<ActivePlan | null> {
  const { data, error } = await supabase
    .from('plans')
    .select('id, title, status, start_date, end_date, budget_value, budget_currency, destination')
    .eq('owner_user_id', userId)
    .eq('status', 'active')
    .order('start_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching active plan:', error);
    return null;
  }
  return data;
}

// Fetch last meaningful action from user_action_log
async function fetchLastMeaningfulAction(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_action_log')
    .select('action_type')
    .eq('user_id', userId)
    .in('action_type', ['add_expense', 'dice_roll', 'create_group'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching last meaningful action:', error);
    return null;
  }
  return data?.action_type || null;
}

function getLastActionHint(actionType: string | null): string | null {
  if (!actionType) return null;
  switch (actionType) {
    case 'dice_roll': return 'last_action_dice';
    case 'add_expense': return 'last_action_expense';
    case 'create_group': return 'last_action_group';
    default: return null;
  }
}

function daysBetween(dateStr: string | null): number {
  if (!dateStr) return 999;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function useDashboardMode(userId: string | undefined): DashboardModeData {
  // Onboarding hook
  const onboarding = useOnboarding();

  // Daily Hub hook
  const { hubData, isLoading: hubLoading, refresh: refreshHub } = useDailyHub(userId);

  // Profile dates
  const { data: profileDates, isLoading: profileLoading } = useQuery({
    queryKey: ['profile-dates', userId],
    queryFn: () => fetchProfileDates(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Active plan
  const { data: activePlan, isLoading: planLoading } = useQuery({
    queryKey: ['active-plan', userId],
    queryFn: () => fetchActivePlan(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Last meaningful action
  const { data: lastMeaningfulAction } = useQuery({
    queryKey: ['last-meaningful-action', userId],
    queryFn: () => fetchLastMeaningfulAction(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = onboarding.loading || hubLoading || profileLoading || planLoading;

  // Calculate derived values
  const computed = useMemo(() => {
    // Registration date: prefer onboarding created_at, then profile created_at
    const registrationDate = onboarding.data?.createdAt || profileDates?.created_at || null;
    const daysSinceRegistration = daysBetween(registrationDate);

    // Last activity from hub data or profile
    const lastActionAt = hubData?.last_action_at || profileDates?.last_active_at || null;
    const daysSinceLastAction = hubData?.days_since_last_action ?? daysBetween(lastActionAt);

    // Onboarding window: within 7 days of registration
    const isWithinOnboardingWindow = daysSinceRegistration <= 7;

    // Next incomplete task
    const nextIncompleteTask = onboarding.tasks.find(t => !t.completed) || null;

    // Determine mode (order matters: onboarding first)
    let mode: DashboardMode = 'daily_hub';

    if (
      onboarding.completedCount < onboarding.totalTasks &&
      isWithinOnboardingWindow &&
      !onboarding.rewardClaimed
    ) {
      mode = 'onboarding';
    } else if (daysSinceLastAction > 7) {
      mode = 'reengagement';
    } else {
      mode = 'daily_hub';
    }

    // Session Hint
    const hasActivePlan = (activePlan ?? null) !== null;
    let sessionHint: SessionHint;

    if (mode === 'daily_hub') {
      if (hasActivePlan) {
        sessionHint = 'action';
      } else if (daysSinceLastAction <= 1) {
        sessionHint = 'done';
      } else {
        sessionHint = 'curiosity';
      }
    } else if (mode === 'reengagement') {
      sessionHint = 'curiosity';
    } else {
      sessionHint = 'action';
    }

    // Display flags
    const showOnboardingChecklist = mode === 'onboarding';
    const showDailyFocus = true;
    const showSmartPlanCard = mode === 'daily_hub' && hasActivePlan;
    const showDice = mode !== 'onboarding' || onboarding.completedCount >= 2;
    const showMiniFeed = mode === 'daily_hub' || mode === 'reengagement';
    const showStats = mode === 'daily_hub';
    const showStatsLite = mode === 'daily_hub' || mode === 'reengagement';
    const showBalanceCard = mode === 'daily_hub' || mode === 'reengagement';
    const showDailyRewardCard = mode === 'daily_hub' || mode === 'reengagement';
    const showRecentActivity = mode === 'daily_hub';

    // Last action hint (i18n key)
    const lastActionHint = getLastActionHint(lastMeaningfulAction ?? null);

    return {
      mode,
      sessionHint,
      lastActionHint,
      hasActivePlan,
      nextIncompleteTask,
      isWithinOnboardingWindow,
      daysSinceLastAction,
      showOnboardingChecklist,
      showDailyFocus,
      showSmartPlanCard,
      showDice,
      showMiniFeed,
      showStats,
      showStatsLite,
      showBalanceCard,
      showDailyRewardCard,
      showRecentActivity,
    };
  }, [onboarding, hubData, profileDates, activePlan, lastMeaningfulAction]);

  return {
    mode: computed.mode,
    sessionHint: computed.sessionHint,
    lastMeaningfulAction: lastMeaningfulAction ?? null,
    lastActionHint: computed.lastActionHint,
    hasActivePlan: computed.hasActivePlan,
    showOnboardingChecklist: computed.showOnboardingChecklist,
    showDailyFocus: computed.showDailyFocus,
    showSmartPlanCard: computed.showSmartPlanCard,
    showDice: computed.showDice,
    showMiniFeed: computed.showMiniFeed,
    showStats: computed.showStats,
    showStatsLite: computed.showStatsLite,
    showBalanceCard: computed.showBalanceCard,
    showDailyRewardCard: computed.showDailyRewardCard,
    showRecentActivity: computed.showRecentActivity,
    tasks: onboarding.tasks,
    nextIncompleteTask: computed.nextIncompleteTask,
    completedCount: onboarding.completedCount,
    totalTasks: onboarding.totalTasks,
    progressPercent: onboarding.progressPercent,
    allCompleted: onboarding.allCompleted,
    rewardClaimed: onboarding.rewardClaimed,
    isWithinOnboardingWindow: computed.isWithinOnboardingWindow,
    hubData: hubData ?? null,
    streakCount: hubData?.streak_count ?? 0,
    activePlan: activePlan ?? null,
    daysSinceLastAction: computed.daysSinceLastAction,
    isLoading,
    refreshOnboarding: onboarding.refresh,
    refreshHub,
  };
}
