
# اعادة بناء الصفحة الرئيسية الذكية (Smart Dashboard)

## ملخص

اعادة هيكلة الـ Dashboard بالكامل ليعمل بثلاثة أوضاع ذكية:
- **Onboarding Mode**: مستخدم جديد (عدة < 5/5 وأقل من 7 أيام من التسجيل)
- **Daily Hub Mode**: مستخدم مكتمل الاعداد (5/5 أو مضى 7 أيام)
- **Re-engagement Mode**: مستخدم غير نشط (آخر نشاط > 7 أيام)

---

## الوضع الحالي (المشاكل)

| المشكلة | التفصيل |
|---------|--------|
| الصفحة مزدحمة | 12+ مكون ظاهر: DailyHub, Onboarding, InstallWidget, HomeDiceBanner, StatsGrid, DailyCheckIn, CreditBalance, AdBanner, Achievement, MonthlyWrap, SmartPromotion, QuickActions |
| لا تمييز بين الأوضاع | كل المستخدمين يرون نفس الصفحة |
| تكرار بين المكونات | HomeDiceBanner و DailyDiceCard يؤديان نفس الغرض |
| 6 إجراءات سريعة | تشمل خطط، إحالات، إعدادات (تشتيت) |
| لا Daily Focus Card | لا يجيب على "وش أسوي اليوم؟" |
| لا ربط بالخطط | كرت التخطيط غير موجود |
| الإحصائيات دائما مفتوحة | لا قابلية طي |

---

## 1. قاعدة البيانات

### تعديل على `useOnboarding` hook فقط (بدون migration)

الـ `onboarding_tasks` table يحتوي على `created_at` -- يمكن حساب عمر الحساب منه.
الـ `profiles` table يحتوي على `created_at` و `last_active_at` -- يمكن حساب النشاط.

لا حاجة لـ migration جديد.

---

## 2. منطق تحديد الحالة (User Mode Logic)

### Hook جديد: `src/hooks/useDashboardMode.ts`

يجمع البيانات من `useOnboarding` و `useDailyHub` ويحدد الوضع:

```text
type DashboardMode = 'onboarding' | 'daily_hub' | 'reengagement';

المنطق:
1. جلب onboarding data (tasks completed + created_at)
2. جلب profiles.created_at و last_active_at
3. حساب daysSinceRegistration و daysSinceLastAction

if (completedTasks < 5 AND daysSinceRegistration <= 7 AND !rewardClaimed):
  mode = 'onboarding'
elif (daysSinceLastAction > 7):
  mode = 'reengagement'
else:
  mode = 'daily_hub'
```

يرجع:
- `mode`: الوضع الحالي
- `onboardingData`: بيانات العدة (tasks, progress, nextTask)
- `hubData`: بيانات Daily Hub
- `activePlan`: أول خطة نشطة (status = 'active')
- `isLoading`

---

## 3. ملفات جديدة

### `src/hooks/useDashboardMode.ts`

Hook رئيسي يحدد وضع الـ Dashboard ويجمع كل البيانات اللازمة:
- يستدعي `useOnboarding`
- يستدعي `useDailyHub`
- يجلب `profiles.created_at` و `last_active_at`
- يجلب أول خطة نشطة من `plans` (status = 'active', أقرب start_date)
- يحدد الوضع حسب المنطق أعلاه

### `src/components/dashboard/DailyFocusCard.tsx`

كرت واحد أعلى الصفحة يجيب على "وش أسوي اليوم؟":

**في وضع Onboarding:**
```text
+------------------------------------------+
|  👋 أول خطوة اليوم                       |
|  "خلّينا نضيف أول مصروف"                 |
|  [➕ أضف مصروف]           (CTA واحد)     |
+------------------------------------------+
```
يعرض المهمة التالية غير المكتملة من العدة فقط.

**في وضع Daily Hub (مع خطة نشطة):**
```text
+------------------------------------------+
|  🟢 خلّينا نكمّل خطتك                    |
|  رحلة الشمال – باقي 3 أيام              |
|  [➕ أضف مصروف للخطة]     (CTA واحد)     |
+------------------------------------------+
```

**في وضع Daily Hub (بدون خطة):**
```text
+------------------------------------------+
|  ✋ خلّينا نبدأ اليوم بخطوة خفيفة        |
|  [نفّذ خطوة الآن]          (CTA واحد)     |
+------------------------------------------+
```

**في وضع Daily Hub (مستخدم متوازن - لا ديون):**
```text
+------------------------------------------+
|  ✅ يومك تمام                            |
|  ما عليك شي اليوم                        |
+------------------------------------------+
```

