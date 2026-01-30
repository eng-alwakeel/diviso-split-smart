// Demo scenarios data for the /launch interactive experience

export interface DemoMember {
  id: string;
  name: string;
  avatar: string; // First letter(s) for avatar display
}

export interface DemoExpense {
  id: string;
  description: string;
  amount: number;
  paidById: string;
  icon: string; // emoji
}

export interface DemoScenario {
  id: ScenarioType;
  icon: string;
  title: string;
  subtitle: string;
  groupName: string;
  currency: string;
  members: DemoMember[];
  expenses: DemoExpense[];
  tier: 'primary' | 'secondary';
  shareText: string;
}

export const DEFAULT_SHARE_TEXT = 'أي مشاركة فيها أكثر من شخص. Diviso ينظم المصاريف بدون إحراج.';

export type ScenarioType = 
  | 'travel' | 'friends' | 'housing'  // Primary
  | 'activities' | 'desert' | 'groups' | 'family' | 'carpool' | 'events' | 'friday';  // Secondary

export const DEMO_SCENARIOS: DemoScenario[] = [
  // ===== PRIMARY SCENARIOS =====
  {
    id: 'travel',
    tier: 'primary',
    icon: '✈️',
    title: 'سفر',
    subtitle: 'رحلة مع أصحابك',
    groupName: 'رحلة دبي',
    currency: 'ر.س',
    shareText: 'مسافرين مع بعض؟ دايم واحد يدفع أكثر 😅 Diviso يقسم المصاريف بعدل ويطلع لكل واحد له أو عليه.',
    members: [
      { id: 'm1', name: 'أحمد', avatar: 'أ' },
      { id: 'm2', name: 'سعود', avatar: 'س' },
      { id: 'm3', name: 'فيصل', avatar: 'ف' },
      { id: 'm4', name: 'خالد', avatar: 'خ' },
    ],
    expenses: [
      { id: 'e1', description: 'حجز الفندق', amount: 2400, paidById: 'm1', icon: '🏨' },
      { id: 'e2', description: 'عشاء المطعم', amount: 360, paidById: 'm2', icon: '🍽️' },
      { id: 'e3', description: 'أوبر', amount: 180, paidById: 'm3', icon: '🚗' },
    ],
  },
  {
    id: 'friends',
    tier: 'primary',
    icon: '🧑‍🤝‍🧑',
    title: 'طلعة أصدقاء',
    subtitle: 'مطعم – قهوة – بنزين',
    groupName: 'شلة الجمعة',
    currency: 'ر.س',
    shareText: 'طلعة مطعم؟ قهوة؟ بنزين؟ Diviso يخلي القسمة واضحة بدون نقاش.',
    members: [
      { id: 'm1', name: 'محمد', avatar: 'م' },
      { id: 'm2', name: 'عبدالله', avatar: 'ع' },
      { id: 'm3', name: 'ناصر', avatar: 'ن' },
      { id: 'm4', name: 'سعد', avatar: 'س' },
    ],
    expenses: [
      { id: 'e1', description: 'عشاء', amount: 450, paidById: 'm1', icon: '🍔' },
      { id: 'e2', description: 'قهوة', amount: 120, paidById: 'm2', icon: '☕' },
      { id: 'e3', description: 'بنزين', amount: 80, paidById: 'm3', icon: '⛽' },
    ],
  },
  {
    id: 'housing',
    tier: 'primary',
    icon: '🏠',
    title: 'سكن مشترك',
    subtitle: 'إيجار – فواتير – مشتريات',
    groupName: 'شقة الشباب',
    currency: 'ر.س',
    shareText: 'إيجار، كهرباء، مشتريات؟ Diviso ينظم السكن المشترك بعدل.',
    members: [
      { id: 'm1', name: 'يوسف', avatar: 'ي' },
      { id: 'm2', name: 'عمر', avatar: 'ع' },
      { id: 'm3', name: 'سلطان', avatar: 'س' },
      { id: 'm4', name: 'ماجد', avatar: 'م' },
    ],
    expenses: [
      { id: 'e1', description: 'إيجار الشهر', amount: 4000, paidById: 'm1', icon: '🏠' },
      { id: 'e2', description: 'فاتورة الكهرباء', amount: 300, paidById: 'm2', icon: '💡' },
      { id: 'e3', description: 'مشتريات البيت', amount: 250, paidById: 'm3', icon: '🛒' },
    ],
  },
  
  // ===== SECONDARY SCENARIOS =====
  {
    id: 'activities',
    tier: 'secondary',
    icon: '🎯',
    title: 'نشاط',
    subtitle: 'بولينج – سينما – ألعاب',
    groupName: 'شلة النشاط',
    currency: 'ر.س',
    shareText: 'نشاط جماعي = مصاريف جماعية. Diviso يقسمها بسهولة.',
    members: [
      { id: 'm1', name: 'راكان', avatar: 'ر' },
      { id: 'm2', name: 'تركي', avatar: 'ت' },
      { id: 'm3', name: 'بدر', avatar: 'ب' },
      { id: 'm4', name: 'فهد', avatar: 'ف' },
    ],
    expenses: [
      { id: 'e1', description: 'بولينج', amount: 200, paidById: 'm1', icon: '🎳' },
      { id: 'e2', description: 'سينما', amount: 160, paidById: 'm2', icon: '🎬' },
      { id: 'e3', description: 'عشاء', amount: 280, paidById: 'm3', icon: '🍕' },
    ],
  },
  {
    id: 'desert',
    tier: 'secondary',
    icon: '🏕️',
    title: 'رحلة بر',
    subtitle: 'مخيم – أكل – معدات',
    groupName: 'رحلة البر',
    currency: 'ر.س',
    shareText: 'رحلة بر؟ أكل وبنزين ومستلزمات. Diviso يحسبها عليكم بدون لخبطة.',
    members: [
      { id: 'm1', name: 'سلمان', avatar: 'س' },
      { id: 'm2', name: 'عبدالرحمن', avatar: 'ع' },
      { id: 'm3', name: 'نواف', avatar: 'ن' },
      { id: 'm4', name: 'مشاري', avatar: 'م' },
    ],
    expenses: [
      { id: 'e1', description: 'خيمة ومعدات', amount: 350, paidById: 'm1', icon: '⛺' },
      { id: 'e2', description: 'لحم وأكل', amount: 400, paidById: 'm2', icon: '🥩' },
      { id: 'e3', description: 'فحم وحطب', amount: 100, paidById: 'm3', icon: '🔥' },
    ],
  },
  {
    id: 'groups',
    tier: 'secondary',
    icon: '👥',
    title: 'مجموعة',
    subtitle: 'فعاليات أو اشتراك جماعي',
    groupName: 'المجموعة',
    currency: 'ر.س',
    shareText: 'أي مجموعة فيها أكثر من شخص. Diviso يخلي الحساب عادل للجميع.',
    members: [
      { id: 'm1', name: 'حسن', avatar: 'ح' },
      { id: 'm2', name: 'علي', avatar: 'ع' },
      { id: 'm3', name: 'حمد', avatar: 'ح' },
      { id: 'm4', name: 'زياد', avatar: 'ز' },
    ],
    expenses: [
      { id: 'e1', description: 'اشتراك Netflix', amount: 60, paidById: 'm1', icon: '📺' },
      { id: 'e2', description: 'حجز ملعب', amount: 200, paidById: 'm2', icon: '⚽' },
      { id: 'e3', description: 'مشروبات', amount: 80, paidById: 'm3', icon: '🥤' },
    ],
  },
  {
    id: 'family',
    tier: 'secondary',
    icon: '👨‍👩‍👧',
    title: 'عائلة',
    subtitle: 'رحلة أو مصاريف عائلية',
    groupName: 'العائلة',
    currency: 'ر.س',
    shareText: 'مصاريف عائلية؟ Diviso يخلي كل شيء واضح ومرتاح.',
    members: [
      { id: 'm1', name: 'أبو محمد', avatar: 'أ' },
      { id: 'm2', name: 'أبو خالد', avatar: 'أ' },
      { id: 'm3', name: 'أبو سعود', avatar: 'أ' },
      { id: 'm4', name: 'أبو عبدالله', avatar: 'أ' },
    ],
    expenses: [
      { id: 'e1', description: 'حجز شاليه', amount: 800, paidById: 'm1', icon: '🏖️' },
      { id: 'e2', description: 'غداء', amount: 350, paidById: 'm2', icon: '🍖' },
      { id: 'e3', description: 'ألعاب الأطفال', amount: 150, paidById: 'm3', icon: '🎢' },
    ],
  },
  {
    id: 'carpool',
    tier: 'secondary',
    icon: '🚗',
    title: 'مشوار مشترك',
    subtitle: 'بنزين – مواقف',
    groupName: 'المشوار',
    currency: 'ر.س',
    shareText: 'مشوار وبنزين وقهوة؟ Diviso يقسمها بسهولة.',
    members: [
      { id: 'm1', name: 'وليد', avatar: 'و' },
      { id: 'm2', name: 'طلال', avatar: 'ط' },
      { id: 'm3', name: 'ياسر', avatar: 'ي' },
      { id: 'm4', name: 'رائد', avatar: 'ر' },
    ],
    expenses: [
      { id: 'e1', description: 'بنزين', amount: 150, paidById: 'm1', icon: '⛽' },
      { id: 'e2', description: 'موقف', amount: 30, paidById: 'm2', icon: '🅿️' },
      { id: 'e3', description: 'غسيل سيارة', amount: 50, paidById: 'm1', icon: '🚿' },
    ],
  },
  {
    id: 'events',
    tier: 'secondary',
    icon: '🎉',
    title: 'مناسبة',
    subtitle: 'هدية – حجز – تجهيز',
    groupName: 'المناسبة',
    currency: 'ر.س',
    shareText: 'مناسبة أو عزيمة؟ Diviso يطلع القسمة صح من أول مرة.',
    members: [
      { id: 'm1', name: 'باسل', avatar: 'ب' },
      { id: 'm2', name: 'أنس', avatar: 'أ' },
      { id: 'm3', name: 'عمار', avatar: 'ع' },
      { id: 'm4', name: 'سامي', avatar: 'س' },
    ],
    expenses: [
      { id: 'e1', description: 'هدية', amount: 500, paidById: 'm1', icon: '🎁' },
      { id: 'e2', description: 'كيك', amount: 200, paidById: 'm2', icon: '🎂' },
      { id: 'e3', description: 'زينة', amount: 100, paidById: 'm3', icon: '🎈' },
    ],
  },
  {
    id: 'friday',
    tier: 'secondary',
    icon: '👬',
    title: 'شلة الجمعة',
    subtitle: 'طلعات – كشتات – قهوة',
    groupName: 'شلة الجمعة',
    currency: 'ر.س',
    shareText: 'شلة الجمعة؟ Diviso يخلي القسمة بينكم عادلة بدون نقاش.',
    members: [
      { id: 'm1', name: 'عبدالعزيز', avatar: 'ع' },
      { id: 'm2', name: 'فارس', avatar: 'ف' },
      { id: 'm3', name: 'بندر', avatar: 'ب' },
      { id: 'm4', name: 'ثامر', avatar: 'ث' },
    ],
    expenses: [
      { id: 'e1', description: 'مطعم', amount: 320, paidById: 'm1', icon: '🍽️' },
      { id: 'e2', description: 'قهوة', amount: 100, paidById: 'm2', icon: '☕' },
      { id: 'e3', description: 'آيسكريم', amount: 60, paidById: 'm3', icon: '🍦' },
    ],
  },
];

