
# المرحلة 3: ربط المصاريف بالخطط

## ملخص

ربط المصاريف بالخطط مع تبويب مصاريف كامل في صفحة تفاصيل الخطة، وإمكانية إضافة مصروف مباشرة من الخطة، ونقل مصروف موجود إلى خطة.

---

## الوضع الحالي

- عمود `plan_id` موجود بالفعل في جدول `expenses` (تم إنشاؤه في المرحلة 1)
- صفحة `PlanDetails.tsx` تعرض placeholder "قريباً" في تبويب المصاريف
- صفحة `AddExpense.tsx` تدعم `groupId` كـ URL parameter لكنها لا تدعم `planId`
- مكونات `ExpenseCard` و `ExpenseDetailsDialog` موجودة ويمكن إعادة استخدامها

---

## 1. قاعدة البيانات (Migration)

### RPC جديد: `link_expense_to_plan`

دالة تنقل مصروف موجود إلى خطة:

```text
create or replace function public.link_expense_to_plan(
  p_expense_id uuid,
  p_plan_id uuid
) returns boolean
```

- التحقق أن المستخدم هو منشئ المصروف أو الدافع
- التحقق أن المستخدم يملك صلاحية الوصول للخطة (`can_access_plan`)
- التحقق أن المصروف ينتمي لنفس المجموعة المرتبطة بالخطة (إن وجدت)
- تحديث `expenses.plan_id = p_plan_id`
- إرجاع `true` عند النجاح

### RPC جديد: `unlink_expense_from_plan`

دالة تفصل مصروف عن خطة:

```text
create or replace function public.unlink_expense_from_plan(
  p_expense_id uuid
) returns boolean
```

- التحقق أن المستخدم هو منشئ المصروف أو مشرف الخطة
- تحديث `expenses.plan_id = null`
- إرجاع `true` عند النجاح

---

## 2. ملفات جديدة

### `src/hooks/usePlanExpenses.ts`

Hook لإدارة مصاريف الخطة:
- `expenses`: جلب المصاريف المرتبطة بالخطة عبر `plan_id`
- `stats`: إجمالي المصاريف، عدد المصاريف، إجمالي معتمد/معلق
- `linkExpense(expenseId, planId)`: ربط مصروف موجود بالخطة
- `unlinkExpense(expenseId)`: فصل مصروف عن الخطة
- `isLoading`, `refetch`

### `src/components/plans/PlanExpensesTab.tsx`

مكون تبويب المصاريف في تفاصيل الخطة:

```text
+------------------------------------------+
|  [إجمالي: 2,500 ريال | 5 مصاريف]        |
|  [+ إضافة مصروف]  [نقل مصروف للخطة]     |
+------------------------------------------+
|                                          |
|  [بطاقة مصروف 1 - عشاء - 500 ر.س]      |
|  [بطاقة مصروف 2 - بنزين - 200 ر.س]     |
|  [بطاقة مصروف 3 - فندق - 1800 ر.س]     |
|                                          |
|  حالة فارغة:                             |
|  "لا توجد مصاريف مرتبطة بهذه الخطة"     |
|  [+ إضافة مصروف] [نقل مصروف موجود]       |
+------------------------------------------+
```

يعرض:
- ملخص إجمالي المصاريف مقارنة بالميزانية (إن وجدت)
- شريط تقدم الميزانية (budget_value vs total_spent)
- قائمة بطاقات المصاريف (يعيد استخدام مكون مبسط)
- زر "إضافة مصروف" يوجه لـ `/add-expense?planId=X&groupId=Y`
- زر "نقل مصروف للخطة" يفتح `LinkExpenseDialog`

### `src/components/plans/LinkExpenseDialog.tsx`

حوار لاختيار مصروف موجود ونقله للخطة:

