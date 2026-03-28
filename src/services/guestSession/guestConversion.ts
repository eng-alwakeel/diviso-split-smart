/**
 * Guest Conversion — Migrate guest localStorage data to Supabase on registration.
 */

import { supabase } from '@/integrations/supabase/client';
import { getAllGuestData, clearGuestData } from './guestDataStore';
import { clearGuestSession } from './guestSessionManager';

export async function migrateGuestData(userId: string): Promise<{ groupsMigrated: number; expensesMigrated: number; plansMigrated: number }> {
  const data = getAllGuestData();
  let groupsMigrated = 0;
  let expensesMigrated = 0;
  let plansMigrated = 0;

  // Map old guest group IDs to new Supabase group IDs
  const groupIdMap = new Map<string, string>();

  // Migrate groups
  for (const group of data.groups) {
    try {
      const { data: newGroup, error } = await supabase
        .from('groups')
        .insert({
          name: group.name,
          currency: group.currency,
          created_by: userId,
          status: 'draft',
        })
        .select('id')
        .single();

      if (!error && newGroup) {
        groupIdMap.set(group.id, newGroup.id);
        groupsMigrated++;
      }
    } catch (e) {
      console.error('[GuestConversion] Failed to migrate group:', group.id, e);
    }
  }

  // Migrate expenses
  for (const expense of data.expenses) {
    const newGroupId = groupIdMap.get(expense.group_id);
    if (!newGroupId) continue;

    try {
      const { error } = await supabase
        .from('expenses')
        .insert({
          group_id: newGroupId,
          description: expense.description,
          amount: expense.amount,
          currency: expense.currency,
          created_by: userId,
          payer_id: userId,
        });

      if (!error) expensesMigrated++;
    } catch (e) {
      console.error('[GuestConversion] Failed to migrate expense:', expense.id, e);
    }
  }

  // Migrate plans
  for (const plan of data.plans) {
    try {
      const { error } = await supabase
        .from('plans')
        .insert({
          name: plan.name,
          destination: plan.destination || null,
          start_date: plan.start_date || null,
          end_date: plan.end_date || null,
          created_by: userId,
          status: 'draft',
        });

      if (!error) plansMigrated++;
    } catch (e) {
      console.error('[GuestConversion] Failed to migrate plan:', plan.id, e);
    }
  }

  // Clear guest data after successful migration
  clearGuestData();
  clearGuestSession();

  if (import.meta.env.DEV) {
    console.log('[GuestConversion] Migration complete:', { groupsMigrated, expensesMigrated, plansMigrated });
  }

  return { groupsMigrated, expensesMigrated, plansMigrated };
}

/**
 * Check if there's guest data pending conversion
 */
export function hasGuestDataToMigrate(): boolean {
  const data = getAllGuestData();
  return data.groups.length > 0 || data.expenses.length > 0 || data.plans.length > 0;
}
