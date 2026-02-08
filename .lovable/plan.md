
# المرحلة 4: الجدول اليومي + أنشطة + اقتراحات AI للأيام

## ملخص

إضافة نظام تخطيط يومي كامل (Itinerary) للخطط مع أنشطة مقسمة حسب الفترة الزمنية، اقتراحات AI لكل يوم، وتحويل الأنشطة لتصويت وربطها بمصاريف.

---

## 1. قاعدة البيانات (Migration)

### A) جدول `plan_days`

| العمود | النوع | الوصف |
|--------|------|-------|
| id | uuid PK default gen_random_uuid() | معرف فريد |
| plan_id | uuid NOT NULL FK plans(id) ON DELETE CASCADE | الخطة |
| date | date NOT NULL | التاريخ |
| day_index | int NOT NULL | ترتيب اليوم (1..N) |
| created_at | timestamptz default now() | تاريخ الإنشاء |

- UNIQUE constraint: (plan_id, date)
- Index: plan_days_plan_idx (plan_id)

### B) جدول `plan_day_activities`

| العمود | النوع | الوصف |
|--------|------|-------|
| id | uuid PK default gen_random_uuid() | معرف فريد |
| plan_day_id | uuid NOT NULL FK plan_days(id) ON DELETE CASCADE | اليوم |
| title | text NOT NULL | عنوان النشاط |
| description | text NULL | تفاصيل |
| time_slot | text NOT NULL default 'any' | الفترة: morning/afternoon/evening/any |
| status | text NOT NULL default 'idea' | الحالة: idea/proposed/locked |
| estimated_cost | numeric NULL | التكلفة التقديرية |
| currency | text default 'SAR' | العملة |
| participant_scope | text NOT NULL default 'all' | نطاق المشاركين: all/custom |
| participant_user_ids | uuid[] NULL | مشاركين محددين |
| created_by | text NOT NULL default 'user' | المنشئ: ai/user |
| linked_expense_id | uuid NULL FK expenses(id) ON DELETE SET NULL | ربط بمصروف |
| linked_vote_id | uuid NULL FK plan_votes(id) ON DELETE SET NULL | ربط بتصويت |
| created_at | timestamptz default now() | تاريخ الإنشاء |

- Index: plan_day_activities_day_idx (plan_day_id)
- Index: plan_day_activities_status_idx (status)

### C) دالة `ensure_plan_days`

دالة RPC تنشئ/تُوفّق أيام الخطة بناءً على start_date و end_date:

```text
create or replace function public.ensure_plan_days(p_plan_id uuid)
returns void
```

المنطق:
1. جلب start_date و end_date من plans
2. إذا أحدهما null: لا تفعل شيئاً
3. إنشاء صف لكل يوم في النطاق (inclusive) إن لم يكن موجوداً
4. حذف الأيام خارج النطاق فقط إذا لم يكن لها أنشطة
5. تحديث day_index ليكون متسلسلاً

### D) Trigger على plans

عند تحديث start_date أو end_date في plans:
- استدعاء ensure_plan_days تلقائياً
- هذا يضمن تحديث الأيام عند تغيير التواريخ

### E) RLS Policies

- **plan_days**: 
  - SELECT: `can_access_plan(auth.uid(), plan_id)`
  - INSERT/UPDATE/DELETE: `is_plan_admin(auth.uid(), plan_id)`
  
- **plan_day_activities**:
  - SELECT: أي شخص يملك access للخطة (عبر join مع plan_days)
  - INSERT: أي عضو في الخطة يمكنه إضافة نشاط
  - UPDATE: المنشئ أو owner/admin
  - DELETE: owner/admin فقط

---

## 2. Edge Function: `plan-day-ai-suggest`

Edge function جديدة لاقتراحات AI لكل يوم:

### المدخلات
```text
{ day_id: uuid, preferences?: string }
```

### المخرجات
```text
{ activities: [{ title, description, time_slot, estimated_cost }] }
```

