import { useCallback } from 'react';
import { useGuestSession } from './useGuestSession';
import { useGoogleAnalytics } from './useGoogleAnalytics';

export const useGuestAnalytics = () => {
  const { state, completeScenario, syncToDatabase } = useGuestSession();
  const { trackEvent } = useGoogleAnalytics();

  // Track guest session started
  const trackSessionStarted = useCallback(() => {
    trackEvent('guest_session_started', {
      session_id: state.sessionId,
    });
  }, [trackEvent, state.sessionId]);

  // Track scenario completed
  const trackScenarioCompleted = useCallback((scenarioId: string, durationSeconds: number) => {
    completeScenario(scenarioId);
    trackEvent('guest_scenario_completed', {
      session_id: state.sessionId,
      scenario_id: scenarioId,
      duration_seconds: durationSeconds,
      scenarios_count: state.completedScenarios.length + 1,
    });
    
    // Sync to database after completing scenario
    syncToDatabase();
  }, [completeScenario, trackEvent, state.sessionId, state.completedScenarios.length, syncToDatabase]);

  // Track expense added
  const trackExpenseAdded = useCallback((expenseCount: number) => {
    trackEvent('guest_expense_added', {
      session_id: state.sessionId,
      expense_count: expenseCount,
      total_expenses: state.totalExpensesAdded + 1,
    });
  }, [trackEvent, state.sessionId, state.totalExpensesAdded]);

  // Track group created
  const trackGroupCreated = useCallback((membersCount: number) => {
    trackEvent('guest_group_created', {
      session_id: state.sessionId,
      members_count: membersCount,
      groups_count: state.groups.length + 1,
    });
  }, [trackEvent, state.sessionId, state.groups.length]);

  // Track conversion prompt shown
  const trackConversionPromptShown = useCallback((triggerReason: string) => {
    trackEvent('guest_conversion_prompt_shown', {
      session_id: state.sessionId,
      trigger_reason: triggerReason,
      scenarios_completed: state.completedScenarios.length,
      expenses_added: state.totalExpensesAdded,
    });
  }, [trackEvent, state.sessionId, state.completedScenarios.length, state.totalExpensesAdded]);

  // Track conversion clicked
  const trackConversionClicked = useCallback((fromPrompt: boolean) => {
    trackEvent('guest_conversion_clicked', {
      session_id: state.sessionId,
      from_prompt: fromPrompt,
      scenarios_completed: state.completedScenarios.length,
      expenses_added: state.totalExpensesAdded,
    });
    
    // Sync final state to database
    syncToDatabase();
  }, [trackEvent, state.sessionId, state.completedScenarios.length, state.totalExpensesAdded, syncToDatabase]);

  // Track data migrated
  const trackDataMigrated = useCallback((groupsCount: number, expensesCount: number) => {
    trackEvent('guest_data_migrated', {
      session_id: state.sessionId,
      groups_count: groupsCount,
      expenses_count: expensesCount,
    });
  }, [trackEvent, state.sessionId]);

  return {
    trackSessionStarted,
    trackScenarioCompleted,
    trackExpenseAdded,
    trackGroupCreated,
    trackConversionPromptShown,
    trackConversionClicked,
    trackDataMigrated,
  };
};
