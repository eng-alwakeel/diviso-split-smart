

# اضافة كرت المكافأة اليومية المختصر (DailyRewardCardCompact)

## ملخص

انشاء كرت مكافأة يومية مختصر (Compact) يحل محل كرت `DailyCheckInCard` الكامل في الصفحة الرئيسية. الكرت يعرض معلومات اساسية فقط (سلسلة، حالة اليوم، عملات) بدون CTA وبدون شريط زمني.

---

## 1. ملف جديد

### `src/components/dashboard/DailyRewardCardCompact.tsx`

كرت مختصر يعرض 3 عناصر فقط:

```text
+------------------------------------------+
| 🏆 المكافأة اليومية        🔥 13         |
|                                          |
| ✅ تم تسجيل دخولك اليوم                 |
|   أو                                      |
| 🎁 سجّل دخولك لتحصل على المكافأة        |
|                                          |
| 108 عملة  |  22 تسجيل  |  13 أطول سلسلة |
+------------------------------------------+
```

**المنطق:**
- يستخدم `useDailyCheckin` hook الموجود (نفس البيانات)
- الكرت بالكامل قابل للضغط (يستخدم `onClick` على الـ Card) ويوجه لصفحة `/rewards` (او اي صفحة مكافآت مستقبلية)
- بدون زر CTA
- بدون شريط ايام الاسبوع (DayCircle)
- ارتفاع منخفض (compact)

**التصميم:**
- Header: ايقونة Trophy + عنوان "المكافأة اليومية" + badge سلسلة (Flame + رقم)
- Body: سطر واحد يعرض حالة اليوم
  - اذا `checkedInToday`: نص اخضر "تم تسجيل دخولك اليوم" مع ايقونة Check
  - اذا لم يسجل: نص `text-muted-foreground` "سجّل دخولك لتحصل على المكافأة" مع ايقونة Gift
- Footer: 3 ارقام مختصرة (عملات | تسجيلات | اطول سلسلة) -- تظهر فقط اذا العملات > 0

**لا يكرر معلومات StatsLite** لأن StatsLite يعرض مصاريف/رصيد/مجموعات/مستحقات، بينما هذا الكرت يعرض عملات/تسجيلات/سلسلة (بيانات مختلفة تماما).

---

## 2. الملفات المعدلة

### `src/hooks/useDashboardMode.ts`

اضافة display flag جديد:

```text
showDailyRewardCard: boolean;
```

المنطق:
```text
const showDailyRewardCard = mode === 'daily_hub' || mode === 'reengagement';
```

- لا يظهر في Onboarding
- يظهر في Daily Hub و Re-engagement

اضافته في:
- `DashboardModeData` interface
- `computed` return
- الـ return النهائي للـ hook

### `src/pages/Dashboard.tsx`

**التعديلات:**

A) استيراد المكون الجديد (lazy):
```text
const DailyRewardCardCompact = lazy(() => 
  import("@/components/dashboard/DailyRewardCardCompact")
    .then(m => ({ default: m.DailyRewardCardCompact }))
);
```

B) وضع الكرت بين BalanceStatusCard و RecentGroupActivityCard:
```text
{/* Balance Status Card */}
{dashboardMode.showBalanceCard && <BalanceStatusCard ... />}

{/* Daily Reward Card Compact -- جديد */}
{dashboardMode.showDailyRewardCard && (
  <Suspense fallback={<CardSkeleton />}>
    <DailyRewardCardCompact />
  </Suspense>
)}

{/* Recent Group Activity */}
{dashboardMode.showRecentActivity && <RecentGroupActivityCard ... />}
```

C) حذف `DailyCheckInCard` من "Daily Hub extras" (سطور 416-418) لتجنب التكرار -- الكرت المختصر يحل محله في الصفحة الرئيسية.

### `src/i18n/locales/ar/dashboard.json`

اضافة مفاتيح جديدة:
```text
"daily_reward_compact": {
  "title": "المكافأة اليومية",
  "checked_in": "تم تسجيل دخولك اليوم ✓",
  "not_checked_in": "سجّل دخولك لتحصل على المكافأة",
  "coins": "عملة",
  "checkins": "تسجيل",
  "longest_streak": "أطول سلسلة"
}
```

