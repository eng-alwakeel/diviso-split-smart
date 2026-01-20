import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OnboardingTask {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  completed: boolean;
  route?: string;
}

export interface OnboardingData {
  profileCompleted: boolean;
  firstGroupCreated: boolean;
  firstExpenseAdded: boolean;
  firstInviteSent: boolean;
  firstReferralMade: boolean;
  tasksCompleted: number;
  rewardClaimed: boolean;
  rewardClaimedAt: string | null;
}

const ONBOARDING_TASKS_CONFIG: Omit<OnboardingTask, 'completed'>[] = [
  { 
    id: 'profile', 
    titleKey: 'onboarding.tasks.profile', 
    descriptionKey: 'onboarding.tasks_desc.profile',
    icon: 'User', 
    route: '/settings'
  },
  { 
    id: 'group', 
    titleKey: 'onboarding.tasks.group', 
    descriptionKey: 'onboarding.tasks_desc.group',
    icon: 'Users', 
    route: '/create-group'
  },
  { 
    id: 'expense', 
    titleKey: 'onboarding.tasks.expense', 
    descriptionKey: 'onboarding.tasks_desc.expense',
    icon: 'Receipt', 
    route: '/add-expense'
  },
  { 
    id: 'invite', 
    titleKey: 'onboarding.tasks.invite', 
    descriptionKey: 'onboarding.tasks_desc.invite',
    icon: 'UserPlus', 
    route: '/my-groups'
  },
  { 
    id: 'referral', 
    titleKey: 'onboarding.tasks.referral', 
    descriptionKey: 'onboarding.tasks_desc.referral',
    icon: 'Share2', 
    route: '/referral'
  }
];

// Fetch onboarding data
const fetchOnboardingData = async (userId: string): Promise<OnboardingData | null> => {
  const { data, error } = await supabase
    .from('onboarding_tasks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching onboarding:', error);
    return null;
  }

  if (data) {
    return {
      profileCompleted: data.profile_completed,
      firstGroupCreated: data.first_group_created,
      firstExpenseAdded: data.first_expense_added,
      firstInviteSent: data.first_invite_sent,
      firstReferralMade: data.first_referral_made,
      tasksCompleted: data.tasks_completed,
      rewardClaimed: data.reward_claimed,
      rewardClaimedAt: data.reward_claimed_at
    };
  }

  // Create record if not exists
  const { error: insertError } = await supabase
    .from('onboarding_tasks')
    .insert({ user_id: userId });
  
  if (!insertError) {
    return {
      profileCompleted: false,
      firstGroupCreated: false,
      firstExpenseAdded: false,
      firstInviteSent: false,
      firstReferralMade: false,
      tasksCompleted: 0,
      rewardClaimed: false,
      rewardClaimedAt: null
    };
  }
  
  return null;
};

function getTaskStatus(taskId: string, data: OnboardingData): boolean {
  switch (taskId) {
    case 'profile': return data.profileCompleted;
    case 'group': return data.firstGroupCreated;
    case 'expense': return data.firstExpenseAdded;
    case 'invite': return data.firstInviteSent;
    case 'referral': return data.firstReferralMade;
    default: return false;
  }
}

export const useOnboarding = () => {
  // Get user ID
  const { data: userId } = useQuery({
    queryKey: ['current-user-id'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Fetch onboarding data with React Query
  const { 
    data,
    isLoading: loading,
    refetch
  } = useQuery({
    queryKey: ['onboarding', userId],
    queryFn: () => fetchOnboardingData(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000, // تحديث أسرع للـ onboarding
    gcTime: 10 * 60 * 1000,
  });

  const tasks = useMemo<OnboardingTask[]>(() => {
    if (!data) return [];
    
    return ONBOARDING_TASKS_CONFIG.map(task => ({
      ...task,
      completed: getTaskStatus(task.id, data)
    }));
  }, [data]);

  const completedCount = useMemo(() => tasks.filter(t => t.completed).length, [tasks]);
  const totalTasks = ONBOARDING_TASKS_CONFIG.length;
  const progressPercent = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;
  const allCompleted = completedCount === totalTasks;

  return {
    data,
    tasks,
    completedCount,
    totalTasks,
    progressPercent,
    allCompleted,
    rewardClaimed: data?.rewardClaimed ?? false,
    loading,
    refresh: refetch
  };
};