### المنطق
1. التحقق من الصلاحيات (can_access_plan)
2. Rate limit: 1 تشغيل لكل يوم كل 10 دقائق (عبر فحص آخر نشاط AI لنفس اليوم)
3. جلب بيانات الخطة + اليوم (day_index, date, total days count)
4. منطق ذكي حسب day_index:
   - اليوم الأول: أنشطة وصول + تسجيل + عشاء
   - اليوم الأخير: تسوق + checkout + مغادرة
   - أيام وسط: أنشطة رئيسية كاملة
5. إذا destination مفقودة: إرجاع رسالة تطلب إضافة وجهة
6. استدعاء Lovable AI Gateway (google/gemini-3-flash-preview)
7. Fallback templates حسب plan_type + day_index
8. حذف أنشطة AI سابقة لنفس اليوم (created_by='ai') ثم إدراج الجديدة
9. إرجاع الأنشطة المقترحة

### Fallback Templates

```text
اليوم الأول (trip):
  - morning: "الوصول والتسجيل" + تفاصيل
  - afternoon: "استكشاف المنطقة"
  - evening: "عشاء جماعي"

أيام الوسط (trip):
  - morning: "نشاط صباحي رئيسي"
  - afternoon: "جولة بعد الغداء"
  - evening: "سهرة جماعية"

اليوم الأخير (trip):
  - morning: "إفطار + checkout"
  - afternoon: "تسوق هدايا"
  - evening: "المغادرة"
```

---

## 3. ملفات جديدة

### `src/hooks/usePlanItinerary.ts`

Hook رئيسي لإدارة الجدول اليومي:
- `days`: جلب plan_days مع activities متداخلة
- `ensureDays()`: استدعاء RPC ensure_plan_days
- `addActivity(dayId, data)`: إضافة نشاط
- `updateActivity(activityId, data)`: تعديل نشاط
- `deleteActivity(activityId)`: حذف نشاط
- `generateDaySuggestions(dayId, preferences?)`: استدعاء edge function
- `convertActivityToVote(activityId)`: تحويل نشاط لتصويت
- `linkActivityToExpense(activityId, expenseId)`: ربط بمصروف
- `isLoading`, `isGenerating`

### `src/components/plans/PlanItineraryTab.tsx`

تبويب الجدول اليومي الرئيسي:

```text
حالة بدون تواريخ:
+------------------------------------------+
|  📅  أضف تواريخ الخطة ليظهر الجدول       |
|     [تعديل الخطة]                        |
+------------------------------------------+

حالة مع تواريخ:
+------------------------------------------+
|  اليوم 1 — 10/02/2026                    |
|  [+ نشاط] [🤖 اقترح]                    |
|  ┌─ صباح ─────────────────────────┐     |
|  │ الوصول والتسجيل  [فكرة]        │     |
|  └─────────────────────────────────┘     |
|  ┌─ مساء ──────────────────────────┐     |
|  │ عشاء جماعي  [مقترح] 200 ر.س    │     |
|  └─────────────────────────────────┘     |
+------------------------------------------+
|  اليوم 2 — 11/02/2026                    |
|  [+ نشاط] [🤖 اقترح]                    |
|  ...                                     |
+------------------------------------------+
```

### `src/components/plans/DayCard.tsx`

بطاقة اليوم:
- Header: "اليوم {day_index} -- {date}"
- أزرار: "إضافة نشاط" + "اقترح أنشطة"
- تجميع الأنشطة حسب time_slot (اختياري UI)
- عرض ActivityCard لكل نشاط
- حالة التحميل عند توليد AI

### `src/components/plans/ActivityCard.tsx`

بطاقة النشاط:
- title + description (قابلة للتوسيع)
- Badge الحالة: idea (رمادي) / proposed (أزرق) / locked (أخضر)
- Badge الفترة: صباح/ظهر/مساء/عام
- التكلفة التقديرية (إن وجدت)
- مؤشر المشاركين (الكل / مخصص)
- مؤشر الربط بتصويت (إن وجد linked_vote_id)
- مؤشر الربط بمصروف (إن وجد linked_expense_id)
- قائمة إجراءات (DropdownMenu):
  - "تعديل"
  - "حوّل لتصويت"
  - "اربط بمصروف"
  - "قفل النشاط" (admin فقط)
  - "حذف" (admin فقط)

