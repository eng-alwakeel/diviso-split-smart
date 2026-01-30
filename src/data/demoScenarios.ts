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
  id: 'travel' | 'friends' | 'housing';
  icon: string;
  title: string;
  subtitle: string;
  groupName: string;
  currency: string;
  members: DemoMember[];
  expenses: DemoExpense[];
}

export type ScenarioType = DemoScenario['id'];

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'travel',
    icon: '✈️',
    title: 'سفر',
    subtitle: 'رحلة مع أصحابك',
    groupName: 'رحلة دبي',
    currency: 'ر.س',
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
    icon: '🧑‍🤝‍🧑',
    title: 'طلعة أصدقاء',
    subtitle: 'مطعم – قهوة – بنزين',
    groupName: 'شلة الجمعة',
    currency: 'ر.س',
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
    icon: '🏠',
    title: 'سكن مشترك',
    subtitle: 'إيجار – فواتير – مشتريات',
    groupName: 'شقة الشباب',
    currency: 'ر.س',
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
];

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
