

# اضافة كروت ثابتة ذكية للصفحة الرئيسية

## ملخص

اضافة 3 كروت ثابتة ذكية للصفحة الرئيسية تثري التجربة بصريا ووظيفيا:
1. **Stats Lite Card** -- احصائيات مختصرة (Grid 2x2)
2. **Balance Status Card** -- حالة التوازن المالي
3. **Recent Group Activity Card** -- آخر نشاط بالمجموعات

مع الحفاظ على Daily Focus كعنصر اساسي والتحكم بالظهور حسب وضع المستخدم.

---

## 1. ملفات جديدة

### `src/components/dashboard/StatsLiteCard.tsx`

كرت احصائيات مختصر بتصميم Grid 2x2:

```text
+--------------------+--------------------+
| المصاريف هذا الشهر | الرصيد الصافي لك   |
| 1,200 ر.س          | +350 ر.س           |
+--------------------+--------------------+
| المجموعات النشطة   | المستحقات          |
| 3                   | 200 ر.س            |
+--------------------+--------------------+
```

**Props:**
```text
interface StatsLiteCardProps {
  monthlyTotalExpenses: number;
  netBalance: number;
  groupsCount: number;
  outstandingAmount: number;  // المستحقات (myOwed - myPaid اذا سالب)
}
```

**القواعد:**
- كل خلية قابلة للضغط وتنقل لصفحة التفاصيل المناسبة
- حجم صغير (ارتفاع منخفض) -- `p-3` للـ CardContent
- بدون رسوم بيانية ولا ايقونات كبيرة
- اذا لم تتوفر بيانات (كلها 0): يعرض "لا توجد بيانات بعد"
- الرصيد الصافي بلون اخضر اذا موجب، احمر اذا سالب
- المستحقات: تظهر القيمة اذا > 0، والا "لا يوجد"

**التنقل عند الضغط:**
- المصاريف الشهرية → `/my-expenses`
- الرصيد الصافي → `/my-expenses`
- المجموعات → `/my-groups`
- المستحقات → `/my-expenses`

---

### `src/components/dashboard/BalanceStatusCard.tsx`

كرت حالة التوازن المالي:

**Props:**
```text
interface BalanceStatusCardProps {
  netBalance: number;
}
```

**الحالات الثلاث:**

```text
حالة 1: متوازن (netBalance === 0)
+------------------------------------------+
| ✅ متوازن                                |
| ما عليك أي مستحقات اليوم                 |
| [عرض التفاصيل]                           |
+------------------------------------------+

حالة 2: قريب من التوازن (|netBalance| < 50)
+------------------------------------------+
| ⚠️ قريب من التوازن                       |
| باقي مبلغ بسيط للتسوية                   |
| [عرض التفاصيل]                           |
+------------------------------------------+

حالة 3: غير متوازن (|netBalance| >= 50)
+------------------------------------------+
| ❌ غير متوازن                             |
| عليك مستحقات                             |
| [عرض التفاصيل]                           |
+------------------------------------------+
```

**القواعد:**
- يظهر دائما (حتى لو متوازن)
- بدون ارقام تفصيلية (لا يعرض المبلغ)
- CTA واحد: "عرض التفاصيل" → `/my-expenses`
- الوان مختلفة لكل حالة:
  - متوازن: `border-green-500/20 bg-green-500/5`
  - قريب: `border-amber-500/20 bg-amber-500/5`
  - غير متوازن: `border-red-500/20 bg-red-500/5`

---

### `src/components/dashboard/RecentGroupActivityCard.tsx`

كرت آخر نشاط بالمجموعات:

**Props:**
```text
interface RecentGroupActivityCardProps {
  lastGroupEvent: DailyHubData['last_group_event'];
}
```

**العرض:**
```text
+------------------------------------------+
| 👀 باقي شخص واحد وتكتمل القسمة          |
| [عرض]                                     |
+------------------------------------------+
```

**القواعد:**
- سطر واحد فقط من آخر حدث
- CTA صغير: "عرض" → `/group/{group_id}`
- اذا لم يوجد حدث: لا يظهر الكرت (return null)
- يعرض الرسالة الذكية من `last_group_event.smart_message_ar` أو `smart_message_en` حسب اللغة
- تصميم خفيف: `border-border/30 bg-card/40`

