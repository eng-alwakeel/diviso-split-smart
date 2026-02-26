import { DiceTypeId } from './diceData';

export interface DiceAction {
  labelAr: string;
  labelEn: string;
  icon: string; // lucide icon name
  navigateTo?: string;
  actionType?: 'navigate' | 'set_budget' | 'create_invoice' | 'prompt_cuisine';
}

/**
 * Get the action for a dice result based on dice type and face id
 */
export function getActionForResult(
  diceTypeId: DiceTypeId,
  faceId: string,
  groupId?: string,
  memberId?: string
): DiceAction | null {
  switch (diceTypeId) {
    case 'activity':
      return getActivityAction(faceId, groupId);
    case 'budget':
      return getBudgetAction(faceId);
    case 'whopays':
      return getWhoPaysAction(memberId, groupId);
    case 'task':
      return getTaskAction(faceId, groupId);
    case 'cuisine':
    case 'quick':
    default:
      return null;
  }
}

function getActivityAction(faceId: string, groupId?: string): DiceAction | null {
  const g = groupId ? `?groupId=${groupId}` : '';
  switch (faceId) {
    case 'restaurant':
      return {
        labelAr: 'أضف مصروف مطعم',
        labelEn: 'Add Restaurant Expense',
        icon: 'UtensilsCrossed',
        navigateTo: `/add-expense${g}${g ? '&' : '?'}category=restaurant`,
        actionType: 'prompt_cuisine',
      };
    case 'cafe':
      return {
        labelAr: 'أضف مصروف كافيه',
        labelEn: 'Add Café Expense',
        icon: 'Coffee',
        navigateTo: `/add-expense${g}${g ? '&' : '?'}category=cafe`,
        actionType: 'navigate',
      };
    case 'entertainment':
      return {
        labelAr: 'أضف مصروف ترفيه',
        labelEn: 'Add Entertainment Expense',
        icon: 'Clapperboard',
        navigateTo: `/add-expense${g}${g ? '&' : '?'}category=entertainment`,
        actionType: 'navigate',
      };
    default:
      return null;
  }
}

function getBudgetAction(_faceId: string): DiceAction {
  return {
    labelAr: 'تثبيت ميزانية اليوم',
    labelEn: "Set Today's Budget",
    icon: 'PiggyBank',
    actionType: 'set_budget',
  };
}

function getWhoPaysAction(memberId?: string, groupId?: string): DiceAction {
  const g = groupId ? `?groupId=${groupId}` : '';
  const p = memberId ? `${g ? '&' : '?'}paidBy=${memberId}` : '';
  return {
    labelAr: 'إنشاء فاتورة',
    labelEn: 'Create Invoice',
    icon: 'Receipt',
    navigateTo: `/add-expense${g}${p}`,
    actionType: 'create_invoice',
  };
}

function getTaskAction(faceId: string, groupId?: string): DiceAction | null {
  switch (faceId) {
    case 'add_expense':
      return {
        labelAr: 'أضف مصروف',
        labelEn: 'Add Expense',
        icon: 'Plus',
        navigateTo: groupId ? `/add-expense?groupId=${groupId}` : '/add-expense',
        actionType: 'navigate',
      };
    case 'settle':
      return {
        labelAr: 'سوِّ تسوية',
        labelEn: 'Settle Up',
        icon: 'Handshake',
        navigateTo: groupId ? `/groups/${groupId}/settle` : '/dashboard',
        actionType: 'navigate',
      };
    case 'remind':
      return {
        labelAr: 'ذكّر بالدفع',
        labelEn: 'Send Reminder',
        icon: 'Bell',
        actionType: 'navigate',
      };
    case 'review_report':
      return {
        labelAr: 'راجع التقرير',
        labelEn: 'Review Report',
        icon: 'BarChart3',
        navigateTo: groupId ? `/groups/${groupId}/report` : '/dashboard',
        actionType: 'navigate',
      };
    case 'rename_group':
      return {
        labelAr: 'عدّل اسم المجموعة',
        labelEn: 'Edit Group Name',
        icon: 'Pencil',
        navigateTo: groupId ? `/group/${groupId}/settings` : '/dashboard',
        actionType: 'navigate',
      };
    case 'invite_member':
      return {
        labelAr: 'ادعُ عضو جديد',
        labelEn: 'Invite Member',
        icon: 'UserPlus',
        navigateTo: groupId ? `/group/${groupId}/settings` : '/dashboard',
        actionType: 'navigate',
      };
    default:
      return null;
  }
}
