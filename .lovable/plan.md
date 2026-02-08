

# اصلاح رابط "انشاء خطة" في كرت التخطيط

## المشكلة

كرت `HomePlanCard` يرسل المستخدم الى `/plans/create` لكن المسار المسجّل في `App.tsx` هو `/create-plan`. لهذا السبب تظهر صفحة 404.

نفس المشكلة موجودة في `SmartPlanCard.tsx` ايضا.

---

## الحل

تعديل بسيط -- سطر واحد في كل ملف:

### 1. `src/components/dashboard/HomePlanCard.tsx` (سطر 91)

```
// قبل
navigate('/plans/create')

// بعد
navigate('/create-plan')
```

### 2. `src/components/dashboard/SmartPlanCard.tsx` (سطر 70)

```
// قبل
navigate('/plans/create')

// بعد
navigate('/create-plan')
```

---

## ملخص

| الملف | التعديل |
|-------|--------|
| `HomePlanCard.tsx` | تصحيح المسار من `/plans/create` الى `/create-plan` |
| `SmartPlanCard.tsx` | تصحيح المسار من `/plans/create` الى `/create-plan` |

لا حاجة لتعديل اي ملف آخر -- المسار `/create-plan` مسجل بالفعل في `App.tsx` ويعمل بشكل صحيح من صفحة Plans.
