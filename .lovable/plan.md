

# إعادة بناء نظام الخطط — Plan-to-Group Pipeline

## ملخص
تحويل الخطة من شاشة ساكنة إلى مسار واضح: تخطيط → تحويل → تنفيذ، مع ربط حقيقي بين الأنشطة والمصاريف.

## المرحلة 1: قاعدة البيانات

### Migration 1: إضافة أعمدة جديدة
```sql
-- ربط المجموعة بالخطة الأصلية
ALTER TABLE groups ADD COLUMN source_plan_id uuid REFERENCES plans(id);

-- ربط المصروف بالنشاط
ALTER TABLE expenses ADD COLUMN activity_id uuid REFERENCES plan_day_activities(id);
```

### Migration 2: تحديث `convert_plan_to_group`
الدالة الحالية تنشئ مجموعة فارغة (اسم + عملة + أعضاء فقط). يجب تحديثها لتنقل:
- `group_type` من `plan_type`
- `source_plan_id` للربط العكسي
- نسخ `plan_days` و `plan_day_activities` إلى المجموعة (يبقوا مرتبطين بالخطة، المجموعة تقرأهم عبر `source_plan_id`)
- تحديث حالة الخطة إلى `done` بدل `planning`

## المرحلة 2: صفحة الخطة (`PlanDetails.tsx`)

### 2.1 إزالة التحويل/الربط من القائمة (⋮)
نقل "تحويل إلى مجموعة" و"ربط بمجموعة" من `DropdownMenu` إلى الصفحة نفسها كـ CTA رئيسي.

القائمة (⋮) تبقى فقط لـ: تعديل الخطة، إلغاء الخطة، حذف الخطة.

### 2.2 Smart CTA Bar (جديد — يوضع تحت كارد المعلومات)
كارد بارز يتغير حسب الحالة:

| الحالة | النص المساعد | الزر الرئيسي | زر ثانوي |
|---|---|---|---|
| `draft` | "هذه الخطة شخصية حالياً" | "ابدأ التخطيط" | — |
| `planning` | "أكمل إضافة الأنشطة والتفاصيل" | "أكمل التخطيط" (→ tab الجدول) | — |
| `locked` (جاهزة) | "خطتك جاهزة للتنفيذ مع الآخرين" | "حوّل إلى مجموعة" | "ربط بمجموعة موجودة" |
| linked (`group_id` موجود) | "هذه الخطة مرتبطة بمجموعة" | "فتح المجموعة" | — |
| `done` | "تم تنفيذ هذه الخطة" | "عرض المجموعة" | — |
| `canceled` | "تم إلغاء هذه الخطة" | — | — |

**تحديد "جاهزة للتحويل"**: اسم + نوع + (تاريخ أو نشاط واحد). إذا الشروط ناقصة → يظهر نص تحذيري خفيف "يفضل إضافة نشاط واحد على الأقل".

### 2.3 Smart Prompts (داخل الصفحة)
نصوص صغيرة سياقية:
- لا أنشطة → "أضف أنشطة ليصبح الجدول جاهزاً"
- أنشطة بدون تاريخ → "حدد المدة الزمنية للخطة"
- كل شيء مكتمل → "الخطة جاهزة للتحويل إلى مجموعة"

### 2.4 تحسين PlanStatusBar
إضافة نص الحالة بوضوح (ليس فقط أيقونات). عرض اسم الحالة الحالية كـ Badge نصي.

### 2.5 ترتيب الصفحة الجديد
1. Header (اسم + ⋮ للإجراءات الإدارية فقط)
2. كارد المعلومات (نوع، وجهة، تواريخ، ميزانية) + StatusBar
3. **Smart CTA Bar** ← جديد
4. Tabs (ملخص | الجدول | اقتراحات | التصويت | المصاريف)

## المرحلة 3: Post-Conversion Flow

### 3.1 Success Sheet بعد التحويل
بدل الانتقال المباشر للمجموعة، يظهر Bottom Sheet:
- عنوان: "تم إنشاء المجموعة من الخطة بنجاح 🎉"
- خيارات: "دعوة أعضاء" | "إضافة أول مصروف" | "فتح المجموعة"

### 3.2 تحديث `usePlanDetails.ts`
- `convertToGroup` لا ينتقل مباشرة للمجموعة بل يعيد `groupId` ويفتح الـ Success Sheet
- إضافة `onSuccess` callback بدل `navigate`