```text
+------------------------------------------+
|     نقل مصروف إلى الخطة                  |
+------------------------------------------+
|  [بحث...]                                |
|                                          |
|  ○ عشاء - 500 ريال - 5 فبراير           |
|  ○ بنزين - 200 ريال - 3 فبراير          |
|  ○ تذاكر - 1200 ريال - 1 فبراير         |
|                                          |
|  [نقل للخطة]                             |
+------------------------------------------+
```

- يعرض المصاريف التي تنتمي لنفس المجموعة المرتبطة بالخطة (أو مصاريف المستخدم إن لم تكن مرتبطة بمجموعة)
- يستبعد المصاريف المرتبطة بخطط أخرى
- يدعم البحث بالوصف
- عند الاختيار: يستدعي RPC `link_expense_to_plan`

### `src/components/plans/PlanExpenseCard.tsx`

بطاقة مصروف مبسطة خاصة بتبويب الخطة:
- تعرض: الوصف، المبلغ، التاريخ، الحالة
- زر "فصل عن الخطة" (unlink) لمشرف الخطة
- الضغط على البطاقة يفتح `ExpenseDetailsDialog`

---

## 3. الملفات المعدلة

### `src/pages/PlanDetails.tsx`

- استبدال placeholder "قريباً" في تبويب المصاريف بـ `PlanExpensesTab`
- تمرير `planId`, `isAdmin`, `plan.group_id`, `plan.budget_value`, `plan.budget_currency`

### `src/pages/AddExpense.tsx`

- إضافة دعم لـ `planId` كـ URL parameter
- عند وجود `planId`: جلب بيانات الخطة (group_id) وتحديد المجموعة تلقائياً
- عند حفظ المصروف: إضافة `plan_id` في بيانات الإدخال
- بعد الحفظ: التوجيه لصفحة الخطة بدل المجموعة إن جاء من خطة

### `src/i18n/locales/ar/plans.json`

إضافة مفاتيح جديدة:
```text
"expenses_tab": {
  "title": "المصاريف",
  "total": "إجمالي المصاريف",
  "count": "{{count}} مصروف",
  "add_expense": "إضافة مصروف",
  "link_expense": "نقل مصروف للخطة",
  "unlink_expense": "فصل عن الخطة",
  "unlink_confirm": "فصل المصروف عن الخطة؟",
  "unlink_confirm_desc": "سيتم إزالة المصروف من الخطة لكنه لن يُحذف",
  "unlink_success": "تم فصل المصروف عن الخطة",
  "unlink_error": "فشل في فصل المصروف",
  "link_success": "تم نقل المصروف للخطة",
  "link_error": "فشل في نقل المصروف",
  "empty": "لا توجد مصاريف مرتبطة بالخطة",
  "empty_desc": "أضف مصاريف جديدة أو انقل مصاريف موجودة",
  "budget_progress": "{{spent}} من {{budget}} {{currency}}",
  "over_budget": "تجاوز الميزانية!",
  "budget_remaining": "متبقي: {{remaining}} {{currency}}"
},
"link_expense_dialog": {
  "title": "نقل مصروف إلى الخطة",
  "description": "اختر مصروف من المجموعة لنقله للخطة",
  "search_placeholder": "ابحث بالوصف...",
  "no_expenses": "لا توجد مصاريف متاحة للنقل",
  "confirm": "نقل للخطة",
  "linking": "جاري النقل...",
  "already_linked": "مرتبط بخطة أخرى"
}
```

### `src/i18n/locales/en/plans.json`