**في وضع Re-engagement:**
```text
+------------------------------------------+
|  ⏰ صار لك {{days}} يوم بعيد              |
|  [ارجع بخطوة بسيطة]       (CTA واحد)     |
+------------------------------------------+
```

### `src/components/dashboard/SmartPlanCard.tsx`

كرت التخطيط الذكي (يظهر فقط في Daily Hub):

**خطة نشطة موجودة:**
```text
+------------------------------------------+
|  🗓️ خطتك الحالية                        |
|  رحلة الشمال | ⏳ باقي 3 أيام            |
|  [عرض الخطة]                             |
+------------------------------------------+
```

**لا توجد خطة:**
```text
+------------------------------------------+
|  🤔 عندك طلعة قريبة؟                     |
|  [إنشاء خطة (30 ثانية)]                  |
+------------------------------------------+
```

لا يظهر في وضع Onboarding أو Re-engagement.

### `src/components/dashboard/CollapsibleStats.tsx`

ملخص أرقام قابل للطي (يظهر فقط في Daily Hub):
- المصاريف الشهرية
- الرصيد الصافي
- عدد المجموعات
- يبدأ مطوي بشكل افتراضي
- يستخدم `Collapsible` من Radix UI

### `src/components/dashboard/MinimalQuickActions.tsx`

إجراءات سريعة مبسطة (زرين فقط):
- اضافة مصروف (Primary)
- انشاء مجموعة (Outline)

لا خطط، لا إعدادات، لا إحالات.

### `src/components/dashboard/MiniActivityFeed.tsx`

سطر واحد من Activity Feed (يظهر فقط في Daily Hub إذا وُجد حدث):

```text
+------------------------------------------+
|  👀 مجموعتك اقتربت من التوازن            |
|  [عرض التفاصيل]                          |
+------------------------------------------+
```

يستخدم `last_group_event` من `useDailyHub`.

---

## 4. الملفات المعدلة

### `src/pages/Dashboard.tsx` (اعادة هيكلة كبيرة)

**التعديلات:**

1. استيراد `useDashboardMode` بدلا من الـ hooks المنفصلة
2. ازالة المكونات من العرض الافتراضي:
   - ~~`HomeDiceBanner`~~ (مكرر مع DailyDiceCard)
   - ~~`SimpleStatsGrid`~~ (يحل محله CollapsibleStats في Daily Hub فقط)
   - ~~`SimpleQuickActions`~~ (يحل محله MinimalQuickActions)
   - ~~`DailyCheckInCard`~~ (يبقى فقط في Daily Hub، ليس في Onboarding)
   - ~~`CreditBalanceCard`~~ (يبقى فقط في Daily Hub)
   - ~~`ShareableAchievementCard`~~ (ينقل لأسفل)
   - ~~`MonthlyWrapCard`~~ (ينقل لأسفل)
   - ~~`SmartPromotionBanner`~~ (ينقل لأسفل)

3. الهيكل الجديد حسب الوضع:

**Onboarding Mode:**
```text
[Welcome Header]
[OnboardingProgress]          -- العدة (0/5) ثابتة أعلى
[DailyFocusCard]              -- المهمة التالية فقط
[InstallWidget]               -- PWA
```

**Daily Hub Mode:**
```text
[Welcome Header]
[DailyFocusCard]              -- كرت التركيز اليومي
[StreakDisplay]                -- 🔥 Streak (إذا > 0)
[SmartPlanCard]               -- كرت التخطيط (إذا له معنى)
[DailyDiceCard]               -- نرد اليوم
[MiniActivityFeed]            -- سطر واحد من Feed
[MinimalQuickActions]         -- زرين فقط
[CollapsibleStats]            -- أرقام قابلة للطي
[DailyCheckInCard]            -- المكافأة اليومية
[CreditBalanceCard]           -- الرصيد
[ShareableAchievement]        -- إنجاز (إذا وُجد)
[SmartPromotionBanner]        -- ترويج (إذا وُجد)
```

**Re-engagement Mode:**
```text
[Welcome Header]
[DailyFocusCard]              -- رسالة إحياء + CTA
[StreakDisplay]                -- (غالبا 0)
[DailyDiceCard]               -- نرد اليوم
[MinimalQuickActions]         -- زرين فقط
```

### `src/hooks/useOnboarding.ts`

تعديلات:
- اضافة `nextIncompleteTask` في الـ return: أول مهمة غير مكتملة
- اضافة `registrationDate` من `onboarding_tasks.created_at`
- اضافة `isWithinOnboardingWindow`: boolean (أقل من 7 أيام)