## المرحلة 4: صفحة المجموعة — قسم الجدول

### 4.1 عرض الجدول في المجموعة
إذا `group.source_plan_id` موجود:
- إضافة قسم "الجدول" في صفحة المجموعة (أو Sheet)
- يقرأ `plan_days` + `plan_day_activities` من الخطة المرتبطة
- كل نشاط يعرض: عنوان، وقت، وصف، تكلفة تقديرية
- زر "إضافة مصروف" على كل نشاط → يفتح نموذج المصروف مع `activity_id` معبأ

### 4.2 Budget Indicator
إذا الخطة المرتبطة لها `budget_value`:
- عرض شريط: الميزانية الكلية | المصروف الفعلي | المتبقي | نسبة الاستهلاك
- تنبيه عند التجاوز

### 4.3 ربط المصروف بالنشاط
- في نموذج إضافة المصروف: حقل اختياري لاختيار النشاط
- في تفاصيل النشاط: عرض إجمالي المصاريف المرتبطة
- في قائمة المصاريف: عرض اسم النشاط المرتبط (إن وجد)

### 4.4 رابط الخطة الأصلية
- في أعلى المجموعة (إذا `source_plan_id`): نص خفيف "مبنية على خطة: {plan_name}" + زر "عرض الخطة"

## المرحلة 5: الترجمات

إضافة مفاتيح جديدة في `ar/plans.json` و `en/plans.json`:
```json
"smart_cta": {
  "personal_plan": "هذه الخطة شخصية حالياً",
  "start_planning": "ابدأ بإضافة الأنشطة والتفاصيل",
  "ready_to_convert": "خطتك جاهزة للتنفيذ مع الآخرين",
  "linked_to_group": "هذه الخطة مرتبطة بمجموعة",
  "plan_completed": "تم تنفيذ هذه الخطة",
  "plan_canceled": "تم إلغاء هذه الخطة",
  "convert_to_group": "حوّل إلى مجموعة",
  "link_existing": "ربط بمجموعة موجودة",
  "open_group": "فتح المجموعة",
  "view_group": "عرض المجموعة",
  "missing_hint": "يفضل إضافة {{missing}} قبل التحويل"
},
"post_convert": {
  "success_title": "تم إنشاء المجموعة بنجاح 🎉",
  "whats_next": "وش الخطوة الجاية؟",
  "invite_members": "دعوة أعضاء",
  "add_first_expense": "إضافة أول مصروف",
  "open_group": "فتح المجموعة"
},
"prompts": {
  "add_activities": "أضف أنشطة ليصبح الجدول جاهزاً",
  "add_dates": "حدد المدة الزمنية للخطة",
  "ready_to_convert": "الخطة جاهزة للتحويل إلى مجموعة"
}
```

## الملفات المتأثرة

| الملف | التغيير |
|---|---|
| Migration SQL | إضافة `source_plan_id` للمجموعات، `activity_id` للمصاريف، تحديث `convert_plan_to_group` |
| `src/pages/PlanDetails.tsx` | إضافة Smart CTA Bar، نقل convert/link من القائمة، Success Sheet، smart prompts |
| `src/components/plans/PlanStatusBar.tsx` | إضافة نص الحالة الواضح |
| `src/components/plans/PostConvertSheet.tsx` | **جديد** — Bottom Sheet بعد التحويل |
| `src/components/plans/SmartCtaBar.tsx` | **جديد** — الشريط الذكي حسب الحالة |
| `src/hooks/usePlanDetails.ts` | تعديل `convertToGroup` ليعيد groupId بدل navigate |
| `src/pages/GroupDetails.tsx` | إضافة قسم الجدول + Budget Indicator + رابط الخطة |
| `src/i18n/locales/ar/plans.json` | مفاتيح ترجمة جديدة |
| `src/i18n/locales/en/plans.json` | مفاتيح ترجمة جديدة |

## ترتيب التنفيذ
1. Migration (DB schema + تحديث RPC)
2. Smart CTA Bar + تحديث PlanDetails
3. Post-Convert Flow (Success Sheet)
4. قسم الجدول في المجموعة + ربط المصاريف بالأنشطة
5. الترجمات + Empty States

