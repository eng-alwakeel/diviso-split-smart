import { useEffect, useState, useCallback, useRef } from "react";
import { useRecommendationSettings } from "./useRecommendationSettings";

type TriggerType = "planning" | "meal_time" | "post_expense" | "end_of_day" | null;
type MealType = "lunch" | "dinner" | null;

interface TriggerState {
  shouldShow: boolean;
  triggerType: TriggerType;
  mealType: MealType;
  reason: string;
}

interface UseRecommendationTriggersOptions {
  groupId?: string;
  groupType?: string;
  hasCity?: boolean;
  onTrigger?: (trigger: TriggerState) => void;
}

export function useRecommendationTriggers({
  groupId,
  groupType,
  hasCity,
  onTrigger,
}: UseRecommendationTriggersOptions = {}) {
  const { settings, isEnabled, checkDailyLimit } = useRecommendationSettings();
  const [triggerState, setTriggerState] = useState<TriggerState>({
    shouldShow: false,
    triggerType: null,
    mealType: null,
    reason: "",
  });
  
  const lastTriggerRef = useRef<string | null>(null);
  const mealCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if current time is meal time
  const checkMealTime = useCallback((): MealType => {
    const now = new Date();
    const hours = now.getHours();
    
    // Lunch time: 12:00 - 14:00
    if (hours >= 12 && hours < 14) {
      return "lunch";
    }
    
    // Dinner time: 19:00 - 21:00
    if (hours >= 19 && hours < 21) {
      return "dinner";
    }
    
    return null;
  }, []);

  // Check if end of day (for daily summary)
  const checkEndOfDay = useCallback((): boolean => {
    const now = new Date();
    const hours = now.getHours();
    // End of day: 22:00 - 23:00
    return hours >= 22 && hours < 23;
  }, []);

  // Main trigger evaluation
  const evaluateTriggers = useCallback(() => {
    if (!isEnabled || !checkDailyLimit()) {
      setTriggerState({ shouldShow: false, triggerType: null, mealType: null, reason: "" });
      return;
    }

    // Avoid triggering the same thing multiple times
    const currentTriggerKey = `${new Date().toISOString().split("T")[0]}-${new Date().getHours()}`;
    if (lastTriggerRef.current === currentTriggerKey) {
      return;
    }

    // Check meal time alerts (using 'enabled' as the setting)
    if (settings?.enabled) {
      const mealType = checkMealTime();
      if (mealType) {
        const newState: TriggerState = {
          shouldShow: true,
          triggerType: "meal_time",
          mealType,
          reason: mealType === "lunch" ? "It's lunch time!" : "It's dinner time!",
        };
        setTriggerState(newState);
        lastTriggerRef.current = currentTriggerKey;
        onTrigger?.(newState);
        return;
      }
    }

    // Check end of day
    if (checkEndOfDay()) {
      const newState: TriggerState = {
        shouldShow: true,
        triggerType: "end_of_day",
        mealType: null,
        reason: "End of day summary",
      };
      setTriggerState(newState);
      lastTriggerRef.current = currentTriggerKey;
      onTrigger?.(newState);
      return;
    }

    setTriggerState({ shouldShow: false, triggerType: null, mealType: null, reason: "" });
  }, [isEnabled, checkDailyLimit, settings?.enabled, checkMealTime, checkEndOfDay, onTrigger]);

  // Manual trigger for planning (when creating a group with city)
  const triggerPlanning = useCallback(() => {
    if (!isEnabled || !checkDailyLimit()) return;
    
    const newState: TriggerState = {
      shouldShow: true,
      triggerType: "planning",
      mealType: null,
      reason: "Group planning started",
    };
    setTriggerState(newState);
    onTrigger?.(newState);
  }, [isEnabled, checkDailyLimit, onTrigger]);

  // Manual trigger for post-expense
  const triggerPostExpense = useCallback(() => {
    if (!isEnabled || !checkDailyLimit()) return;
    
    const newState: TriggerState = {
      shouldShow: true,
      triggerType: "post_expense",
      mealType: null,
      reason: "Expense just added",
    };
    setTriggerState(newState);
    onTrigger?.(newState);
  }, [isEnabled, checkDailyLimit, onTrigger]);

  // Dismiss current trigger
  const dismissTrigger = useCallback(() => {
    setTriggerState({ shouldShow: false, triggerType: null, mealType: null, reason: "" });
  }, []);

  // Set up periodic check for meal times
  useEffect(() => {
    if (!isEnabled) return;

    // Check immediately
    evaluateTriggers();

    // Check every 15 minutes
    mealCheckIntervalRef.current = setInterval(() => {
      evaluateTriggers();
    }, 15 * 60 * 1000);

    return () => {
      if (mealCheckIntervalRef.current) {
        clearInterval(mealCheckIntervalRef.current);
      }
    };
  }, [isEnabled, evaluateTriggers]);

  // Trigger planning when group has city
  useEffect(() => {
    if (groupId && hasCity && groupType === "travel") {
      triggerPlanning();
    }
  }, [groupId, hasCity, groupType, triggerPlanning]);

  return {
    ...triggerState,
    triggerPlanning,
    triggerPostExpense,
    dismissTrigger,
    isEnabled,
  };
}
