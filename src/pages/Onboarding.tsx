import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { trackAnalyticsEvent } from '@/hooks/useAnalyticsEvents';
import { OnboardingLayout } from '@/components/onboarding-v2/OnboardingLayout';
import { StepStart } from '@/components/onboarding-v2/StepStart';
import { StepQuickGroup } from '@/components/onboarding-v2/StepQuickGroup';
import { StepDemoExpense } from '@/components/onboarding-v2/StepDemoExpense';
import { StepInvite } from '@/components/onboarding-v2/StepInvite';
import { WaitingScreen } from '@/components/onboarding-v2/WaitingScreen';
import { SEO } from '@/components/SEO';

type Step = 'start' | 'group' | 'expense' | 'invite' | 'waiting';

const STEP_NUMBER: Record<Step, number> = {
  start: 1,
  group: 2,
  expense: 3,
  invite: 4,
  waiting: 0,
};

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { enabled: flagEnabled, isLoading: flagLoading } = useFeatureFlag('new_onboarding_v2');

  const [step, setStep] = useState<Step>(() => {
    return (localStorage.getItem('onboarding_v2_step') as Step) || 'start';
  });
  const [groupId, setGroupId] = useState<string>(
    () => localStorage.getItem('onboarding_v2_group_id') || ''
  );
  const [memberCount, setMemberCount] = useState<number>(
    () => Number(localStorage.getItem('onboarding_v2_member_count')) || 3
  );

  // Persist step changes
  useEffect(() => {
    localStorage.setItem('onboarding_v2_step', step);
  }, [step]);

  // Redirect if flag is off (after loading)
  useEffect(() => {
    if (!flagLoading && !flagEnabled) {
      navigate('/dashboard', { replace: true });
    }
  }, [flagLoading, flagEnabled, navigate]);

  // Check if user already has groups — if so, go to dashboard
  useEffect(() => {
    const checkGroups = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // If user already has groups and has completed onboarding before, redirect
      if (count && count > 0 && !groupId) {
        navigate('/dashboard', { replace: true });
      }
    };
    checkGroups();
  }, [navigate, groupId]);

  const handleCreateGroup = useCallback(async (groupName: string, count: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create group
    const { data: groupInsert, error: groupErr } = await supabase
      .from('groups')
      .insert({
        name: groupName,
        owner_id: user.id,
        currency: 'SAR',
        group_type: 'trip',
      })
      .select('id')
      .single();

    if (groupErr) throw groupErr;

    const newGroupId = groupInsert.id;

    // Add owner as member
    await supabase
      .from('group_members')
      .insert({ group_id: newGroupId, user_id: user.id, role: 'owner' });

    // Track
    trackAnalyticsEvent('group_created', { source: 'onboarding_v2', group_id: newGroupId });

    // Complete onboarding task
    await supabase.rpc('complete_onboarding_task', {
      p_task_name: 'group',
      p_user_id: user.id,
    });

    // Create demo expense
    const { data: expenseData } = await supabase
      .from('expenses')
      .insert({
        group_id: newGroupId,
        created_by: user.id,
        payer_id: user.id,
        amount: 200,
        currency: 'SAR',
        description: 'مطعم',
        note_ar: 'مصروف تجريبي من الإعداد',
      })
      .select('id')
      .single();

    // Create expense split for the payer
    if (expenseData?.id) {
      await supabase.from('expense_splits').insert({
        expense_id: expenseData.id,
        member_id: user.id,
        share_amount: Math.round(200 / count),
      });
    }

    // Persist
    setGroupId(newGroupId);
    setMemberCount(count);
    localStorage.setItem('onboarding_v2_group_id', newGroupId);
    localStorage.setItem('onboarding_v2_member_count', String(count));

    setStep('expense');
  }, []);

  if (flagLoading) return null;

  return (
    <>
      <SEO title="ابدأ مع Diviso" noIndex={true} />
      <OnboardingLayout step={STEP_NUMBER[step]} totalSteps={4}>
        {step === 'start' && (
          <StepStart onNext={() => setStep('group')} />
        )}

        {step === 'group' && (
          <StepQuickGroup onNext={handleCreateGroup} />
        )}

        {step === 'expense' && (
          <StepDemoExpense
            memberCount={memberCount}
            onNext={() => setStep('invite')}
          />
        )}

        {step === 'invite' && groupId && (
          <StepInvite
            groupId={groupId}
            onNext={() => setStep('waiting')}
          />
        )}

        {step === 'waiting' && groupId && (
          <WaitingScreen groupId={groupId} />
        )}
      </OnboardingLayout>
    </>
  );
};

export default Onboarding;
