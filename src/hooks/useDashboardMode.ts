import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOnboarding, OnboardingTask } from './useOnboarding';
import { useDailyHub, DailyHubData } from './useDailyHub';
import { supabase } from '@/integrations/supabase/client';

export type DashboardMode = 'onboarding' | 'daily_hub' | 'reengagement';

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

    // Determine mode
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

    return {
      mode,
      nextIncompleteTask,
      isWithinOnboardingWindow,
      daysSinceLastAction,
    };
  }, [onboarding, hubData, profileDates]);

  return {
    mode: computed.mode,
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
