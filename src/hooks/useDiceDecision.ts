import { useState, useCallback } from 'react';
import { 
  DiceType, 
  DiceFace, 
  DiceResult, 
  DualDiceResult, 
  DiceContext,
  ACTIVITY_DICE,
  CUISINE_DICE,
  BUDGET_DICE,
  WHOPAYS_DICE,
  TASK_DICE,
  ACTIVITY_FACES,
  CUISINE_FACES,
  FOOD_FACES,
  getRandomFace,
  shouldPromptCuisineDice,
  getDiceById
} from '@/data/diceData';
import { hapticImpact, hapticNotification } from '@/lib/native';
import { useAnalyticsEvents } from '@/hooks/useAnalyticsEvents';
import { supabase } from '@/integrations/supabase/client';
import { useUsageCredits } from '@/hooks/useUsageCredits';

interface UseDiceDecisionReturn {
  // State
  selectedDice: DiceType | null;
  isRolling: boolean;
  result: DiceResult | null;
  dualResult: DualDiceResult | null;
  hasRerolled: boolean;
  showFoodPrompt: boolean;
  showPaywall: boolean;
  
  // Actions
  selectDice: (type: DiceType) => void;
  rollDice: () => Promise<void>;
  rollQuickDice: () => Promise<void>;
  rollFoodAfterActivity: () => Promise<void>;
  acceptDecision: () => void;
  rerollDice: () => Promise<void>;
  reset: () => void;
  closePaywall: () => void;
  
  // Smart suggestion
  suggestedDice: DiceType | null;
  suggestionReason: string | null;
  isLoadingSuggestion: boolean;
  loadSuggestion: (context: DiceContext) => Promise<void>;
}

const ROLL_DURATION = 1500; // 1.5 seconds

