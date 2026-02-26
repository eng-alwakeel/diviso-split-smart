export interface DiceFace {
  id: string;
  emoji: string;
  labelAr: string;
  labelEn: string;
  weight?: number;
}

export type DiceTypeId = 'activity' | 'cuisine' | 'budget' | 'whopays' | 'task' | 'quick';

export interface DiceType {
  id: DiceTypeId;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  faces: DiceFace[];
  color: string;
  icon: string;
}

export interface DiceResult {
  diceType: DiceType;
  face: DiceFace;
  timestamp: Date;
}

export interface DualDiceResult {
  activity: DiceResult;
  food?: DiceResult;
  cuisine?: DiceResult;
  budget?: DiceResult;
}

export interface DiceContext {
  groupType?: string;
  memberCount?: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  lastActivity?: string;
  outstandingBalance?: number;
  avgSpending?: number;
}

// ── Activity Dice ──
export const ACTIVITY_FACES: DiceFace[] = [
  { id: 'restaurant', emoji: '🍽️', labelAr: 'مطعم', labelEn: 'Restaurant' },
  { id: 'cafe', emoji: '☕', labelAr: 'كافيه', labelEn: 'Café' },
  { id: 'home', emoji: '🏠', labelAr: 'جلسة بيت', labelEn: 'Stay Home' },
  { id: 'drive', emoji: '🚗', labelAr: 'طلعة سريعة', labelEn: 'Quick Drive' },
  { id: 'entertainment', emoji: '🎬', labelAr: 'ترفيه / سينما', labelEn: 'Entertainment' },
  { id: 'outdoor', emoji: '🏕️', labelAr: 'هواء طلق / بر', labelEn: 'Outdoors' }
];

// ── Cuisine Dice (replaces old Food Dice) ──
export const CUISINE_FACES: DiceFace[] = [
  { id: 'saudi', emoji: '🇸🇦', labelAr: 'سعودي', labelEn: 'Saudi' },
  { id: 'american', emoji: '🇺🇸', labelAr: 'أمريكي', labelEn: 'American' },
  { id: 'mexican', emoji: '🇲🇽', labelAr: 'مكسيكي', labelEn: 'Mexican' },
  { id: 'italian', emoji: '🇮🇹', labelAr: 'إيطالي', labelEn: 'Italian' },
  { id: 'asian', emoji: '🥢', labelAr: 'آسيوي', labelEn: 'Asian' },
  { id: 'surprise', emoji: '🎲', labelAr: 'مفاجأة', labelEn: 'Surprise' }
];

// ── Budget Dice ──
export const BUDGET_FACES: DiceFace[] = [
  { id: 'ultra_cheap', emoji: '💸', labelAr: 'اقتصادي جداً', labelEn: 'Ultra Budget' },
  { id: 'range_20_40', emoji: '💵', labelAr: '20–40', labelEn: '20–40' },
  { id: 'range_40_70', emoji: '💰', labelAr: '40–70', labelEn: '40–70' },
  { id: 'range_70_120', emoji: '🤑', labelAr: '70–120', labelEn: '70–120' },
  { id: 'range_150_plus', emoji: '💎', labelAr: '150+', labelEn: '150+' },
  { id: 'no_budget', emoji: '😅', labelAr: 'بدون ميزانية', labelEn: 'No Budget' }
];

// ── Who Pays Dice (uses group members dynamically, these are placeholder faces) ──
export const WHOPAYS_FACES: DiceFace[] = [
  { id: 'random_member', emoji: '👤', labelAr: 'عضو عشوائي', labelEn: 'Random Member' }
];

// ── Daily Task Dice ──
export const TASK_FACES: DiceFace[] = [
  { id: 'add_expense', emoji: '➕', labelAr: 'أضف مصروف', labelEn: 'Add Expense' },
  { id: 'settle', emoji: '🤝', labelAr: 'سوِّ تسوية', labelEn: 'Settle Up' },
  { id: 'remind', emoji: '🔔', labelAr: 'ذكّر بالدفع', labelEn: 'Send Reminder' },
  { id: 'review_report', emoji: '📊', labelAr: 'راجع تقرير الأسبوع', labelEn: 'Review Weekly Report' },
  { id: 'rename_group', emoji: '✏️', labelAr: 'عدّل اسم المجموعة', labelEn: 'Edit Group Name' },
  { id: 'invite_member', emoji: '👋', labelAr: 'ادعُ عضو جديد', labelEn: 'Invite Member' }
];