**ملاحظة:** هذا الكرت يشبه `MiniActivityFeed` الموجود حاليا لكن بتصميم مختلف قليلا (مكان مختلف + تمييز بصري). سيتم دمجهم في كرت واحد بدل التكرار -- نحذف `MiniActivityFeed` من مكانه القديم ونستخدم `RecentGroupActivityCard` بدلا منه.

---

## 2. الملفات المعدلة

### `src/hooks/useDashboardMode.ts`

**التعديلات:**

اضافة 3 display flags جديدة:
```text
showStatsLite: boolean;      // daily_hub + reengagement
showBalanceCard: boolean;     // daily_hub + reengagement
showRecentActivity: boolean;  // daily_hub فقط (يعتمد على وجود بيانات)
```

المنطق:
```text
const showStatsLite = mode === 'daily_hub' || mode === 'reengagement';
const showBalanceCard = mode === 'daily_hub' || mode === 'reengagement';
const showRecentActivity = mode === 'daily_hub';
```

اضافة الحقول الجديدة في `DashboardModeData` interface والـ return.

### `src/pages/Dashboard.tsx`

**التعديلات:**

A) استيراد المكونات الجديدة:
```text
import { StatsLiteCard } from '@/components/dashboard/StatsLiteCard';
import { BalanceStatusCard } from '@/components/dashboard/BalanceStatusCard';
import { RecentGroupActivityCard } from '@/components/dashboard/RecentGroupActivityCard';
```

B) حذف `MiniActivityFeed` من مكانه الحالي (سطر 386-388) لتجنب التكرار مع `RecentGroupActivityCard`.

C) حذف `CollapsibleStats` (سطر 396-402) لانها بُدلت بـ `StatsLiteCard`.

D) اضافة الكروت الجديدة بالترتيب المطلوب بعد Quick Actions:

الترتيب النهائي للصفحة:
```text
1. Welcome Header
2. OnboardingChecklist (إن وجد)
3. DailyFocusCard
4. StreakDisplay (daily_hub + reengagement)
5. SmartPlanCard (daily_hub + hasActivePlan)
6. DailyDiceCard (per showDice flag)
7. MinimalQuickActions (daily_hub + reengagement)
8. StatsLiteCard (daily_hub + reengagement)        ← جديد
9. BalanceStatusCard (daily_hub + reengagement)     ← جديد
10. RecentGroupActivityCard (daily_hub فقط)          ← جديد (يحل محل MiniActivityFeed)
11. Daily Hub extras (DailyCheckIn, CreditBalance, etc.)
12. InstallWidget
```

E) تمرير البيانات للكروت الجديدة:
```text
{dashboardMode.showStatsLite && (
  <StatsLiteCard
    monthlyTotalExpenses={monthlyTotalExpenses}
    netBalance={netBalance}
    groupsCount={groupsCount}
    outstandingAmount={Math.max(0, myOwed - myPaid)}
  />
)}

{dashboardMode.showBalanceCard && (
  <BalanceStatusCard netBalance={netBalance} />
)}

{dashboardMode.showRecentActivity && (
  <RecentGroupActivityCard
    lastGroupEvent={dashboardMode.hubData?.last_group_event ?? null}
  />
)}
```

### `src/i18n/locales/ar/dashboard.json`

اضافة مفاتيح جديدة:
```text
"stats_lite": {
  "monthly": "المصاريف هذا الشهر",
  "balance": "الرصيد الصافي لك",
  "groups": "المجموعات النشطة",
  "outstanding": "المستحقات",
  "no_data": "لا توجد بيانات بعد",
  "no_outstanding": "لا يوجد"
},
"balance_status": {
  "balanced": "متوازن",
  "balanced_sub": "ما عليك أي مستحقات اليوم",
  "near_balanced": "قريب من التوازن",
  "near_balanced_sub": "باقي مبلغ بسيط للتسوية",
  "unbalanced": "غير متوازن",
  "unbalanced_sub": "عليك مستحقات",
  "view_details": "عرض التفاصيل"
},
"recent_activity": {
  "view": "عرض"
}
```

### `src/i18n/locales/en/dashboard.json`

اضافة نفس المفاتيح بالانجليزية:
```text
"stats_lite": {
  "monthly": "Expenses this month",
  "balance": "Your net balance",
  "groups": "Active groups",
  "outstanding": "Outstanding",
  "no_data": "No data yet",
  "no_outstanding": "None"
},
"balance_status": {
  "balanced": "Balanced",
  "balanced_sub": "No outstanding dues today",
  "near_balanced": "Almost balanced",
  "near_balanced_sub": "A small amount left to settle",
  "unbalanced": "Unbalanced",
  "unbalanced_sub": "You have outstanding dues",
  "view_details": "View details"
},
"recent_activity": {
  "view": "View"
}
```

