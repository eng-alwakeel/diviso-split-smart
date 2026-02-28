
# Drill-down لبطاقات "لك/عليك" في صفحة مصاريفي

## ملخص
إضافة صفحتين جديدتين (Receivables / Payables) تعرضان تفصيل المجموعات التي تسبب الرصيد الإيجابي أو السلبي، مع إمكانية الدخول المباشر لأي مجموعة.

---

## المنهج التقني

البيانات المطلوبة متوفرة بالفعل: hook `useMyExpenses` يحمّل كل المصاريف مع `group_id`, `group_name`, `payer_id`, و`splits`. يمكن حساب صافي كل مجموعة من هذه البيانات بدون أي API calls جديدة.

**حساب الصافي لكل مجموعة:**
```
لكل مصروف في المجموعة:
  إذا المستخدم هو الدافع → يضيف amount
  نصيب المستخدم من splits → يطرح share_amount
  الصافي = المدفوع - المستحق
```

---

## A) صفحة جديدة: BalanceDrilldown

**ملف جديد:** `src/pages/BalanceDrilldown.tsx`

صفحة واحدة تخدم كلا الحالتين (receivables / payables) عبر query param أو route param:
- Route: `/my-expenses/receivables` و `/my-expenses/payables`
- تحدد النوع من الـ URL path

**محتوى الصفحة:**
- AppHeader + زر رجوع
- عنوان: "لك عند الآخرين" أو "عليك للآخرين" حسب النوع
- وصف مختصر
- قائمة مجموعات مرتبة تنازلياً حسب المبلغ
- كل عنصر: اسم المجموعة + المبلغ + سهم للدخول
- الضغط على أي مجموعة → `/group/:id` (تبويب التسويات)
- Empty state عند عدم وجود نتائج + زر "العودة"
- BottomNav + padding-bottom مناسب

---

## B) Hook مساعد: useGroupBalances

**ملف جديد:** `src/hooks/useGroupBalances.ts`

Hook بسيط يستقبل `expenses` و `currentUserId` من `useMyExpenses` ويحسب:
- per-group net balance (المدفوع - المستحق لكل مجموعة)
- قائمة `receivableGroups` (صافي > 0) مرتبة تنازلياً
- قائمة `payableGroups` (صافي < 0) مرتبة تنازلياً

لا يستدعي أي API — فقط `useMemo` على البيانات الموجودة.

---

## C) تعديل ExpenseStats.tsx — جعل البطاقات clickable

**الملف:** `src/components/expenses/ExpenseStats.tsx`

التغييرات:
- إضافة prop `onNetBalanceClick` (callback)
- بطاقة "الرصيد الصافي": تصبح clickable
  - إذا الرصيد موجب → `navigate('/my-expenses/receivables')`
  - إذا سالب → `navigate('/my-expenses/payables')`
  - إذا صفر → لا شيء
- إضافة سهم صغير (ChevronLeft) كمؤشر بصري أنها قابلة للنقر
- بطاقة "إجمالي المدفوع" و"إجمالي المستحق" تبقى كما هي (بدون drill-down)

---

## D) تعديل App.tsx — إضافة Routes

إضافة route جديد:
```
/my-expenses/receivables → BalanceDrilldown (type=receivables)
/my-expenses/payables → BalanceDrilldown (type=payables)
```

---

## E) ترجمات i18n

إضافة مفاتيح في `expenses.json` (ar + en):
- `drilldown.receivables_title`: "لك عند الآخرين" / "Owed to You"
- `drilldown.payables_title`: "عليك للآخرين" / "You Owe"
- `drilldown.receivables_desc`: "المجموعات التي لك فيها مبالغ"
- `drilldown.payables_desc`: "المجموعات التي عليك فيها مبالغ"
- `drilldown.open_group`: "فتح المجموعة"
- `drilldown.no_receivables`: "لا يوجد مبالغ لك حالياً"
- `drilldown.no_payables`: "لا يوجد مبالغ عليك حالياً"
- `drilldown.back`: "العودة"

---

## F) الملفات المتأثرة

| الملف | نوع التغيير |
|-------|-------------|
| `src/pages/BalanceDrilldown.tsx` | **جديد** — صفحة drill-down |
| `src/hooks/useGroupBalances.ts` | **جديد** — حساب صافي كل مجموعة |
| `src/components/expenses/ExpenseStats.tsx` | تعديل — بطاقة الرصيد clickable |
| `src/App.tsx` | تعديل — إضافة routes |
| `src/i18n/locales/ar/expenses.json` | تعديل — مفاتيح ترجمة |
| `src/i18n/locales/en/expenses.json` | تعديل — مفاتيح ترجمة |

---

## G) القيود المُلتزم بها
- لا تغيير في حسابات الأرصدة — فقط عرض وتنقل
- لا API calls جديدة — الحساب من البيانات الموجودة
- RTL صحيح 100%
- الدخول للمجموعة بنقرة واحدة
- لا تداخل مع Bottom Nav
