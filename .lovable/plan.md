
# خطة إصلاح مشكلة فشل الدفع للاشتراكات

## تشخيص المشكلة

من تحليل سجلات الأخطاء والصور المرفقة:

| البيان | القيمة |
|--------|--------|
| المستخدم | `096e33cc-68ab-4abb-9561-90a709a1f408` |
| عمليات الدفع | مرتين بـ 19 ر.س (09:08 و 09:09) |
| حالة subscription_purchases | `completed` |
| حالة user_subscriptions | **فارغ** - لا يوجد اشتراك! |
| سبب الفشل | أخطاء في قاعدة البيانات |

## الأخطاء المكتشفة

```
ERROR: column "payment_reference" does not exist
ERROR: invalid input value for enum subscription_plan: "starter_monthly"
```

## السبب الجذري

### 1. عدم توافق RPC مع هيكل الجدول الفعلي

دالة `complete_subscription_purchase` تستخدم أعمدة غير موجودة:

| RPC تستخدم | الموجود فعلياً |
|------------|----------------|
| `payment_reference` | `payment_id` |
| `plan_id` (uuid) | `plan` (enum) |
| `current_period_start` | `started_at` |
| `current_period_end` | `expires_at` |
| `credits_remaining` | غير موجود |

### 2. Enum غير محدث

```sql
-- القيم المسموحة حالياً:
personal, family, lifetime

-- القيم المطلوبة:
starter_monthly, starter_yearly, pro_monthly, pro_yearly, max_monthly, max_yearly
```

### 3. Fallback يفشل أيضاً

`handleSubscriptionPaymentManual` في `PaymentCallback.tsx` يحاول إدخال `starter_monthly` في enum قديم.

---

## الحل المطلوب

### الخطوة 1: تحديث Enum ليقبل الخطط الجديدة

```sql
-- إضافة القيم الجديدة للـ enum
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'starter_monthly';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'starter_yearly';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'pro_monthly';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'pro_yearly';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'max_monthly';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'max_yearly';
```

### الخطوة 2: تحديث دالة RPC

إعادة كتابة `complete_subscription_purchase` لتستخدم الأعمدة الصحيحة:

```sql
CREATE OR REPLACE FUNCTION complete_subscription_purchase(...)
-- استخدام:
-- payment_id بدل payment_reference
-- plan (enum) بدل plan_id
-- started_at بدل current_period_start
-- expires_at بدل current_period_end
```

### الخطوة 3: إصلاح PaymentCallback.tsx

تحديث `handleSubscriptionPaymentManual` لاستخدام أسماء الخطط الصحيحة.

### الخطوة 4: تفعيل اشتراك المستخدم المتضرر

```sql
-- إنشاء اشتراك للمستخدم الذي دفع
INSERT INTO user_subscriptions (
  user_id, plan, status, started_at, expires_at
) VALUES (
  '096e33cc-68ab-4abb-9561-90a709a1f408',
  'personal', -- استخدام القيمة القديمة مؤقتاً
  'active',
  NOW(),
  NOW() + INTERVAL '1 month'
);

-- منح الرصيد
UPDATE profiles 
SET credits_balance = COALESCE(credits_balance, 0) + 70
WHERE id = '096e33cc-68ab-4abb-9561-90a709a1f408';
```

---

## الملفات التي سيتم تعديلها

| الملف | التعديل |
|-------|---------|
| Database Migration | تحديث enum + تحديث RPC |
| `src/pages/PaymentCallback.tsx` | إصلاح منطق تحويل أسماء الخطط |

---

## النتيجة المتوقعة

1. تفعيل اشتراك المستخدم المتضرر فوراً
2. أي عمليات دفع مستقبلية ستعمل بشكل صحيح
3. الخطط الجديدة (`starter_monthly`, etc.) ستكون مدعومة
