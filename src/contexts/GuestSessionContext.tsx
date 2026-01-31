import React, { createContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Types
export interface GuestMember {
  id: string;
  name: string;
  avatar: string;
}

export interface GuestExpense {
  id: string;
  description: string;
  amount: number;
  paidById: string;
  splitType: 'equal' | 'percentage' | 'custom';
  splits?: { memberId: string; value: number }[];
  createdAt: number;
}

export interface GuestGroup {
  id: string;
  name: string;
  currency: string;
  members: GuestMember[];
  expenses: GuestExpense[];
  createdAt: number;
  scenarioId?: string;
}

export interface GuestSessionState {
  sessionId: string;
  groups: GuestGroup[];
  completedScenarios: string[];
  totalExpensesAdded: number;
  sessionStartTime: number;
  hasSeenConversionPrompt: boolean;
  savedAt: number;
}

// Actions
type GuestAction =
  | { type: 'INIT_SESSION'; payload: GuestSessionState }
  | { type: 'ADD_GROUP'; payload: GuestGroup }
  | { type: 'REMOVE_GROUP'; payload: string }
  | { type: 'ADD_EXPENSE'; payload: { groupId: string; expense: GuestExpense } }
  | { type: 'REMOVE_EXPENSE'; payload: { groupId: string; expenseId: string } }
  | { type: 'COMPLETE_SCENARIO'; payload: string }
  | { type: 'SHOW_CONVERSION_PROMPT' }
  | { type: 'CLEAR_SESSION' };

// Constants
const STORAGE_KEY = 'diviso_guest_session';
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// Generate UUID
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Initial state factory
const createInitialState = (): GuestSessionState => ({
  sessionId: generateUUID(),
  groups: [],
  completedScenarios: [],
  totalExpensesAdded: 0,
  sessionStartTime: Date.now(),
  hasSeenConversionPrompt: false,
  savedAt: Date.now(),
});

// Reducer
function guestSessionReducer(state: GuestSessionState, action: GuestAction): GuestSessionState {
  switch (action.type) {
    case 'INIT_SESSION':
      return action.payload;
      
    case 'ADD_GROUP':
      return {
        ...state,
        groups: [...state.groups, action.payload],
        savedAt: Date.now(),
      };
      
    case 'REMOVE_GROUP':
      return {
        ...state,
        groups: state.groups.filter(g => g.id !== action.payload),
        savedAt: Date.now(),
      };
      
    case 'ADD_EXPENSE':
      return {
        ...state,
        groups: state.groups.map(g => 
          g.id === action.payload.groupId
            ? { ...g, expenses: [...g.expenses, action.payload.expense] }
            : g
        ),
        totalExpensesAdded: state.totalExpensesAdded + 1,
        savedAt: Date.now(),
      };
      
    case 'REMOVE_EXPENSE':
      return {
        ...state,
        groups: state.groups.map(g => 
          g.id === action.payload.groupId
            ? { ...g, expenses: g.expenses.filter(e => e.id !== action.payload.expenseId) }
            : g
        ),
        savedAt: Date.now(),
      };
      
    case 'COMPLETE_SCENARIO':
      if (state.completedScenarios.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        completedScenarios: [...state.completedScenarios, action.payload],
        savedAt: Date.now(),
      };
      
    case 'SHOW_CONVERSION_PROMPT':
      return {
        ...state,
        hasSeenConversionPrompt: true,
        savedAt: Date.now(),
      };
      
    case 'CLEAR_SESSION':
      return createInitialState();
      
    default:
      return state;
  }
}

// Context type
interface GuestSessionContextType {
  state: GuestSessionState;
  isGuestMode: boolean;
  addGroup: (group: Omit<GuestGroup, 'id' | 'createdAt'>) => string;
  removeGroup: (groupId: string) => void;
  addExpense: (groupId: string, expense: Omit<GuestExpense, 'id' | 'createdAt'>) => void;
  removeExpense: (groupId: string, expenseId: string) => void;
  completeScenario: (scenarioId: string) => void;
  markConversionPromptSeen: () => void;
  clearSession: () => void;
  shouldShowConversionPrompt: () => boolean;
  getConversionMessage: () => string;
  syncToDatabase: () => Promise<void>;
}

// Context
export const GuestSessionContext = createContext<GuestSessionContextType | null>(null);

// Provider
export const GuestSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(guestSessionReducer, null, () => {
    // Try to load from storage on init
    try {
      const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as GuestSessionState;
        // Check expiry
        if (Date.now() - parsed.savedAt < SESSION_EXPIRY_MS) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load guest session:', e);
    }
    return createInitialState();
  });

  // Persist to storage on state change
  useEffect(() => {
    const data = JSON.stringify(state);
    try {
      sessionStorage.setItem(STORAGE_KEY, data);
      localStorage.setItem(STORAGE_KEY, data);
    } catch (e) {
      console.error('Failed to save guest session:', e);
    }
  }, [state]);

  // Check if in guest mode (has groups or completed scenarios)
  const isGuestMode = useMemo(() => 
    state.groups.length > 0 || state.completedScenarios.length > 0,
    [state.groups.length, state.completedScenarios.length]
  );

  // Add group
  const addGroup = useCallback((group: Omit<GuestGroup, 'id' | 'createdAt'>): string => {
    const id = `g-${Date.now()}`;
    dispatch({
      type: 'ADD_GROUP',
      payload: { ...group, id, createdAt: Date.now() },
    });
    return id;
  }, []);

  // Remove group
  const removeGroup = useCallback((groupId: string) => {
    dispatch({ type: 'REMOVE_GROUP', payload: groupId });
  }, []);

  // Add expense
  const addExpense = useCallback((groupId: string, expense: Omit<GuestExpense, 'id' | 'createdAt'>) => {
    dispatch({
      type: 'ADD_EXPENSE',
      payload: {
        groupId,
        expense: { ...expense, id: `e-${Date.now()}`, createdAt: Date.now() },
      },
    });
  }, []);

  // Remove expense
  const removeExpense = useCallback((groupId: string, expenseId: string) => {
    dispatch({ type: 'REMOVE_EXPENSE', payload: { groupId, expenseId } });
  }, []);

  // Complete scenario
  const completeScenario = useCallback((scenarioId: string) => {
    dispatch({ type: 'COMPLETE_SCENARIO', payload: scenarioId });
  }, []);

  // Mark conversion prompt seen
  const markConversionPromptSeen = useCallback(() => {
    dispatch({ type: 'SHOW_CONVERSION_PROMPT' });
  }, []);

  // Clear session
  const clearSession = useCallback(() => {
    dispatch({ type: 'CLEAR_SESSION' });
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear guest session:', e);
    }
  }, []);

  // Conversion triggers
  const CONVERSION_TRIGGERS = {
    scenarios_completed: 2,
    expenses_added: 3,
    time_spent_seconds: 120,
  };

  // Should show conversion prompt
  const shouldShowConversionPrompt = useCallback((): boolean => {
    if (state.hasSeenConversionPrompt) return false;
    
    const timeSpent = (Date.now() - state.sessionStartTime) / 1000;
    
    return (
      state.completedScenarios.length >= CONVERSION_TRIGGERS.scenarios_completed ||
      state.totalExpensesAdded >= CONVERSION_TRIGGERS.expenses_added ||
      timeSpent >= CONVERSION_TRIGGERS.time_spent_seconds
    );
  }, [state]);

  // Get conversion message
  const getConversionMessage = useCallback((): string => {
    if (state.totalExpensesAdded >= 3) {
      return "واضح إنك فهمت الفكرة 👌\nسجّل الآن وخليها حقيقية";
    }
    if (state.completedScenarios.length >= 2) {
      return "جربت أكثر من سيناريو!\nجاهز تبدأ مجموعتك الحقيقية؟";
    }
    return "عجبتك التجربة؟\nسجّل مجانًا واحصل على 50 نقطة 🎁";
  }, [state.totalExpensesAdded, state.completedScenarios.length]);

  // Sync to database
  const syncToDatabase = useCallback(async () => {
    try {
      await supabase.from('demo_sessions').insert({
        session_id: state.sessionId,
        scenarios_tried: state.completedScenarios,
        expenses_count: state.totalExpensesAdded,
        groups_created: state.groups.length,
        time_spent_seconds: Math.round((Date.now() - state.sessionStartTime) / 1000),
      });
    } catch (e) {
      console.error('Failed to sync guest session to database:', e);
    }
  }, [state]);

  const value = useMemo(() => ({
    state,
    isGuestMode,
    addGroup,
    removeGroup,
    addExpense,
    removeExpense,
    completeScenario,
    markConversionPromptSeen,
    clearSession,
    shouldShowConversionPrompt,
    getConversionMessage,
    syncToDatabase,
  }), [
    state,
    isGuestMode,
    addGroup,
    removeGroup,
    addExpense,
    removeExpense,
    completeScenario,
    markConversionPromptSeen,
    clearSession,
    shouldShowConversionPrompt,
    getConversionMessage,
    syncToDatabase,
  ]);

  return (
    <GuestSessionContext.Provider value={value}>
      {children}
    </GuestSessionContext.Provider>
  );
};
