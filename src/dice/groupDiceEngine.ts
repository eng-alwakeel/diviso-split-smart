export type DiceTypeId = "activity" | "cuisine" | "budget" | "payer" | "task";

export type GroupDiceContext = {
  locale: "ar" | "en";
  groupType: string;
  members: Array<{ id: string; name: string }>;
  hasOpenDebts: boolean;
  hasExpenses: boolean;
};

export type DiceFace = {
  value: number;
  emoji: string;
  label_ar: string;
  label_en: string;
};

export type DiceRollResult = {
  diceType: DiceTypeId;
  diceName: string;
  face: DiceFace;
  rolledAt: string;
};

export type DiceOutcome =
  | { mode: "single"; result: DiceRollResult }
  | { mode: "combo"; results: DiceRollResult[] };

const FACES: Record<DiceTypeId, DiceFace[]> = {
  activity: [
    { value: 1, emoji: "🍽️", label_ar: "مطعم", label_en: "Restaurant" },
    { value: 2, emoji: "☕", label_ar: "كافيه", label_en: "Café" },
    { value: 3, emoji: "🏠", label_ar: "جلسة بيت", label_en: "Stay Home" },
    { value: 4, emoji: "🚗", label_ar: "طلعة سريعة", label_en: "Quick Drive" },
    { value: 5, emoji: "🎬", label_ar: "ترفيه / سينما", label_en: "Entertainment" },
    { value: 6, emoji: "🏕️", label_ar: "هواء طلق / بر", label_en: "Outdoors" },
  ],
  cuisine: [
    { value: 1, emoji: "🇸🇦", label_ar: "سعودي", label_en: "Saudi" },
    { value: 2, emoji: "🇺🇸", label_ar: "أمريكي", label_en: "American" },
    { value: 3, emoji: "🇲🇽", label_ar: "مكسيكي", label_en: "Mexican" },
    { value: 4, emoji: "🇮🇹", label_ar: "إيطالي", label_en: "Italian" },
    { value: 5, emoji: "🍜", label_ar: "آسيوي", label_en: "Asian" },
    { value: 6, emoji: "🎲", label_ar: "مفاجأة", label_en: "Surprise" },
  ],
  budget: [
    { value: 1, emoji: "🪙", label_ar: "اقتصادي جدًا", label_en: "Ultra budget" },
    { value: 2, emoji: "💵", label_ar: "20–40", label_en: "20–40" },
    { value: 3, emoji: "💵", label_ar: "40–70", label_en: "40–70" },
    { value: 4, emoji: "💳", label_ar: "70–120", label_en: "70–120" },
    { value: 5, emoji: "💎", label_ar: "150+", label_en: "150+" },
    { value: 6, emoji: "😅", label_ar: "بدون ميزانية", label_en: "No budget" },
  ],
  payer: [
    { value: 1, emoji: "👤", label_ar: "اختيار عضو", label_en: "Pick a member" },
    { value: 2, emoji: "👤", label_ar: "اختيار عضو", label_en: "Pick a member" },
    { value: 3, emoji: "👤", label_ar: "اختيار عضو", label_en: "Pick a member" },
    { value: 4, emoji: "👤", label_ar: "اختيار عضو", label_en: "Pick a member" },
    { value: 5, emoji: "👤", label_ar: "اختيار عضو", label_en: "Pick a member" },
    { value: 6, emoji: "🎲", label_ar: "اختيار عادل", label_en: "Fair pick" },
  ],
  task: [
    { value: 1, emoji: "➕", label_ar: "أضف مصروف واحد", label_en: "Add one expense" },
    { value: 2, emoji: "✅", label_ar: "سوِ تسوية", label_en: "Settle up" },
    { value: 3, emoji: "🔔", label_ar: "ذكّر شخص بالدفع", label_en: "Remind someone" },
    { value: 4, emoji: "📊", label_ar: "راجع تقرير الأسبوع", label_en: "Weekly report" },
    { value: 5, emoji: "👥", label_ar: "ادعُ عضو جديد", label_en: "Invite a member" },
    { value: 6, emoji: "✍️", label_ar: "عدّل اسم المجموعة", label_en: "Rename group" },
  ],
};

