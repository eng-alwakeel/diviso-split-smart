import { useState, useCallback, useEffect } from 'react';
import {
  getGuestSession,
  getOrCreateGuestSession,
  clearGuestSession,
  isGuestSession as checkIsGuest,
  type GuestSession,
} from '@/services/guestSession/guestSessionManager';
import {
  getGuestGroups,
  getGuestExpenses,
  getGuestPlans,
  addGuestGroup,
  addGuestExpense,
  updateGuestGroup,
  updateGuestExpense,
  deleteGuestGroup,
  deleteGuestExpense,
  addGuestPlan,
  updateGuestPlan,
  type GuestGroup,
  type GuestExpense,
  type GuestPlan,
} from '@/services/guestSession/guestDataStore';

export function useGuestSession() {
  const [session, setSession] = useState<GuestSession | null>(() => getGuestSession());
  const [groups, setGroups] = useState<GuestGroup[]>(() => getGuestGroups());
  const [expenses, setExpenses] = useState<GuestExpense[]>(() => getGuestExpenses());
  const [plans, setPlans] = useState<GuestPlan[]>(() => getGuestPlans());

  const isGuest = session !== null;

  const refresh = useCallback(() => {
    setGroups(getGuestGroups());
    setExpenses(getGuestExpenses());
    setPlans(getGuestPlans());
  }, []);

  const startGuestSession = useCallback(() => {
    const s = getOrCreateGuestSession();
    setSession(s);
    return s;
  }, []);

  const endGuestSession = useCallback(() => {
    clearGuestSession();
    setSession(null);
  }, []);

  const createGroup = useCallback((name: string, currency?: string) => {
    const g = addGuestGroup(name, currency);
    refresh();
    return g;
  }, [refresh]);

  const createExpense = useCallback((expense: Parameters<typeof addGuestExpense>[0]) => {
    const e = addGuestExpense(expense);
    refresh();
    return e;
  }, [refresh]);

  const editGroup = useCallback((id: string, updates: Parameters<typeof updateGuestGroup>[1]) => {
    updateGuestGroup(id, updates);
    refresh();
  }, [refresh]);

  const editExpense = useCallback((id: string, updates: Parameters<typeof updateGuestExpense>[1]) => {
    updateGuestExpense(id, updates);
    refresh();
  }, [refresh]);

  const removeGroup = useCallback((id: string) => {
    deleteGuestGroup(id);
    refresh();
  }, [refresh]);

  const removeExpense = useCallback((id: string) => {
    deleteGuestExpense(id);
    refresh();
  }, [refresh]);

  const createPlan = useCallback((plan: Parameters<typeof addGuestPlan>[0]) => {
    const p = addGuestPlan(plan);
    refresh();
    return p;
  }, [refresh]);

  const editPlan = useCallback((id: string, updates: Parameters<typeof updateGuestPlan>[1]) => {
    updateGuestPlan(id, updates);
    refresh();
  }, [refresh]);

  return {
    isGuest,
    session,
    startGuestSession,
    endGuestSession,
    groups,
    expenses,
    plans,
    createGroup,
    createExpense,
    editGroup,
    editExpense,
    removeGroup,
    removeExpense,
    createPlan,
    editPlan,
    refresh,
  };
}
