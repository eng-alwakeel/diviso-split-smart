/**
 * Guest Conversion — Migrate guest localStorage data to Supabase on registration.
 */

import { supabase } from '@/integrations/supabase/client';
import { getAllGuestData, clearGuestData } from './guestDataStore';
import { clearGuestSession } from './guestSessionManager';

export interface MigrationResult {
  status: 'success' | 'partial' | 'failed';
  groupsMigrated: number;
  expensesMigrated: number;
  plansMigrated: number;
  errors: string[];
}

export async function migrateGuestData(userId: string): Promise<MigrationResult> {
  const data = getAllGuestData();
  const result: MigrationResult = {
    status: 'success',
    groupsMigrated: 0,
    expensesMigrated: 0,
    plansMigrated: 0,
    errors: [],
  };

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
          owner_id: userId,
          status: 'draft',
        })
        .select('id')
        .single();

      if (!error && newGroup) {
        groupIdMap.set(group.id, newGroup.id);
        result.groupsMigrated++;
      } else if (error) {
        result.errors.push(`Group "${group.name}": ${error.message}`);
      }
    } catch (e: any) {
      result.errors.push(`Group "${group.name}": ${e.message || 'Unknown error'}`);
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

      if (!error) {
        result.expensesMigrated++;
      } else {
        result.errors.push(`Expense "${expense.description}": ${error.message}`);
      }
    } catch (e: any) {
      result.errors.push(`Expense "${expense.description}": ${e.message || 'Unknown error'}`);
    }
  }

  // Migrate plans
  for (const plan of data.plans) {
    try {
      const { error } = await supabase
        .from('plans')
        .insert({
          title: plan.name,
          destination: plan.destination || null,
          start_date: plan.start_date || null,
          end_date: plan.end_date || null,
          owner_user_id: userId,
          plan_type: 'trip',
          status: 'draft',
        });

      if (!error) {
        result.plansMigrated++;
      } else {
        result.errors.push(`Plan "${plan.name}": ${error.message}`);
      }
    } catch (e: any) {
      result.errors.push(`Plan "${plan.name}": ${e.message || 'Unknown error'}`);
    }
  }

  // Determine overall status
  const totalItems = data.groups.length + data.expenses.length + data.plans.length;
  const totalMigrated = result.groupsMigrated + result.expensesMigrated + result.plansMigrated;

  if (totalMigrated === 0 && totalItems > 0) {
    result.status = 'failed';
    // Don't clear data on complete failure — allow retry
    console.error('[GuestConversion] Migration failed:', result.errors);
    return result;
  }

  if (result.errors.length > 0) {
    result.status = 'partial';
  }

  // Clear guest data only on success or partial success
  clearGuestData();
  clearGuestSession();

  if (import.meta.env.DEV) {
    console.log('[GuestConversion] Migration complete:', result);
  }

  return result;
}

/**
 * Check if there's guest data pending conversion
 */
export function hasGuestDataToMigrate(): boolean {
  const data = getAllGuestData();
  return data.groups.length > 0 || data.expenses.length > 0 || data.plans.length > 0;
}
