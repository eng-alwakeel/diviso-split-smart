export interface DiceFace {
  id: string;
  emoji: string;
  labelAr: string;
  labelEn: string;
}

export interface DiceType {
  id: 'activity' | 'food' | 'quick';
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
  food: DiceResult;
}

export interface DiceContext {
  groupType?: string;
  memberCount?: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  lastActivity?: string;
}

export const ACTIVITY_FACES: DiceFace[] = [
  { id: 'restaurant', emoji: '🍽️', labelAr: 'مطعم', labelEn: 'Restaurant' },
  { id: 'cafe', emoji: '☕', labelAr: 'كافيه', labelEn: 'Café' },
  { id: 'home', emoji: '🏠', labelAr: 'جلسة بيت', labelEn: 'Stay Home' },
  { id: 'drive', emoji: '🚗', labelAr: 'طلعة سريعة', labelEn: 'Quick Drive' },
  { id: 'entertainment', emoji: '🎬', labelAr: 'ترفيه / سينما', labelEn: 'Entertainment' },
  { id: 'outdoor', emoji: '🏕️', labelAr: 'هواء طلق / بر', labelEn: 'Outdoors' }
];

export const FOOD_FACES: DiceFace[] = [
  { id: 'rice', emoji: '🍚', labelAr: 'أكلة رز', labelEn: 'Rice Dish' },
  { id: 'stew', emoji: '🍲', labelAr: 'مرق / يخنة', labelEn: 'Stew' },
  { id: 'chicken', emoji: '🍗', labelAr: 'دجاج', labelEn: 'Chicken' },
  { id: 'meat', emoji: '🥩', labelAr: 'لحم', labelEn: 'Meat' },
  { id: 'healthy', emoji: '🥗', labelAr: 'خفيف / صحي', labelEn: 'Light/Healthy' },
  { id: 'surprise', emoji: '🎲', labelAr: 'مفاجأة', labelEn: 'Surprise' }
];

export const ACTIVITY_DICE: DiceType = {
  id: 'activity',
  nameAr: 'نرد النشاط',
  nameEn: 'Activity Dice',
  descriptionAr: 'وش نسوي؟',
  descriptionEn: 'What to do?',
  color: 'from-blue-500 to-indigo-600',
  icon: '🎯',
  faces: ACTIVITY_FACES
};

export const FOOD_DICE: DiceType = {
  id: 'food',
  nameAr: 'نرد الأكل',
  nameEn: 'Food Dice',
  descriptionAr: 'وش نأكل؟',
  descriptionEn: 'What to eat?',
  color: 'from-orange-500 to-red-600',
  icon: '🍽️',
  faces: FOOD_FACES
};

export const QUICK_DICE: DiceType = {
  id: 'quick',
  nameAr: 'قرار سريع',
  nameEn: 'Quick Decision',
  descriptionAr: 'نشاط + أكل بضغطة واحدة',
  descriptionEn: 'Activity + Food in one tap',
  color: 'from-purple-500 to-pink-600',
  icon: '⚡',
  faces: [] // Uses both dice
};

export const DICE_TYPES: DiceType[] = [
  ACTIVITY_DICE,
  FOOD_DICE,
  QUICK_DICE
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
      return [ACTIVITY_DICE, FOOD_DICE];
    case 'trip':
    case 'home':
    case 'work':
      return [ACTIVITY_DICE];
    default:
      return [ACTIVITY_DICE, FOOD_DICE];
  }
};

// Check if activity result should prompt food dice
export const shouldPromptFoodDice = (activityFace: DiceFace): boolean => {
  return activityFace.id === 'restaurant';
};