function diceName(locale: "ar" | "en", type: DiceTypeId): string {
  const map: Record<DiceTypeId, { ar: string; en: string }> = {
    activity: { ar: "نرد الطلعة", en: "Activity Dice" },
    cuisine: { ar: "نرد المطابخ", en: "Cuisine Dice" },
    budget: { ar: "نرد الميزانية", en: "Budget Dice" },
    payer: { ar: "مين يدفع", en: "Who Pays Dice" },
    task: { ar: "مهمة اليوم", en: "Today Task" },
  };
  return locale === "ar" ? map[type].ar : map[type].en;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function suggestGroupDiceType(ctx: GroupDiceContext): DiceTypeId {
  if (ctx.hasOpenDebts && ctx.members.length >= 3) return "payer";
  if (!ctx.hasExpenses) return "task";
  return "activity";
}

export function getAllowedTypes(ctx: GroupDiceContext): Array<{ id: DiceTypeId; name_ar: string; name_en: string }> {
  const base: Array<{ id: DiceTypeId; name_ar: string; name_en: string }> = [
    { id: "activity", name_ar: "نرد الطلعة", name_en: "Activity" },
    { id: "cuisine", name_ar: "نرد المطابخ", name_en: "Cuisine" },
    { id: "budget", name_ar: "نرد الميزانية", name_en: "Budget" },
    { id: "payer", name_ar: "مين يدفع", name_en: "Who pays" },
    { id: "task", name_ar: "مهمة اليوم", name_en: "Today task" },
  ];

  return base.filter((t) => {
    if (t.id === "payer") return (ctx.members?.length ?? 0) >= 3;
    if (t.id === "cuisine") return ctx.groupType !== "work";
    return true;
  });
}

export function rollGroupDice(ctx: GroupDiceContext, type: DiceTypeId): DiceOutcome {
  if (type === "payer") {
    const member = pick(ctx.members);
    return {
      mode: "single",
      result: {
        diceType: "payer",
        diceName: diceName(ctx.locale, "payer"),
        face: {
          value: Math.floor(Math.random() * 6) + 1,
          emoji: "👤",
          label_ar: `يدفع: ${member.name}`,
          label_en: `Pays: ${member.name}`,
        },
        rolledAt: new Date().toISOString(),
      },
    };
  }

  const face = pick(FACES[type]);

  // Combo: activity=Restaurant -> auto-add cuisine
  if (type === "activity" && face.label_en === "Restaurant" && ctx.groupType !== "work") {
    const cuisine = pick(FACES["cuisine"]);
    return {
      mode: "combo",
      results: [
        {
          diceType: "activity",
          diceName: diceName(ctx.locale, "activity"),
          face,
          rolledAt: new Date().toISOString(),
        },
        {
          diceType: "cuisine",
          diceName: diceName(ctx.locale, "cuisine"),
          face: cuisine,
          rolledAt: new Date().toISOString(),
        },
      ],
    };
  }

  return {
    mode: "single",
    result: {
      diceType: type,
      diceName: diceName(ctx.locale, type),
      face,
      rolledAt: new Date().toISOString(),
    },
  };
}

export type GroupDiceAction =
  | { type: "add_expense"; categoryKey?: string; payerId?: string }
  | { type: "settle_up" }
  | { type: "invite" }
  | { type: "weekly_report" }
  | { type: "rename_group" }
  | { type: "budget_settings" }
  | { type: "none" };

export function mapOutcomeToGroupAction(outcome: DiceOutcome, _ctx: GroupDiceContext): GroupDiceAction {
  const rows = outcome.mode === "single" ? [outcome.result] : outcome.results;
  const activity = rows.find((r) => r.diceType === "activity");
  const budget = rows.find((r) => r.diceType === "budget");
  const payer = rows.find((r) => r.diceType === "payer");
  const task = rows.find((r) => r.diceType === "task");

  if (payer) return { type: "add_expense" };

  if (activity) {
    const en = activity.face.label_en;
    if (en === "Restaurant") return { type: "add_expense", categoryKey: "restaurant" };
    if (en === "Café") return { type: "add_expense", categoryKey: "cafe" };
    if (en === "Entertainment") return { type: "add_expense", categoryKey: "entertainment" };
    if (en === "Outdoors") return { type: "add_expense", categoryKey: "outdoors" };
    if (en === "Stay Home") return { type: "add_expense", categoryKey: "home" };
    if (en === "Quick Drive") return { type: "add_expense", categoryKey: "drive" };
  }

  if (budget) return { type: "budget_settings" };

  if (task) {
    const en = task.face.label_en;
    if (en === "Add one expense") return { type: "add_expense" };
    if (en === "Settle up") return { type: "settle_up" };
    if (en === "Invite a member") return { type: "invite" };
    if (en === "Weekly report") return { type: "weekly_report" };
    if (en === "Rename group") return { type: "rename_group" };
  }

  return { type: "none" };
}