---

## 3. التفاصيل التقنية

### منطق StatsLiteCard

```text
الأرقام تُجلب من dashboardData الموجود حاليا:
- monthlyTotalExpenses ← من useOptimizedDashboardData
- netBalance ← myPaid - myOwed
- groupsCount ← من useOptimizedDashboardData
- outstandingAmount ← Math.max(0, myOwed - myPaid)

حالة "لا توجد بيانات بعد":
  if monthlyTotalExpenses === 0 && groupsCount === 0 && netBalance === 0:
    عرض رسالة واحدة بدل Grid
```

### منطق BalanceStatusCard

```text
العتبة (threshold) للتمييز بين الحالات:
- متوازن: netBalance === 0
- قريب: Math.abs(netBalance) < 50 && netBalance !== 0
- غير متوازن: Math.abs(netBalance) >= 50

العتبة 50 ريال قابلة للتعديل. هذا رقم مبدئي يميز بين المبالغ البسيطة والمبالغ الحقيقية.
```

### منطق RecentGroupActivityCard

```text
يستخدم نفس بيانات last_group_event من useDailyHub
اذا last_group_event === null: return null (لا يظهر)
يعرض smart_message_ar أو smart_message_en حسب i18n.language
CTA يوجه لـ /group/{group_id}
```

### علاقة بـ MiniActivityFeed

`MiniActivityFeed` الحالي يستخدم نفس البيانات (`last_group_event`) ويقوم بنفس الوظيفة. بدلا من التكرار:
- نحذف `MiniActivityFeed` من الـ Dashboard
- نضع `RecentGroupActivityCard` في مكانه الجديد (اسفل Balance Card)
- ملف `MiniActivityFeed.tsx` يبقى موجودا في حال استخدامه في مكان آخر

---

## 4. قواعد الظهور حسب الوضع

| الكرت | Onboarding | Daily Hub | Re-engagement |
|-------|-----------|-----------|---------------|
| StatsLiteCard | ❌ | ✅ | ✅ |
| BalanceStatusCard | ❌ | ✅ | ✅ |
| RecentGroupActivityCard | ❌ | ✅ | ❌ |

---

## 5. ملخص الملفات

### ملفات جديدة

| الملف | الوصف |
|-------|------|
| `src/components/dashboard/StatsLiteCard.tsx` | كرت احصائيات مختصر 2x2 |
| `src/components/dashboard/BalanceStatusCard.tsx` | كرت حالة التوازن المالي |
| `src/components/dashboard/RecentGroupActivityCard.tsx` | كرت آخر نشاط بالمجموعات |

### ملفات معدلة

| الملف | التعديل |
|-------|--------|
| `src/hooks/useDashboardMode.ts` | اضافة 3 display flags جديدة |
| `src/pages/Dashboard.tsx` | اضافة الكروت + حذف MiniActivityFeed + حذف CollapsibleStats |
| `src/i18n/locales/ar/dashboard.json` | اضافة مفاتيح stats_lite + balance_status + recent_activity |
| `src/i18n/locales/en/dashboard.json` | اضافة نفس المفاتيح بالانجليزية |

---

## 6. ما لا يتغير

- `DailyFocusCard` -- لا تعديل
- `MinimalQuickActions` -- لا تعديل
- `SmartPlanCard` -- لا تعديل
- `DailyDiceCard` -- لا تعديل
- `useDashboardData` / `useOptimizedDashboardData` -- لا تعديل (البيانات متوفرة)
- `useDailyHub` -- لا تعديل (last_group_event متوفر)

---

## 7. حالات طرفية

- مستخدم جديد بدون بيانات (0 مجموعات، 0 مصاريف): StatsLiteCard يعرض "لا توجد بيانات بعد" -- لكنه لا يظهر اصلا في Onboarding
- مستخدم متوازن تماما (netBalance = 0): BalanceStatusCard يعرض الحالة الايجابية بلون اخضر
- لا يوجد last_group_event: RecentGroupActivityCard لا يظهر (return null)
- مستخدم re-engagement: يرى Stats + Balance لكن لا يرى Recent Activity
- العملة: يستخدم نفس `t('stats.currency')` الموجود حاليا

