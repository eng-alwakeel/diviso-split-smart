

# اضافة كرت التخطيط الثابت (HomePlanCard) في الصفحة الرئيسية

## ملخص

انشاء كرت تخطيط ثابت يظهر لجميع المستخدمين دائما في الصفحة الرئيسية، مع تغيير محتواه حسب:
- **حالة A**: يوجد خطة نشطة -- يعرض اسم الخطة + زر "عرض الخطة"
- **حالة B**: لا يوجد خطة -- يعرض دعوة + زر "انشاء خطة"
- **حالة Onboarding**: نص خفيف تشجيعي + زر "انشاء خطة"

---

## 1. الملفات الجديدة

### `src/components/dashboard/HomePlanCard.tsx`

مكون جديد ثابت الظهور بتصميم Compact.

```text
الحالة A -- خطة نشطة:
+----------------------------------------------+
| 🗓️  خطتك الحالية                             |
| رحلة جدة | جدة | ⏳ باقي 5 أيام              |
| [ عرض الخطة ]                                |
+----------------------------------------------+

الحالة B -- لا خطة:
+----------------------------------------------+
| 🗓️  خطة جديدة                                |
| رحلة، طلعة، نشاط... خلّ القسمة تمشي من البداية |
| [ ➕ إنشاء خطة ]                              |
+----------------------------------------------+

حالة Onboarding:
+----------------------------------------------+
| 🗓️  التخطيط                                   |
| بعد ما تكمل خطوات البداية، تقدر تسوي خطة      |
| [ ➕ إنشاء خطة ]                              |
+----------------------------------------------+
```

**Props:**
- `activePlan: ActivePlan | null` -- من `dashboardMode.activePlan`
- `mode: DashboardMode` -- من `dashboardMode.mode`

**المنطق:**
- اذا `mode === 'onboarding'`: يعرض حالة Onboarding (نص خفيف)
- اذا `activePlan !== null`: يعرض حالة A (خطة نشطة)
- غير ذلك: يعرض حالة B (لا خطة)

**التنقل:**
- حالة A: `navigate(/plan/${activePlan.id})`
- حالة B + Onboarding: `navigate('/create-plan')`

**التصميم:**
- `Card` بحدود `border-border/50 bg-card/80` (نفس نمط SmartPlanCard)
- ايقونة `CalendarDays` بلون `text-primary` في خلفية `bg-primary/10`
- زر واحد فقط داخل الكرت (`Button variant="outline" size="sm"`)
- حساب الايام المتبقية بدالة `getDaysLeft` + عرض الوجهة ان وجدت

---

## 2. الملفات المعدلة

### `src/pages/Dashboard.tsx`

**3 تعديلات:**

1. **استيراد**: اضافة `import { HomePlanCard } from '@/components/dashboard/HomePlanCard'`
2. **ازالة SmartPlanCard**: حذف سطر الاستيراد + حذف بلوك العرض الشرطي (سطور 17 و 373-376) لان `HomePlanCard` يحل محله
3. **اضافة HomePlanCard**: وضعه بعد `MinimalQuickActions` وقبل `StatsLiteCard` -- بدون شرط (يظهر دائما)

الترتيب النهائي:
```text
1. OnboardingProgress (onboarding فقط)
2. DailyFocusCard (دائما)
3. StreakDisplay (شرطي)
4. DailyDiceCard (شرطي)
5. MinimalQuickActions (شرطي)
6. HomePlanCard (دائما -- ثابت)     <-- الجديد
7. StatsLiteCard (شرطي)
8. BalanceStatusCard (شرطي)
9. DailyRewardCardCompact (شرطي)
10. RecentGroupActivityCard (شرطي)
```

### `src/i18n/locales/ar/dashboard.json`

اضافة مفاتيح `home_plan`:
```json
"home_plan": {
  "title_active": "🗓️ خطتك الحالية",
  "title_new": "🗓️ خطة جديدة",
  "title_onboarding": "🗓️ التخطيط",
  "subtitle_active": "{{destination}}{{separator}}⏳ باقي {{days}} يوم",
  "subtitle_active_no_dest": "⏳ باقي {{days}} يوم",
  "subtitle_new": "رحلة، طلعة، نشاط، سكن مشترك… خلّ القسمة تمشي من البداية",
  "subtitle_onboarding": "بعد ما تكمل خطوات البداية، تقدر تسوي خطة",
  "cta_view": "عرض الخطة",
  "cta_create": "➕ إنشاء خطة"
}
```

### `src/i18n/locales/en/dashboard.json`

نفس المفاتيح بالانجليزية:
```json
"home_plan": {
  "title_active": "🗓️ Your Current Plan",
  "title_new": "🗓️ New Plan",
  "title_onboarding": "🗓️ Planning",
  "subtitle_active": "{{destination}}{{separator}}⏳ {{days}} days left",
  "subtitle_active_no_dest": "⏳ {{days}} days left",
  "subtitle_new": "Trip, outing, activity, shared housing... split from the start",
  "subtitle_onboarding": "After you complete the onboarding steps, you can create a plan",
  "cta_view": "View Plan",
  "cta_create": "➕ Create Plan"
}
```

---

## 3. ما يُحذف

| العنصر | السبب |
|--------|------|
| استيراد `SmartPlanCard` من Dashboard.tsx | يحل محله `HomePlanCard` |
| بلوك عرض `SmartPlanCard` في Dashboard.tsx | مكرر الوظيفة |

ملف `SmartPlanCard.tsx` نفسه لا يُحذف (قد يُستخدم في مكان آخر).

---

## 4. التفاصيل التقنية

### هيكل HomePlanCard

```text
HomePlanCard
├── Card (border-border/50 bg-card/80)
│   └── CardContent (p-4)
│       ├── Header Row: icon + title
│       ├── Subtitle Row: plan name + destination + days / or CTA text
│       └── Button: view or create
```

### حساب الايام المتبقية

```text
getDaysLeft(endDate):
  if (!endDate) return 0
  diff = new Date(endDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
```

### عرض الوجهة (subtitle_active)

- اذا `activePlan.destination` موجود: `"رحلة جدة | جدة | ⏳ باقي 5 أيام"`
- اذا لا وجهة: `"⏳ باقي 5 أيام"` فقط

---

## 5. ملخص الملفات

| الملف | العملية |
|-------|--------|
| `src/components/dashboard/HomePlanCard.tsx` | ملف جديد |
| `src/pages/Dashboard.tsx` | تعديل -- استبدال SmartPlanCard بـ HomePlanCard |
| `src/i18n/locales/ar/dashboard.json` | تعديل -- اضافة مفاتيح home_plan |
| `src/i18n/locales/en/dashboard.json` | تعديل -- اضافة مفاتيح home_plan |

---

## 6. QA

- HomePlanCard يظهر لكل المستخدمين دائما (بدون شرط)
- زر واحد فقط داخل الكرت
- في Onboarding: نص خفيف بدون ضغط
- لا يتعارض مع باقي الكروت
- الزر يفتح الصفحة الصحيحة (`/plan/:id` او `/create-plan`)