### `src/components/plans/AddActivityDialog.tsx`

حوار إضافة نشاط:
- العنوان (مطلوب)
- الفترة الزمنية (morning/afternoon/evening/any)
- قسم "تفاصيل إضافية" (Collapsible):
  - الوصف
  - التكلفة التقديرية + العملة
  - نطاق المشاركين (all/custom)
- زر حفظ

### `src/components/plans/EditActivityDialog.tsx`

حوار تعديل نشاط (مشابه لإضافة + تعبئة مسبقة + تعديل الحالة)

### `src/components/plans/LinkActivityExpenseDialog.tsx`

حوار ربط نشاط بمصروف:
- خياران:
  1. "إنشاء مصروف جديد" -- ينتقل لـ AddExpense مع بيانات مسبقة
  2. "ربط بمصروف موجود" -- قائمة مصاريف الخطة (plan_id = this plan)
- عند الربط: تحديث activity.linked_expense_id

---

## 4. الملفات المعدلة

### `src/pages/PlanDetails.tsx`

تغييرات:
- إضافة تبويب خامس "الجدول" (itinerary) في TabsList (grid-cols-5)
- إضافة TabsContent لـ PlanItineraryTab
- تمرير: planId, isAdmin, hasDates (start_date && end_date), plan data

### `supabase/config.toml`

إضافة:
```text
[functions.plan-day-ai-suggest]
verify_jwt = true
```

### `src/i18n/locales/ar/plans.json`

إضافة مفاتيح:
```text
"itinerary": {
  "tab": "الجدول",
  "no_dates": "أضف تواريخ الخطة ليظهر الجدول اليومي",
  "edit_plan": "تعديل الخطة",
  "day_title": "اليوم {{index}}",
  "add_activity": "إضافة نشاط",
  "suggest_activities": "🤖 اقترح أنشطة",
  "suggesting": "جاري الاقتراح...",
  "suggest_success": "تم اقتراح أنشطة لهذا اليوم",
  "suggest_error": "فشل في اقتراح الأنشطة",
  "suggest_no_destination": "أضف وجهة الخطة أولاً للحصول على اقتراحات مخصصة",
  "suggest_rate_limited": "انتظر 10 دقائق قبل المحاولة مرة أخرى",
  "no_activities": "لا توجد أنشطة لهذا اليوم",
  "time_slots": {
    "morning": "صباح",
    "afternoon": "ظهر",
    "evening": "مساء",
    "any": "عام"
  },
  "activity_status": {
    "idea": "فكرة",
    "proposed": "مقترح",
    "locked": "مثبّت"
  },
  "activity_actions": {
    "edit": "تعديل",
    "convert_to_vote": "حوّل لتصويت",
    "link_expense": "اربط بمصروف",
    "lock": "تثبيت",
    "unlock": "إلغاء التثبيت",
    "delete": "حذف",
    "delete_confirm": "حذف هذا النشاط؟",
    "delete_confirm_desc": "لا يمكن التراجع عن هذا الإجراء"
  },
  "add_activity_dialog": {
    "title": "إضافة نشاط",
    "activity_title": "عنوان النشاط",
    "activity_title_placeholder": "مثال: زيارة المتحف",
    "time_slot": "الفترة الزمنية",
    "extra_details": "تفاصيل إضافية",
    "description": "الوصف",
    "description_placeholder": "تفاصيل إضافية عن النشاط",
    "estimated_cost": "التكلفة التقديرية",
    "participants": "المشاركين",
    "all_members": "جميع الأعضاء",
    "custom": "مخصص",
    "save": "حفظ",
    "saving": "جاري الحفظ..."
  },
  "edit_activity_dialog": {
    "title": "تعديل نشاط"
  },
  "link_expense_dialog": {
    "title": "ربط النشاط بمصروف",
    "create_new": "إنشاء مصروف جديد",
    "link_existing": "ربط بمصروف موجود",
    "no_plan_expenses": "لا توجد مصاريف في الخطة",
    "link_success": "تم ربط النشاط بالمصروف",
    "link_error": "فشل في الربط"
  },
  "convert_vote_success": "تم تحويل النشاط لتصويت",
  "convert_vote_error": "فشل في التحويل",
  "activity_saved": "تم حفظ النشاط",
  "activity_updated": "تم تحديث النشاط",
  "activity_deleted": "تم حذف النشاط",
  "activity_locked": "تم تثبيت النشاط",
  "activity_unlocked": "تم إلغاء تثبيت النشاط"
}
```