### `src/components/daily-hub/DailyHubSection.tsx`

تعديل:
- لم يعد يعرض المكونات الثلاثة (Active/Low/New) مباشرة
- يصبح wrapper يستقبل `mode` من الأب ويعرض المكونات المناسبة
- أو يُستغنى عنه ويُستخدم المنطق مباشرة في Dashboard

### `src/i18n/locales/ar/dashboard.json`

اضافة مفاتيح جديدة:
```text
"daily_focus": {
  "onboarding_greeting": "👋 أول خطوة اليوم",
  "plan_active": "🟢 خلّينا نكمّل خطتك",
  "plan_days_left": "باقي {{days}} يوم",
  "plan_add_expense": "أضف مصروف للخطة",
  "no_plan": "✋ خلّينا نبدأ اليوم بخطوة خفيفة",
  "no_plan_cta": "نفّذ خطوة الآن",
  "balanced": "✅ يومك تمام",
  "balanced_sub": "ما عليك شي اليوم",
  "reengagement": "⏰ صار لك {{days}} يوم بعيد",
  "reengagement_cta": "ارجع بخطوة بسيطة",
  "micro_celebration": "👌 تمام، خلّصناها اليوم"
},
"smart_plan": {
  "current_plan": "🗓️ خطتك الحالية",
  "days_left": "⏳ باقي {{days}} يوم",
  "view_plan": "عرض الخطة",
  "no_plan_prompt": "🤔 عندك طلعة قريبة؟",
  "create_plan_cta": "إنشاء خطة (30 ثانية)"
},
"collapsible_stats": {
  "title": "الأرقام والملخص",
  "monthly": "المصاريف الشهرية",
  "balance": "الرصيد الصافي",
  "groups": "المجموعات"
},
"mini_feed": {
  "view_details": "عرض التفاصيل"
}
```

### `src/i18n/locales/en/dashboard.json`

اضافة نفس المفاتيح بالإنجليزية:
```text
"daily_focus": {
  "onboarding_greeting": "👋 First step today",
  "plan_active": "🟢 Let's continue your plan",
  "plan_days_left": "{{days}} days left",
  "plan_add_expense": "Add expense to plan",
  "no_plan": "✋ Let's start today with a simple step",
  "no_plan_cta": "Take a step now",
  "balanced": "✅ You're all set",
  "balanced_sub": "Nothing to do today",
  "reengagement": "⏰ It's been {{days}} days",
  "reengagement_cta": "Come back with a simple step",
  "micro_celebration": "👌 Done for today!"
},
"smart_plan": {
  "current_plan": "🗓️ Your current plan",
  "days_left": "⏳ {{days}} days left",
  "view_plan": "View Plan",
  "no_plan_prompt": "🤔 Got an upcoming trip?",
  "create_plan_cta": "Create a plan (30 sec)"
},
"collapsible_stats": {
  "title": "Numbers & Summary",
  "monthly": "Monthly Expenses",
  "balance": "Net Balance",
  "groups": "Groups"
},
"mini_feed": {
  "view_details": "View details"
}
```

---

## 5. التفاصيل التقنية

### منطق DailyFocusCard

```text
Props:
  mode: 'onboarding' | 'daily_hub' | 'reengagement'
  nextTask?: OnboardingTask        // المهمة التالية (onboarding)
  activePlan?: Plan                // خطة نشطة (daily_hub)
  netBalance?: number              // الرصيد (daily_hub)
  daysSinceLastAction?: number     // أيام الغياب (reengagement)

الشرط الداخلي:
  if mode === 'onboarding':
    عرض nextTask مع CTA يوجه لـ task.route
  elif mode === 'reengagement':
    عرض رسالة الإحياء مع CTA → /my-groups
  elif mode === 'daily_hub':
    if activePlan:
      عرض اسم الخطة + أيام متبقية + CTA → /add-expense?plan_id=X
    elif netBalance === 0 (أو قريب من 0):
      عرض "يومك تمام" (بدون CTA)
    else:
      عرض "خطوة خفيفة" + CTA → /add-expense
```

### منطق SmartPlanCard

```text
Props:
  activePlan?: Plan | null

if activePlan:
  عنوان الخطة + أيام متبقية حتى end_date
  CTA: عرض الخطة → /plan/{id}
else:
  رسالة تحفيزية
  CTA: إنشاء خطة → /plans/create
```

### منطق CollapsibleStats

```text
يستخدم Collapsible من Radix UI
الحالة الافتراضية: مطوي (closed)
عند الفتح: يعرض 3 stat cards (شهرية، رصيد، مجموعات)
Header يعرض عنوان + أيقونة سهم (يتدور عند الفتح)
```

