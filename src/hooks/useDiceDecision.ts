import { useState, useCallback } from 'react';
import { 
  DiceType, 
  DiceFace, 
  DiceResult, 
  DualDiceResult, 
  DiceContext,
  ACTIVITY_DICE,
  FOOD_DICE,
  ACTIVITY_FACES,
  FOOD_FACES,
  getRandomFace,
  shouldPromptFoodDice
} from '@/data/diceData';
import { hapticImpact, hapticNotification } from '@/lib/native';
import { useAnalyticsEvents } from '@/hooks/useAnalyticsEvents';
import { supabase } from '@/integrations/supabase/client';

interface UseDiceDecisionReturn {
  // State
  selectedDice: DiceType | null;
  isRolling: boolean;
  result: DiceResult | null;
  dualResult: DualDiceResult | null;
  hasRerolled: boolean;
  showFoodPrompt: boolean;
  
  // Actions
  selectDice: (type: DiceType) => void;
  rollDice: () => Promise<void>;
  rollQuickDice: () => Promise<void>;
  rollFoodAfterActivity: () => Promise<void>;
  acceptDecision: () => void;
  rerollDice: () => Promise<void>;
  reset: () => void;
  
  // Smart suggestion
  suggestedDice: DiceType | null;
  suggestionReason: string | null;
  isLoadingSuggestion: boolean;
  loadSuggestion: (context: DiceContext) => Promise<void>;
}

const ROLL_DURATION = 1500; // 1.5 seconds

export function useDiceDecision(): UseDiceDecisionReturn {
  const { trackEvent } = useAnalyticsEvents();
  
  // State
  const [selectedDice, setSelectedDice] = useState<DiceType | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<DiceResult | null>(null);
  const [dualResult, setDualResult] = useState<DualDiceResult | null>(null);
  const [hasRerolled, setHasRerolled] = useState(false);
  const [showFoodPrompt, setShowFoodPrompt] = useState(false);
  
  // Smart suggestion state
  const [suggestedDice, setSuggestedDice] = useState<DiceType | null>(null);
  const [suggestionReason, setSuggestionReason] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

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
    
    // Trigger success haptic
    await hapticNotification('success');
    
    // Check if we should prompt for food dice
    if (selectedDice.id === 'activity' && shouldPromptFoodDice(face)) {
      setShowFoodPrompt(true);
    }
    
    // Track event
    trackEvent('dice_rolled', { 
      dice_type: selectedDice.id, 
      result_face: face.id 
    });
  }, [selectedDice, isRolling, trackEvent]);

  // Roll quick dice (dual roll)
  const rollQuickDice = useCallback(async () => {
    if (isRolling) return;
    
    setSelectedDice(null); // Clear single selection for quick mode
    setIsRolling(true);
    setShowFoodPrompt(false);
    
    // Trigger haptic feedback
    await hapticImpact('heavy');
    
    // Simulate rolling animation duration
    await new Promise(resolve => setTimeout(resolve, ROLL_DURATION));
    
    // Get random faces for both dice
    const activityFace = ACTIVITY_FACES[Math.floor(Math.random() * ACTIVITY_FACES.length)];
    const foodFace = FOOD_FACES[Math.floor(Math.random() * FOOD_FACES.length)];
    
    const newDualResult: DualDiceResult = {
      activity: {
        diceType: ACTIVITY_DICE,
        face: activityFace,
        timestamp: new Date()
      },
      food: {
        diceType: FOOD_DICE,
        face: foodFace,
        timestamp: new Date()
      }
    };
    
    setDualResult(newDualResult);
    setIsRolling(false);
    
    // Trigger success haptic
    await hapticNotification('success');
    
    // Track event
    trackEvent('dice_dual_rolled', { 
      activity_result: activityFace.id,
      food_result: foodFace.id
    });
  }, [isRolling, trackEvent]);

  // Roll food dice after activity (when restaurant is selected)
  const rollFoodAfterActivity = useCallback(async () => {
    if (isRolling || !result) return;
    
    setIsRolling(true);
    setShowFoodPrompt(false);
    
    await hapticImpact('medium');
    await new Promise(resolve => setTimeout(resolve, ROLL_DURATION));
    
    const foodFace = FOOD_FACES[Math.floor(Math.random() * FOOD_FACES.length)];
    
    const newDualResult: DualDiceResult = {
      activity: result,
      food: {
        diceType: FOOD_DICE,
        face: foodFace,
        timestamp: new Date()
      }
    };
    
    setDualResult(newDualResult);
    setResult(null); // Clear single result
    setIsRolling(false);
    
    await hapticNotification('success');
    
    trackEvent('dice_rolled', { 
      dice_type: 'food',
      result_face: foodFace.id,
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
          food_result: dualResult.food.face.id
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
          available_dice: ['activity', 'food']
        }
      });
      
      if (error) throw error;
      
      // Set suggested dice based on response
      if (data?.suggested_dice?.length > 0) {
        const suggestedId = data.suggested_dice[0];
        if (suggestedId === 'activity') {
          setSuggestedDice(ACTIVITY_DICE);
        } else if (suggestedId === 'food') {
          setSuggestedDice(FOOD_DICE);
        }
        // Set suggestion reason if provided
        if (data?.reason) {
          setSuggestionReason(data.reason);
        }
      } else {
        // Fallback to activity dice
        setSuggestedDice(ACTIVITY_DICE);
        setSuggestionReason(null);
      }
    } catch (error) {
      console.error('Error loading dice suggestion:', error);
      // Fallback to activity dice
      setSuggestedDice(ACTIVITY_DICE);
      setSuggestionReason(null);
    } finally {
      setIsLoadingSuggestion(false);
    }
  }, []);

  return {
    // State
    selectedDice,
    isRolling,
    result,
    dualResult,
    hasRerolled,
    showFoodPrompt,
    
    // Actions
    selectDice,
    rollDice,
    rollQuickDice,
    rollFoodAfterActivity,
    acceptDecision,
    rerollDice,
    reset,
    
    // Smart suggestion
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