export function useDiceDecision(): UseDiceDecisionReturn {
  const { trackEvent } = useAnalyticsEvents();
  const { checkCredits, consumeCredits } = useUsageCredits();
  
  // State
  const [selectedDice, setSelectedDice] = useState<DiceType | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<DiceResult | null>(null);
  const [dualResult, setDualResult] = useState<DualDiceResult | null>(null);
  const [hasRerolled, setHasRerolled] = useState(false);
  const [showFoodPrompt, setShowFoodPrompt] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  
  // Smart suggestion state
  const [suggestedDice, setSuggestedDice] = useState<DiceType | null>(null);
  const [suggestionReason, setSuggestionReason] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

  // Close paywall
  const closePaywall = useCallback(() => {
    setShowPaywall(false);
  }, []);

  // Select a dice type
  const selectDice = useCallback((type: DiceType) => {
    setSelectedDice(type);
    setResult(null);
    setDualResult(null);
    setHasRerolled(false);
    setShowFoodPrompt(false);
    trackEvent('dice_opened', { dice_type: type.id });
  }, [trackEvent]);

  // Roll a single dice
  const rollDice = useCallback(async () => {
    if (!selectedDice || isRolling) return;
    
    // Check credits before rolling
    const creditCheck = await checkCredits('roll_dice');
    if (!creditCheck.canPerform) {
      setShowPaywall(true);
      return;
    }
    
    setIsRolling(true);
    setShowFoodPrompt(false);
    
    // Trigger haptic feedback at start
    await hapticImpact('medium');
    
    // Simulate rolling animation duration
    await new Promise(resolve => setTimeout(resolve, ROLL_DURATION));
    
    // Get random face
    const face = getRandomFace(selectedDice);
    const newResult: DiceResult = {
      diceType: selectedDice,
      face,
      timestamp: new Date()
    };
    
    setResult(newResult);
    setIsRolling(false);
    
    // Consume credit after successful roll
    await consumeCredits('roll_dice');

    // Log for streak tracking
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('log_user_action', {
          p_user_id: user.id,
          p_action_type: 'dice_roll',
          p_metadata: { dice_type: selectedDice.id, face: face.id },
        });
      }
    } catch {
      // non-blocking
    }
    
    // Trigger success haptic
    await hapticNotification('success');
    
    // Check if we should prompt for cuisine dice (when activity result is restaurant)
    if (selectedDice.id === 'activity' && shouldPromptCuisineDice(face)) {
      setShowFoodPrompt(true);
    }
    
    // Track event
    trackEvent('dice_rolled', { 
      dice_type: selectedDice.id, 
      result_face: face.id 
    });
  }, [selectedDice, isRolling, trackEvent, checkCredits, consumeCredits]);

  // Roll quick dice (dual roll: activity + cuisine)
  const rollQuickDice = useCallback(async () => {
    if (isRolling) return;
    
    // Check credits before rolling
    const creditCheck = await checkCredits('roll_dice');
    if (!creditCheck.canPerform) {
      setShowPaywall(true);
      return;
    }
    
    setSelectedDice(null); // Clear single selection for quick mode
    setIsRolling(true);
    setShowFoodPrompt(false);
    
    // Trigger haptic feedback
    await hapticImpact('heavy');
    
    // Simulate rolling animation duration
    await new Promise(resolve => setTimeout(resolve, ROLL_DURATION));
    
    // Get random faces for both dice
    const activityFace = ACTIVITY_FACES[Math.floor(Math.random() * ACTIVITY_FACES.length)];
    const cuisineFace = CUISINE_FACES[Math.floor(Math.random() * CUISINE_FACES.length)];
    
    const newDualResult: DualDiceResult = {
      activity: {
        diceType: ACTIVITY_DICE,
        face: activityFace,
        timestamp: new Date()
      },
      cuisine: {
        diceType: CUISINE_DICE,
        face: cuisineFace,
        timestamp: new Date()
      },
      // Keep legacy food field for backward compatibility
      food: {
        diceType: CUISINE_DICE,
        face: cuisineFace,
        timestamp: new Date()
      }
    };
    
    setDualResult(newDualResult);
    setIsRolling(false);
    
    // Consume credit after successful roll
    await consumeCredits('roll_dice');

    // Log for streak tracking
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.rpc('log_user_action', {
          p_user_id: user.id,
          p_action_type: 'dice_roll',
          p_metadata: { dice_type: 'quick', activity: activityFace.id, cuisine: cuisineFace.id },
        });
      }
    } catch {
      // non-blocking
    }
    
    // Trigger success haptic
    await hapticNotification('success');
    
    // Track event
    trackEvent('dice_dual_rolled', { 
      activity_result: activityFace.id,
      cuisine_result: cuisineFace.id
    });
  }, [isRolling, trackEvent, checkCredits, consumeCredits]);

  // Roll cuisine dice after activity (when restaurant is selected)
  const rollFoodAfterActivity = useCallback(async () => {
    if (isRolling || !result) return;
    
    setIsRolling(true);
    setShowFoodPrompt(false);
    
    await hapticImpact('medium');
    await new Promise(resolve => setTimeout(resolve, ROLL_DURATION));
    
    const cuisineFace = CUISINE_FACES[Math.floor(Math.random() * CUISINE_FACES.length)];
    
    const newDualResult: DualDiceResult = {
      activity: result,
      cuisine: {
        diceType: CUISINE_DICE,
        face: cuisineFace,
        timestamp: new Date()
      },
      food: {
        diceType: CUISINE_DICE,
        face: cuisineFace,
        timestamp: new Date()
      }
    };
    
    setDualResult(newDualResult);
    setResult(null); // Clear single result
    setIsRolling(false);
    
    await hapticNotification('success');
    
    trackEvent('dice_rolled', { 
      dice_type: 'cuisine',
      result_face: cuisineFace.id,
      after_activity: true
    });
  }, [isRolling, result, trackEvent]);

  // Reroll the dice (only once)
  const rerollDice = useCallback(async () => {
    if (hasRerolled || isRolling) return;
    
    setHasRerolled(true);
    
    if (dualResult) {
      // Reroll both dice
      await rollQuickDice();
    } else if (selectedDice) {
      // Reroll single dice
      await rollDice();
    }
    
    trackEvent('dice_rerolled', { 
      dice_type: selectedDice?.id || 'quick'
    });
  }, [hasRerolled, isRolling, dualResult, selectedDice, rollQuickDice, rollDice, trackEvent]);

  // Accept the decision
  const acceptDecision = useCallback(() => {
    const eventData = dualResult
      ? { 
          activity_result: dualResult.activity.face.id,
          cuisine_result: dualResult.cuisine?.face.id || dualResult.food?.face.id
        }
      : { 
          dice_type: result?.diceType.id,
          result_face: result?.face.id
        };
    
    trackEvent('decision_accepted', eventData);
    hapticNotification('success');
  }, [dualResult, result, trackEvent]);

  // Reset all state
  const reset = useCallback(() => {
    setSelectedDice(null);
    setIsRolling(false);
    setResult(null);
    setDualResult(null);
    setHasRerolled(false);
    setShowFoodPrompt(false);
    setSuggestedDice(null);
    setSuggestionReason(null);
  }, []);

  // Load smart suggestion from edge function
  const loadSuggestion = useCallback(async (context: DiceContext) => {
    setIsLoadingSuggestion(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('suggest-dice', {
        body: {
          group_type: context.groupType,
          member_count: context.memberCount,
          time_of_day: context.timeOfDay || getTimeOfDay(),
          last_activity: context.lastActivity,
          available_dice: ['activity', 'cuisine', 'budget', 'whopays', 'task'],
          outstanding_balance: context.outstandingBalance,
          avg_spending: context.avgSpending
        }
      });
      
      if (error) throw error;
      
      // Set suggested dice based on response
      if (data?.suggested_dice?.length > 0) {
        const suggestedId = data.suggested_dice[0];
        const dice = getDiceById(suggestedId);
        if (dice) {
          setSuggestedDice(dice);
        } else {
          setSuggestedDice(ACTIVITY_DICE);
        }
        if (data?.reason) {
          setSuggestionReason(data.reason);
        }
      } else {
        setSuggestedDice(ACTIVITY_DICE);
        setSuggestionReason(null);
      }
    } catch (error) {
      console.error('Error loading dice suggestion:', error);
      setSuggestedDice(ACTIVITY_DICE);
      setSuggestionReason(null);
    } finally {
      setIsLoadingSuggestion(false);
    }
  }, []);

  return {
    selectedDice,
    isRolling,
    result,
    dualResult,
    hasRerolled,
    showFoodPrompt,
    showPaywall,
    selectDice,
    rollDice,
    rollQuickDice,
    rollFoodAfterActivity,
    acceptDecision,
    rerollDice,
    reset,
    closePaywall,
    suggestedDice,
    suggestionReason,
    isLoadingSuggestion,
    loadSuggestion
  };
}

// Helper to get current time of day
function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}