### منطق MinimalQuickActions

```text
فقط زرين:
1. ➕ إضافة مصروف → /add-expense (Button variant="default")
2. 👥 إنشاء مجموعة → /create-group (Button variant="outline")

عرض أفقي (flex gap-3) بنفس العرض
```

### القاعدة: CTA واحد رئيسي في الشاشة

- DailyFocusCard يحتوي CTA واحد فقط (Primary)
- SmartPlanCard يحتوي CTA ثانوي (Outline)
- MinimalQuickActions يحتوي زرين (Default + Outline)
- بقية المكونات ليس لها CTA رئيسي

---

## 6. ملخص الملفات

### ملفات جديدة

| الملف | الوصف |
|-------|------|
| `src/hooks/useDashboardMode.ts` | Hook تحديد وضع الـ Dashboard |
| `src/components/dashboard/DailyFocusCard.tsx` | كرت التركيز اليومي |
| `src/components/dashboard/SmartPlanCard.tsx` | كرت التخطيط الذكي |
| `src/components/dashboard/CollapsibleStats.tsx` | إحصائيات قابلة للطي |
| `src/components/dashboard/MinimalQuickActions.tsx` | إجراءات سريعة مبسطة |
| `src/components/dashboard/MiniActivityFeed.tsx` | سطر واحد من Activity Feed |

### ملفات معدلة

| الملف | التعديل |
|-------|--------|
| `src/pages/Dashboard.tsx` | اعادة هيكلة كاملة بثلاثة أوضاع |
| `src/hooks/useOnboarding.ts` | اضافة nextTask + registrationDate + isWithinWindow |
| `src/i18n/locales/ar/dashboard.json` | اضافة مفاتيح daily_focus + smart_plan + collapsible_stats + mini_feed |
| `src/i18n/locales/en/dashboard.json` | اضافة نفس المفاتيح بالإنجليزية |

---

## 7. ما يُزال من الصفحة الرئيسية حسب الوضع

| المكون | Onboarding | Daily Hub | Re-engagement |
|--------|-----------|-----------|---------------|
| OnboardingProgress | ✅ يظهر | ❌ لا يظهر | ❌ لا يظهر |
| DailyFocusCard | ✅ (المهمة التالية) | ✅ (خطة/خطوة) | ✅ (إحياء) |
| StreakDisplay | ❌ | ✅ | ✅ (غالبا 0) |
| SmartPlanCard | ❌ | ✅ | ❌ |
| DailyDiceCard | ❌ | ✅ | ✅ |
| MiniActivityFeed | ❌ | ✅ | ❌ |
| MinimalQuickActions | ❌ | ✅ | ✅ |
| CollapsibleStats | ❌ | ✅ (مطوي) | ❌ |
| DailyCheckInCard | ❌ | ✅ | ❌ |
| CreditBalanceCard | ❌ | ✅ | ❌ |
| HomeDiceBanner | ❌ (محذوف نهائيا) | ❌ (محذوف) | ❌ (محذوف) |
| SimpleStatsGrid | ❌ (محذوف) | ❌ (بديله CollapsibleStats) | ❌ |
| SimpleQuickActions | ❌ (محذوف) | ❌ (بديله MinimalQuickActions) | ❌ |
| InstallWidget | ✅ | ✅ | ✅ |
| Achievement | ❌ | ✅ (أسفل) | ❌ |
| MonthlyWrap | ❌ | ✅ (أسفل) | ❌ |
| SmartPromotion | ❌ | ✅ (أسفل) | ❌ |

---

## 8. حالات طرفية مهمة

- مستخدم أكمل 4/5 في اليوم 6: يبقى في Onboarding حتى يكمل 5/5 أو ينتهي اليوم 7
- مستخدم أكمل 5/5 في اليوم 2: ينتقل لـ Daily Hub فورا
- مستخدم انتهى اليوم 7 بدون اكمال: ينتقل لـ Daily Hub (العدة تختفي)
- مستخدم نشط ثم غاب 8 أيام: ينتقل لـ Re-engagement
- مستخدم re-engagement عمل عمل: يرجع لـ Daily Hub (days_since_last_action يصبح 0)
- خطة نشطة انتهت تاريخها: SmartPlanCard يعرض "لا توجد خطة"
- رصيد صافي = 0: DailyFocusCard يعرض "يومك تمام"
- لا خطط ولا مجموعات: DailyFocusCard يعرض "خطوة خفيفة" مع CTA لانشاء مجموعة
