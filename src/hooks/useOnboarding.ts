import { useState, useEffect, useCallback, useMemo } from 'react';
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

export const useOnboarding = () => {
  const { toast } = useToast();
  const { t } = useTranslation('dashboard');
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const fetchOnboardingStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: onboardingData, error } = await supabase
        .from('onboarding_tasks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching onboarding:', error);
        setLoading(false);
        return;
      }

      if (onboardingData) {
        setData({
          profileCompleted: onboardingData.profile_completed,
          firstGroupCreated: onboardingData.first_group_created,
          firstExpenseAdded: onboardingData.first_expense_added,
          firstInviteSent: onboardingData.first_invite_sent,
          firstReferralMade: onboardingData.first_referral_made,
          tasksCompleted: onboardingData.tasks_completed,
          rewardClaimed: onboardingData.reward_claimed,
          rewardClaimedAt: onboardingData.reward_claimed_at
        });
      } else {
        // No record yet - create one
        const { error: insertError } = await supabase
          .from('onboarding_tasks')
          .insert({ user_id: user.id });
        
        if (!insertError) {
          setData({
            profileCompleted: false,
            firstGroupCreated: false,
            firstExpenseAdded: false,
            firstInviteSent: false,
            firstReferralMade: false,
            tasksCompleted: 0,
            rewardClaimed: false,
            rewardClaimedAt: null
          });
        }
      }
    } catch (error) {
      console.error('Error in fetchOnboardingStatus:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOnboardingStatus();
  }, [fetchOnboardingStatus]);

  const completeTask = useCallback(async (taskId: string) => {
    if (completing) return;
    
    try {
      setCompleting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: result, error } = await supabase.rpc('complete_onboarding_task', {
        p_user_id: user.id,
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
        
        // Refresh data
        await fetchOnboardingStatus();
      }
    } catch (error) {
      console.error('Error in completeTask:', error);
    } finally {
      setCompleting(false);
    }
  }, [completing, fetchOnboardingStatus, t, toast]);

  const claimReward = useCallback(async () => {
    if (claiming) return;
    
    try {
      setClaiming(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false };

      const { data: result, error } = await supabase.rpc('claim_onboarding_reward', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error claiming reward:', error);
        toast({
          title: t('onboarding.error'),
          description: error.message,
          variant: 'destructive'
        });
        return { success: false };
      }

      const resultObj = result as Record<string, unknown> | null;
      if (resultObj?.success) {
        toast({
          title: t('onboarding.congrats'),
          description: t('onboarding.reward_message'),
        });
        
        await fetchOnboardingStatus();
        return { success: true, trialDays: resultObj.trial_days, bonusCoins: resultObj.bonus_coins };
      } else {
        const errorCode = resultObj?.error as string;
        const errorKey = errorCode === 'not_all_completed' 
          ? 'onboarding.complete_all_first'
          : errorCode === 'already_claimed'
          ? 'onboarding.already_claimed'
          : 'onboarding.error';
        
        toast({
          title: t('onboarding.error'),
          description: t(errorKey),
          variant: 'destructive'
        });
        return { success: false };
      }
    } catch (error) {
      console.error('Error in claimReward:', error);
      return { success: false };
    } finally {
      setClaiming(false);
    }
  }, [claiming, fetchOnboardingStatus, t, toast]);

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
    refresh: fetchOnboardingStatus
  };
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