### `src/i18n/locales/en/plans.json`

إضافة نفس المفاتيح بالإنجليزية:
```text
"itinerary": {
  "tab": "Itinerary",
  "no_dates": "Add plan dates to see the daily schedule",
  "edit_plan": "Edit Plan",
  "day_title": "Day {{index}}",
  "add_activity": "Add Activity",
  "suggest_activities": "🤖 Suggest Activities",
  "suggesting": "Suggesting...",
  "suggest_success": "Activities suggested for this day",
  "suggest_error": "Failed to suggest activities",
  "suggest_no_destination": "Add a plan destination first for personalized suggestions",
  "suggest_rate_limited": "Wait 10 minutes before trying again",
  "no_activities": "No activities for this day",
  "time_slots": {
    "morning": "Morning",
    "afternoon": "Afternoon",
    "evening": "Evening",
    "any": "Any time"
  },
  "activity_status": {
    "idea": "Idea",
    "proposed": "Proposed",
    "locked": "Locked"
  },
  "activity_actions": {
    "edit": "Edit",
    "convert_to_vote": "Convert to Vote",
    "link_expense": "Link Expense",
    "lock": "Lock",
    "unlock": "Unlock",
    "delete": "Delete",
    "delete_confirm": "Delete this activity?",
    "delete_confirm_desc": "This action cannot be undone"
  },
  "add_activity_dialog": {
    "title": "Add Activity",
    "activity_title": "Activity Title",
    "activity_title_placeholder": "e.g., Visit the museum",
    "time_slot": "Time Slot",
    "extra_details": "Extra Details",
    "description": "Description",
    "description_placeholder": "Additional details about the activity",
    "estimated_cost": "Estimated Cost",
    "participants": "Participants",
    "all_members": "All Members",
    "custom": "Custom",
    "save": "Save",
    "saving": "Saving..."
  },
  "edit_activity_dialog": {
    "title": "Edit Activity"
  },
  "link_expense_dialog": {
    "title": "Link Activity to Expense",
    "create_new": "Create New Expense",
    "link_existing": "Link Existing Expense",
    "no_plan_expenses": "No expenses in this plan",
    "link_success": "Activity linked to expense",
    "link_error": "Failed to link"
  },
  "convert_vote_success": "Activity converted to vote",
  "convert_vote_error": "Failed to convert",
  "activity_saved": "Activity saved",
  "activity_updated": "Activity updated",
  "activity_deleted": "Activity deleted",
  "activity_locked": "Activity locked",
  "activity_unlocked": "Activity unlocked"
}
```

---

## 5. التفاصيل التقنية

### سلوك ensure_plan_days

```text
plan.start_date = 2026-02-10
plan.end_date = 2026-02-13

Result:
  plan_days: [
    { date: 2026-02-10, day_index: 1 },
    { date: 2026-02-11, day_index: 2 },
    { date: 2026-02-12, day_index: 3 },
    { date: 2026-02-13, day_index: 4 },
  ]

If dates change to 2026-02-11 -> 2026-02-14:
  - Day 2026-02-10: delete ONLY if no activities exist
  - Day 2026-02-14: create new
  - Reindex all remaining days
```