// Helper: Filter by tier
export const PRIMARY_SCENARIOS = DEMO_SCENARIOS.filter(s => s.tier === 'primary');
export const SECONDARY_SCENARIOS = DEMO_SCENARIOS.filter(s => s.tier === 'secondary');

export interface MemberBalance {
  member: DemoMember;
  paid: number;
  owed: number;
  net: number; // positive = others owe them, negative = they owe others
}

export function calculateBalances(scenario: DemoScenario): MemberBalance[] {
  const totalExpenses = scenario.expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPerson = totalExpenses / scenario.members.length;

  const balances: MemberBalance[] = scenario.members.map((member) => {
    const paid = scenario.expenses
      .filter((e) => e.paidById === member.id)
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      member,
      paid,
      owed: perPerson,
      net: paid - perPerson,
    };
  });

  // Sort: positive (له) first, then negative (عليه)
  return balances.sort((a, b) => b.net - a.net);
}

export function getTotalExpenses(scenario: DemoScenario): number {
  return scenario.expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function getPerPersonShare(scenario: DemoScenario): number {
  return getTotalExpenses(scenario) / scenario.members.length;
}

export function getScenarioById(id: ScenarioType): DemoScenario | undefined {
  return DEMO_SCENARIOS.find((s) => s.id === id);
}

export function formatAmount(amount: number, currency: string): string {
  const formatted = new Intl.NumberFormat('ar-SA').format(Math.abs(amount));
  return `${formatted} ${currency}`;
}