إضافة نفس المفاتيح بالإنجليزية:
```text
"expenses_tab": {
  "title": "Expenses",
  "total": "Total Expenses",
  "count": "{{count}} expenses",
  "add_expense": "Add Expense",
  "link_expense": "Move Expense to Plan",
  "unlink_expense": "Remove from Plan",
  "unlink_confirm": "Remove expense from plan?",
  "unlink_confirm_desc": "The expense will be removed from the plan but won't be deleted",
  "unlink_success": "Expense removed from plan",
  "unlink_error": "Failed to remove expense",
  "link_success": "Expense moved to plan",
  "link_error": "Failed to move expense",
  "empty": "No expenses linked to this plan",
  "empty_desc": "Add new expenses or move existing ones",
  "budget_progress": "{{spent}} of {{budget}} {{currency}}",
  "over_budget": "Over budget!",
  "budget_remaining": "Remaining: {{remaining}} {{currency}}"
},
"link_expense_dialog": {
  "title": "Move Expense to Plan",
  "description": "Choose an expense from the group to move to this plan",
  "search_placeholder": "Search by description...",
  "no_expenses": "No expenses available to move",
  "confirm": "Move to Plan",
  "linking": "Moving...",
  "already_linked": "Linked to another plan"
}
```

---

## 4. التفاصيل التقنية

### سلوك إضافة مصروف من الخطة

```text
User clicks "إضافة مصروف" in PlanExpensesTab
  --> Navigate to /add-expense?planId=xxx&groupId=yyy
  --> AddExpense reads planId from URL
  --> Auto-selects group from plan's group_id
  --> On save: includes plan_id in expense INSERT
  --> After save: navigates back to /plan/:id
```

### سلوك نقل مصروف موجود

```text
User clicks "نقل مصروف للخطة"
  --> LinkExpenseDialog opens
  --> Fetches expenses from same group where plan_id IS NULL
  --> User selects expense
  --> RPC: link_expense_to_plan(expense_id, plan_id)
  --> Refresh plan expenses list
  --> Toast: "تم نقل المصروف للخطة"
```

### سلوك فصل مصروف عن الخطة

```text
User clicks "فصل عن الخطة" on expense card
  --> Confirmation dialog
  --> RPC: unlink_expense_from_plan(expense_id)
  --> Refresh plan expenses list
  --> Toast: "تم فصل المصروف عن الخطة"
```

### شريط تقدم الميزانية

```text
إذا الخطة لها budget_value:
  total_spent = مجموع مبالغ المصاريف المعتمدة (approved)
  progress = (total_spent / budget_value) * 100

  اللون:
  - أخضر: < 75%
  - أصفر: 75% - 100%
  - أحمر: > 100% (تجاوز الميزانية)
```

### جلب المصاريف المتاحة للنقل (LinkExpenseDialog)

```text
SELECT * FROM expenses
WHERE group_id = plan.group_id   -- نفس المجموعة
  AND plan_id IS NULL             -- غير مرتبط بخطة
  AND (created_by = auth.uid() OR payer_id = auth.uid())
ORDER BY spent_at DESC
LIMIT 50
```

---

## 5. ملخص الملفات

### ملفات جديدة

| الملف | الوصف | الأولوية |
|-------|------|---------|
| Migration: RPCs (`link_expense_to_plan`, `unlink_expense_from_plan`) | دوال ربط/فصل المصاريف | حرجة |
| `src/hooks/usePlanExpenses.ts` | Hook مصاريف الخطة | حرجة |
| `src/components/plans/PlanExpensesTab.tsx` | تبويب المصاريف | حرجة |
| `src/components/plans/PlanExpenseCard.tsx` | بطاقة مصروف الخطة | حرجة |
| `src/components/plans/LinkExpenseDialog.tsx` | حوار نقل مصروف | مهمة |

### ملفات معدلة

| الملف | التعديل | الأولوية |
|-------|--------|---------|
| `src/pages/PlanDetails.tsx` | استبدال placeholder بـ `PlanExpensesTab` | حرجة |
| `src/pages/AddExpense.tsx` | دعم `planId` URL param + إضافة `plan_id` في الإدخال | حرجة |
| `src/i18n/locales/ar/plans.json` | إضافة مفاتيح المصاريف | مهمة |
| `src/i18n/locales/en/plans.json` | إضافة مفاتيح المصاريف | مهمة |
