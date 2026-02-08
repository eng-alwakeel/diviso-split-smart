
# مطابقة Dashboard مع Pseudo-Code المطلوب

## ملخص

مطابقة منطق الصفحة الرئيسية مع الـ Pseudo-Code المقدم. هناك 7 فروقات رئيسية بين التنفيذ الحالي والمنطق المطلوب يجب تصحيحها.

---

## الفروقات بين الحالي والمطلوب

| # | النقطة | الحالي | المطلوب (Pseudo-Code) |
|---|--------|--------|----------------------|
| 1 | Session Hint | غير موجود | `action` / `done` / `curiosity` يتحكم بنبرة الكرت |
| 2 | عرض النرد | يختفي كليا في Onboarding | يظهر إذا `onboardingTasksCompleted >= 2` |
| 3 | SmartPlanCard | يظهر دائما في Daily Hub (مع/بدون خطة) | يظهر فقط إذا `hasActivePlan` |
| 4 | MiniActivityFeed | يظهر في Daily Hub فقط | يظهر في Daily Hub **و** Re-engagement |
| 5 | CTA في Re-engagement | يوجه لـ `/my-groups` | يوجه لـ `/dice` (النرد) |
| 6 | حالة "يومك تمام" | تعتمد على `netBalance ~= 0` | تعتمد على `daysSinceLastActivity <= 1` (sessionHint = done) |
| 7 | Last Action Memory | غير موجود | `lastActionHint` يعرض آخر فعل ذي معنى |

---

## 1. الملفات المعدلة

### `src/hooks/useDashboardMode.ts`

**التعديلات:**

A) اضافة `SessionHint` type ومنطقه:
```text
export type SessionHint = 'action' | 'done' | 'curiosity';
```

المنطق:
```text
if mode === 'daily':
  if hasActivePlan → sessionHint = 'action'
  elif daysSinceLastActivity <= 1 → sessionHint = 'done'
  else → sessionHint = 'curiosity'

if mode === 'reengagement':
  sessionHint = 'curiosity'

if mode === 'onboarding':
  sessionHint = 'action'
```

B) اضافة `lastMeaningfulAction` من `user_action_log`:
```text
جلب آخر سجل من user_action_log حيث action_type in ('add_expense', 'dice_roll', 'create_group')
```

C) اضافة `hasActivePlan` (boolean مشتق من activePlan !== null)

D) اضافة `showDice` المحسوب:
```text
showDice = mode !== 'onboarding' || completedCount >= 2
```

E) اضافة `showSmartPlanCard` المحسوب:
```text
showSmartPlanCard = mode === 'daily_hub' && activePlan !== null
```

F) اضافة `showMiniFeed` المحسوب:
```text
showMiniFeed = mode === 'daily_hub' || mode === 'reengagement'
```

G) اضافة `showStats` المحسوب:
```text
showStats = mode === 'daily_hub'
```

**الـ Interface الجديد:**
```text
export interface DashboardModeData {
  ...الحقول الموجودة...
  // جديد
  sessionHint: SessionHint;
  lastMeaningfulAction: string | null;
  lastActionHint: string | null;
  hasActivePlan: boolean;
  // Display flags
  showOnboardingChecklist: boolean;
  showDailyFocus: boolean;  // دائما true
  showSmartPlanCard: boolean;
  showDice: boolean;
  showMiniFeed: boolean;
  showStats: boolean;
}
```

### `src/components/dashboard/DailyFocusCard.tsx`

**التعديلات:**

A) اضافة props جديدة:
```text
interface DailyFocusCardProps {
  mode: DashboardMode;
  sessionHint?: SessionHint;
  lastActionHint?: string | null;
  nextTask?: OnboardingTask | null;
  activePlan?: ActivePlan | null;
  netBalance?: number;              // يبقى كـ fallback
  daysSinceLastAction?: number;
}
```

B) تغيير منطق Daily Hub:
```text
الحالي:
  if activePlan → كرت الخطة
  elif netBalance ~= 0 → "يومك تمام"
  else → "خطوة خفيفة"

الجديد:
  if sessionHint === 'action' && activePlan → كرت الخطة (CTA: أضف مصروف للخطة)
  elif sessionHint === 'done' → "جاهزين ليوم جديد" + "يومك تمام" (بدون CTA)
  elif sessionHint === 'curiosity' → "خطوة بسيطة اليوم تفرق" (CTA: أضف مصروف)
```

C) تغيير Re-engagement CTA:
```text
الحالي: navigate('/my-groups') + "ارجع بخطوة بسيطة"
الجديد: navigate('/dice') + "ارمِ النرد" (primaryCTA = dice)
```

D) تغيير نص Re-engagement:
```text
الحالي: "صار لك X يوم بعيد"
الجديد: "طولت الغيبة 👀" + "خلّينا نرجعها بخطوة بسيطة"
```

E) عرض `lastActionHint` (اختياري):
```text
إذا lastActionHint موجود:
  عرض سطر صغير (text-xs text-muted-foreground) أسفل العنوان الرئيسي
```

### `src/pages/Dashboard.tsx`

**التعديلات:**

A) استخدام الـ display flags من `useDashboardMode` بدل المنطق المباشر:
```text
الحالي:
  {mode === 'daily_hub' && <SmartPlanCard ... />}

الجديد:
  {dashboardMode.showSmartPlanCard && <SmartPlanCard ... />}
```

B) تمرير `sessionHint` و `lastActionHint` لـ DailyFocusCard:
```text
<DailyFocusCard
  mode={mode}
  sessionHint={dashboardMode.sessionHint}
  lastActionHint={dashboardMode.lastActionHint}
  ...
/>
```