### `src/i18n/locales/en/dashboard.json`

اضافة نفس المفاتيح:
```text
"daily_reward_compact": {
  "title": "Daily Reward",
  "checked_in": "Checked in today ✓",
  "not_checked_in": "Check in to get your reward",
  "coins": "Coins",
  "checkins": "Check-ins",
  "longest_streak": "Longest streak"
}
```

---

## 3. التفاصيل التقنية

### البيانات المستخدمة

من `useDailyCheckin` hook الموجود:
- `streak.currentStreak` -- عدد ايام السلسلة الحالية
- `streak.coins` -- اجمالي العملات
- `streak.totalCheckIns` -- عدد التسجيلات
- `streak.longestStreak` -- اطول سلسلة
- `checkedInToday` -- هل سجل اليوم

لا حاجة لبيانات جديدة او queries اضافية.

### سلوك الضغط

الكرت قابل للضغط بالكامل:
```text
onClick={() => navigate('/rewards')
```
اذا صفحة `/rewards` غير موجودة حاليا، يمكن التوجيه مؤقتا لأي صفحة مناسبة او تجاهل الـ navigate. سأستخدم `cursor-pointer` على الكرت مع `onClick`.

### ارتفاع الكرت

- `CardContent` بـ `p-3` (بدل `p-4`)
- بدون `mb-4` بين العناصر
- Footer بـ `mt-2 pt-2` (بدل `mt-3 pt-3`)
- الهدف: ارتفاع اقل من نصف الكرت الكامل

---

## 4. الترتيب النهائي للصفحة

```text
1. Welcome Header
2. OnboardingChecklist (ان وجد)
3. DailyFocusCard
4. StreakDisplay
5. SmartPlanCard (daily_hub + hasActivePlan)
6. DailyDiceCard (per showDice)
7. MinimalQuickActions
8. StatsLiteCard (daily_hub + reengagement)
9. BalanceStatusCard (daily_hub + reengagement)
10. DailyRewardCardCompact (daily_hub + reengagement)  ← جديد
11. RecentGroupActivityCard (daily_hub only)
12. CreditBalanceCard, ShareableAchievement, etc. (daily_hub extras)
13. InstallWidget
```

---

## 5. قواعد الظهور

| الكرت | Onboarding | Daily Hub | Re-engagement |
|-------|-----------|-----------|---------------|
| DailyRewardCardCompact | ❌ | ✅ | ✅ |

---

## 6. ملخص الملفات

### ملفات جديدة

| الملف | الوصف |
|-------|------|
| `src/components/dashboard/DailyRewardCardCompact.tsx` | كرت المكافأة اليومية المختصر |

### ملفات معدلة

| الملف | التعديل |
|-------|--------|
| `src/hooks/useDashboardMode.ts` | اضافة `showDailyRewardCard` flag |
| `src/pages/Dashboard.tsx` | اضافة الكرت + حذف DailyCheckInCard من Daily Hub extras |
| `src/i18n/locales/ar/dashboard.json` | اضافة مفاتيح `daily_reward_compact` |
| `src/i18n/locales/en/dashboard.json` | اضافة مفاتيح `daily_reward_compact` |

---

## 7. ما لا يتغير

- `useDailyCheckin.ts` -- لا تعديل (الـ hook يبقى كما هو)
- `DailyCheckInCard.tsx` -- الملف يبقى موجودا (قد يُستخدم في صفحة مكافآت مستقلة مستقبلا)
- `StatsLiteCard` -- لا تعديل
- `BalanceStatusCard` -- لا تعديل
- `DailyFocusCard` -- لا تعديل

---

## 8. حالات طرفية

- مستخدم لم يسجل ابدا (0 عملات، 0 تسجيلات): يعرض حالة "سجّل دخولك" بدون footer (العملات = 0)
- مستخدم سجل اليوم: يعرض حالة "تم التسجيل" بلون اخضر
- مستخدم onboarding: لا يرى الكرت
- مستخدم re-engagement: يرى الكرت (تحفيز للعودة)