// ── Legacy aliases for backward compatibility ──
export const FOOD_FACES = CUISINE_FACES;

// ── Dice Type Definitions ──
export const ACTIVITY_DICE: DiceType = {
  id: 'activity',
  nameAr: 'نرد الطلعة',
  nameEn: 'Activity Dice',
  descriptionAr: 'وش نسوي؟',
  descriptionEn: 'What to do?',
  color: 'from-blue-500 to-indigo-600',
  icon: '🎯',
  faces: ACTIVITY_FACES
};

export const CUISINE_DICE: DiceType = {
  id: 'cuisine',
  nameAr: 'نرد المطابخ',
  nameEn: 'Cuisine Dice',
  descriptionAr: 'أي مطبخ نجرب؟',
  descriptionEn: 'Which cuisine?',
  color: 'from-orange-500 to-red-600',
  icon: '🍽️',
  faces: CUISINE_FACES
};

export const BUDGET_DICE: DiceType = {
  id: 'budget',
  nameAr: 'نرد الميزانية',
  nameEn: 'Budget Dice',
  descriptionAr: 'كم نصرف؟',
  descriptionEn: 'How much to spend?',
  color: 'from-emerald-500 to-teal-600',
  icon: '💰',
  faces: BUDGET_FACES
};

export const WHOPAYS_DICE: DiceType = {
  id: 'whopays',
  nameAr: 'نرد مين يدفع',
  nameEn: 'Who Pays Dice',
  descriptionAr: 'مين يدفع اليوم؟',
  descriptionEn: 'Who pays today?',
  color: 'from-violet-500 to-purple-600',
  icon: '👥',
  faces: WHOPAYS_FACES
};

export const TASK_DICE: DiceType = {
  id: 'task',
  nameAr: 'نرد مهمة اليوم',
  nameEn: 'Daily Task Dice',
  descriptionAr: 'وش أسوي في Diviso اليوم؟',
  descriptionEn: 'What to do in Diviso today?',
  color: 'from-amber-500 to-orange-600',
  icon: '✅',
  faces: TASK_FACES
};

export const QUICK_DICE: DiceType = {
  id: 'quick',
  nameAr: 'قرار سريع',
  nameEn: 'Quick Decision',
  descriptionAr: 'طلعة + مطبخ بضغطة واحدة',
  descriptionEn: 'Activity + Cuisine in one tap',
  color: 'from-purple-500 to-pink-600',
  icon: '⚡',
  faces: [] // Uses combined dice
};

// Legacy alias
export const FOOD_DICE = CUISINE_DICE;

// All dice types (excluding quick which is a mode)
export const DICE_TYPES: DiceType[] = [
  ACTIVITY_DICE,
  CUISINE_DICE,
  BUDGET_DICE,
  WHOPAYS_DICE,
  TASK_DICE,
  QUICK_DICE
];

// Dice types without quick (for picker display of individual types)
export const INDIVIDUAL_DICE_TYPES: DiceType[] = [
  ACTIVITY_DICE,
  CUISINE_DICE,
  BUDGET_DICE,
  WHOPAYS_DICE,
  TASK_DICE,
];

// Helper to get dice by id
export const getDiceById = (id: string): DiceType | undefined => {
  return DICE_TYPES.find(dice => dice.id === id);
};

// Helper to get random face from a dice
export const getRandomFace = (dice: DiceType): DiceFace => {
  const faces = dice.id === 'quick' ? ACTIVITY_FACES : dice.faces;
  const randomIndex = Math.floor(Math.random() * faces.length);
  return faces[randomIndex];
};

// Helper to determine which dice to show based on group type
export const getDiceForGroupType = (groupType?: string): DiceType[] => {
  switch (groupType) {
    case 'friends':
      return [ACTIVITY_DICE, CUISINE_DICE, BUDGET_DICE, WHOPAYS_DICE, QUICK_DICE];
    case 'trip':
      return [ACTIVITY_DICE, CUISINE_DICE, BUDGET_DICE, QUICK_DICE];
    case 'home':
      return [ACTIVITY_DICE, CUISINE_DICE, BUDGET_DICE];
    case 'work':
      return [ACTIVITY_DICE, BUDGET_DICE, TASK_DICE];
    default:
      return DICE_TYPES;
  }
};

// Check if activity result should prompt cuisine dice
export const shouldPromptCuisineDice = (activityFace: DiceFace): boolean => {
  return activityFace.id === 'restaurant';
};

// Legacy alias
export const shouldPromptFoodDice = shouldPromptCuisineDice;