C) تغيير شرط عرض النرد في Onboarding:
```text
الحالي: لا يظهر في onboarding
الجديد: يظهر إذا dashboardMode.showDice (true عند completedCount >= 2)
```

D) اضافة MiniActivityFeed في Re-engagement:
```text
الحالي: لا يظهر في reengagement
الجديد: {dashboardMode.showMiniFeed && <MiniActivityFeed ... />}
```

E) ازالة SmartPlanCard بدون خطة (حالة "عندك طلعة قريبة؟"):
```text
الحالي: يظهر دائما في daily_hub
الجديد: يظهر فقط إذا showSmartPlanCard (أي activePlan !== null)
```

### `src/i18n/locales/ar/dashboard.json`

اضافة/تعديل مفاتيح:
```text
"daily_focus": {
  ...المفاتيح الموجودة...,
  "reengagement_title": "طولت الغيبة 👀",
  "reengagement_sub": "خلّينا نرجعها بخطوة بسيطة",
  "reengagement_dice_cta": "ارمِ النرد",
  "daily_ready": "جاهزين ليوم جديد",
  "daily_ready_sub": "خطوة بسيطة اليوم تفرق",
  "done_title": "يومك تمام ✅",
  "done_sub": "ما عليك شي اليوم",
  "last_action_dice": "آخر مرة استخدمت النرد 🎲",
  "last_action_expense": "آخر مرة أضفت مصروف",
  "last_action_group": "آخر مرة أنشأت مجموعة"
}
```

### `src/i18n/locales/en/dashboard.json`

نفس المفاتيح بالانجليزية:
```text
"daily_focus": {
  ...existing keys...,
  "reengagement_title": "It's been a while 👀",
  "reengagement_sub": "Let's get back with a simple step",
  "reengagement_dice_cta": "Roll the dice",
  "daily_ready": "Ready for a new day",
  "daily_ready_sub": "A simple step today makes a difference",
  "done_title": "You're all set ✅",
  "done_sub": "Nothing to do today",
  "last_action_dice": "Last time you used the dice 🎲",
  "last_action_expense": "Last time you added an expense",
  "last_action_group": "Last time you created a group"
}
```

---

## 2. التفاصيل التقنية

### جلب آخر فعل ذي معنى

```text
في useDashboardMode:

const { data: lastAction } = useQuery({
  queryKey: ['last-meaningful-action', userId],
  queryFn: async () => {
    const { data } = await supabase
      .from('user_action_log')
      .select('action_type')
      .eq('user_id', userId)
      .in('action_type', ['add_expense', 'dice_roll', 'create_group'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.action_type || null;
  },
  enabled: !!userId,
  staleTime: 5 * 60 * 1000,
});
```

### حساب lastActionHint

```text
function getLastActionHint(actionType: string | null): string | null {
  if (!actionType) return null;
  switch (actionType) {
    case 'dice_roll': return 'last_action_dice';
    case 'add_expense': return 'last_action_expense';
    case 'create_group': return 'last_action_group';
    default: return null;
  }
}
```

يرجع مفتاح الترجمة (ليس النص مباشرة).

### هيكل Dashboard الجديد

```text
<Dashboard>
  [Welcome Header]

  {showOnboardingChecklist && <OnboardingChecklist />}

  <DailyFocusCard
    mode={mode}
    sessionHint={sessionHint}
    lastActionHint={lastActionHint}
    primaryCTA={...}
    ...
  />

  {showSmartPlanCard && <SmartPlanCard />}

  {showDice && <DailyDice />}

  {showMiniFeed && <MiniActivityFeed />}

  {showStats && <CollapsibleStats />}

  // باقي المكونات الثانوية (daily_hub فقط)...
</Dashboard>
```

### ترتيب الشروط (محافظ عليه)

```text
1. Onboarding أولا (لا يختفي بالغلط)
2. Re-engagement ثانيا
3. Daily Hub آخرا (default)
```

هذا الترتيب موجود بالفعل في `useDashboardMode.ts` ولا يتغير.

---

## 3. ملخص الملفات

| الملف | التعديل |
|-------|--------|
| `src/hooks/useDashboardMode.ts` | اضافة sessionHint + lastAction + display flags |
| `src/components/dashboard/DailyFocusCard.tsx` | sessionHint logic + re-engagement dice CTA + lastActionHint |
| `src/pages/Dashboard.tsx` | استخدام display flags + تمرير props جديدة |
| `src/i18n/locales/ar/dashboard.json` | مفاتيح جديدة للنصوص |
| `src/i18n/locales/en/dashboard.json` | مفاتيح جديدة للنصوص |

---

## 4. ما لا يتغير

- منطق `useDashboardMode` الاساسي (ترتيب الشروط الثلاثة) -- محافظ عليه
- `OnboardingProgress` component -- لا تعديل
- `StreakDisplay` component -- لا تعديل
- `CollapsibleStats` component -- لا تعديل
- `MinimalQuickActions` component -- لا تعديل
- `SmartPlanCard` component -- لا تعديل (فقط يختفي عند عدم وجود خطة)

---

## 5. حالات طرفية

- مستخدم onboarding اكمل 1/5: لا يرى النرد
- مستخدم onboarding اكمل 2/5: يرى النرد
- مستخدم daily بدون خطة + نشط اليوم (daysSince <= 1): يرى "يومك تمام" (done)
- مستخدم daily بدون خطة + غاب يومين: يرى "خطوة بسيطة" (curiosity)
- مستخدم daily مع خطة: يرى كرت الخطة + CTA اضافة مصروف (action)
- مستخدم reengagement: يرى "طولت الغيبة" + CTA "ارمِ النرد" + MiniActivityFeed
- لا يوجد `user_action_log` للمستخدم: `lastActionHint = null` ولا يعرض شيء