### سلوك توليد AI لليوم

```text
User clicks "اقترح أنشطة" on Day 2
  --> Edge function: plan-day-ai-suggest
  --> Checks: rate limit (10 min), access, destination required
  --> AI prompt includes: plan_type, destination, budget, day_index, total_days
  --> Generates 3-5 activities with time_slots
  --> Deletes old AI activities for this day (created_by='ai')
  --> Inserts new activities with status='proposed', created_by='ai'
  --> Returns activities to UI
  --> Toast: "تم اقتراح أنشطة لهذا اليوم"
```

### سلوك تحويل نشاط لتصويت

```text
User clicks "حوّل لتصويت" on activity
  --> Creates plan_vote: title=activity.title
  --> Creates 3 options: "نعم" / "لا" / "بديل"
  --> Updates activity.linked_vote_id = new vote.id
  --> Toast + navigate to votes tab
```

### سلوك ربط نشاط بمصروف

```text
User clicks "اربط بمصروف"
  --> LinkActivityExpenseDialog opens
  --> Option 1: "إنشاء مصروف جديد"
    --> Navigate to /add-expense?planId=X&groupId=Y&title=activity.title&amount=estimated_cost&date=day.date
    --> After create: update activity.linked_expense_id
  --> Option 2: "ربط بمصروف موجود"
    --> Show list of plan expenses where linked to no activity
    --> Pick one --> update activity.linked_expense_id
```

### تغييرات تبويب PlanDetails

```text
الحالي: grid-cols-4 (ملخص | اقتراحات | تصويت | مصاريف)
الجديد: grid-cols-5 (ملخص | الجدول | اقتراحات | تصويت | مصاريف)

تبويب "الجدول" يكون في المرتبة الثانية بعد الملخص لأنه الأهم يومياً
```

---

## 6. ملخص الملفات

### ملفات جديدة

| الملف | الوصف |
|-------|------|
| Migration SQL | plan_days + plan_day_activities + ensure_plan_days RPC + trigger + RLS |
| `supabase/functions/plan-day-ai-suggest/index.ts` | Edge function لاقتراحات AI يومية |
| `src/hooks/usePlanItinerary.ts` | Hook إدارة الجدول اليومي |
| `src/components/plans/PlanItineraryTab.tsx` | تبويب الجدول الرئيسي |
| `src/components/plans/DayCard.tsx` | بطاقة اليوم مع أنشطة |
| `src/components/plans/ActivityCard.tsx` | بطاقة النشاط مع إجراءات |
| `src/components/plans/AddActivityDialog.tsx` | حوار إضافة نشاط |
| `src/components/plans/EditActivityDialog.tsx` | حوار تعديل نشاط |
| `src/components/plans/LinkActivityExpenseDialog.tsx` | حوار ربط نشاط بمصروف |

### ملفات معدلة

| الملف | التعديل |
|-------|--------|
| `src/pages/PlanDetails.tsx` | إضافة تبويب "الجدول" (grid-cols-5) + import PlanItineraryTab |
| `supabase/config.toml` | إضافة plan-day-ai-suggest function config |
| `src/i18n/locales/ar/plans.json` | إضافة مفاتيح itinerary |
| `src/i18n/locales/en/plans.json` | إضافة مفاتيح itinerary |

---

## 7. حالات طرفية مهمة

- خطة بيوم واحد (طلعة/نشاط): يعمل بشكل طبيعي مع day_index=1
- تحديث التواريخ: الأيام الموجودة تبقى إن كانت تحتوي أنشطة
- إعادة تشغيل AI: يحذف أنشطة AI السابقة فقط، لا يمس أنشطة المستخدم
- خطة بدون وجهة: AI يرجع رسالة تطلب إضافة وجهة بدل الفشل
- صلاحيات: أي عضو يمكنه إضافة نشاط، فقط admin/owner يمكنهم الحذف والقفل
