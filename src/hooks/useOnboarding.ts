import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export interface OnboardingTask {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  completed: boolean;
  coinsReward: number;
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
    coinsReward: 10,
    route: '/settings'
  },
  { 
    id: 'group', 
    titleKey: 'onboarding.tasks.group', 
    descriptionKey: 'onboarding.tasks_desc.group',
    icon: 'Users', 
    coinsReward: 10,
    route: '/create-group'
  },
  { 
    id: 'expense', 
    titleKey: 'onboarding.tasks.expense', 
    descriptionKey: 'onboarding.tasks_desc.expense',
    icon: 'Receipt', 
    coinsReward: 10,
    route: '/add-expense'
  },
  { 
    id: 'invite', 
    titleKey: 'onboarding.tasks.invite', 
    descriptionKey: 'onboarding.tasks_desc.invite',
    icon: 'UserPlus', 
    coinsReward: 10,
    route: '/my-groups'
  },
  { 
    id: 'referral', 
    titleKey: 'onboarding.tasks.referral', 
    descriptionKey: 'onboarding.tasks_desc.referral',
    icon: 'Share2', 
    coinsReward: 10,
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
  const { toast } = useToast();
  const { t } = useTranslation('dashboard');
  const queryClient = useQueryClient();
  const [completing, setCompleting] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [rewardDetails, setRewardDetails] = useState<{ trialDays?: number; bonusCoins?: number }>({});
  const autoClaimTriggered = useRef(false);

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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const completeTask = useCallback(async (taskId: string) => {
    if (completing || !userId) return;
    
    try {
      setCompleting(true);

      const { data: result, error } = await supabase.rpc('complete_onboarding_task', {
        p_user_id: userId,
        p_task_name: taskId
      });

      if (error) {
        console.error('Error completing task:', error);
        return;
      }

      const resultObj = result as Record<string, unknown> | null;
      if (resultObj?.success && !resultObj?.already_completed) {
        toast({
          title: t('onboarding.task_completed'),
          description: t('onboarding.earned_coins', { coins: resultObj.coins_earned }),
        });
        
        queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      }
    } catch (error) {
      console.error('Error in completeTask:', error);
    } finally {
      setCompleting(false);
    }
  }, [completing, userId, t, toast, queryClient]);

  const claimReward = useCallback(async () => {
    if (claiming || !userId) return { success: false };
    
    try {
      setClaiming(true);

      const { data: result, error } = await supabase.rpc('claim_onboarding_reward', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error claiming reward:', error);
        return { success: false };
      }

      const resultObj = result as Record<string, unknown> | null;
      if (resultObj?.success) {
        const details = {
          trialDays: resultObj.trial_days as number || 7,
          bonusCoins: resultObj.bonus_coins as number || 50
        };
        setRewardDetails(details);
        setShowShareDialog(true);
        
        queryClient.invalidateQueries({ queryKey: ['onboarding'] });
        return { success: true, ...details };
      } else {
        return { success: false };
      }
    } catch (error) {
      console.error('Error in claimReward:', error);
      return { success: false };
    } finally {
      setClaiming(false);
    }
  }, [claiming, userId, queryClient]);

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
  const shouldShowOnboarding = !data?.rewardClaimed && !allCompleted;

  // Auto-claim reward when all tasks completed
  useEffect(() => {
    if (allCompleted && !data?.rewardClaimed && !claiming && !autoClaimTriggered.current) {
      autoClaimTriggered.current = true;
      claimReward();
    }
  }, [allCompleted, data?.rewardClaimed, claiming, claimReward]);

  return {
    data,
    tasks,
    completedCount,
    totalTasks,
    progressPercent,
    allCompleted,
    rewardClaimed: data?.rewardClaimed ?? false,
    shouldShowOnboarding,
    loading,
    completing,
    claiming,
    completeTask,
    claimReward,
    refresh: refetch,
    showShareDialog,
    setShowShareDialog,
    rewardDetails
  };
};
