
# خطة إصلاح نظام عرض الاشتراكات

## المشكلة
النظام يستخدم أسماء خطط قديمة (`personal`, `family`, `lifetime`) بينما الخطط الفعلية هي (`starter`, `pro`, `max`). هذا يسبب:
1. عرض "الباقة الشخصية" بدل "Starter"
2. عدم تطابق بين ما اشترك به المستخدم وما يُعرض له

## نظام الاشتراكات الحالي

| الخطة | الدورة | السعر | الرصيد/شهر |
|-------|--------|-------|------------|
| Starter | شهري | 19 ر.س | 70 |
| Pro | شهري | 29 ر.س | 90 |
| Max | شهري | 39 ر.س | 260 |
| Starter | سنوي | 189 ر.س | 90 |
| Pro | سنوي | 239 ر.س | 160 |
| Max | سنوي | 299 ر.س | 260 |

---

## التعديلات المطلوبة

### 1. تحديث PaymentCallback.tsx
**المشكلة:** يحفظ اسم الخطة بالشكل القديم (personal/family)
**الحل:** حفظ اسم الخطة الفعلي من `subscription_plans.name`

```tsx
// السطور 215-219 - قبل
const rawPlanName = purchase.subscription_plans?.name?.toLowerCase() || 'personal';
const planName: 'personal' | 'family' | 'lifetime' = 
  rawPlanName === 'family' || rawPlanName === 'max' ? 'family' : 
  rawPlanName === 'lifetime' ? 'lifetime' : 'personal';

// بعد - حفظ الاسم الفعلي
const planName = purchase.subscription_plans?.name || 'starter_monthly';
```

### 2. تحديث useSubscription.ts
تحديث نوع `SubscriptionPlan` ليشمل الخطط الجديدة:

```tsx
// قبل
export type SubscriptionPlan = "personal" | "family" | "lifetime";

// بعد
export type SubscriptionPlan = 
  | "starter_monthly" | "starter_yearly" 
  | "pro_monthly" | "pro_yearly" 
  | "max_monthly" | "max_yearly"
  | "personal" | "family" | "lifetime"; // للتوافق مع البيانات القديمة
```

### 3. تحديث usePlanBadge.ts
إضافة دعم للخطط الجديدة:

```tsx
// قبل
export type PlanType = "free" | "personal" | "family" | "lifetime";

// بعد
export type PlanType = "free" | "starter" | "pro" | "max" 
                     | "personal" | "family" | "lifetime"; // للتوافق

// تحديث configs
const configs: Record<string, PlanBadgeConfig> = {
  free: { badge: "🆓", label: "مجاني", ... },
  starter: { badge: "⚡", label: "Starter", ... },
  pro: { badge: "💎", label: "Pro", ... },
  max: { badge: "👑", label: "Max", ... },
  // للتوافق مع البيانات القديمة
  personal: { badge: "⚡", label: "Starter", ... },
  family: { badge: "💎", label: "Pro", ... },
  lifetime: { badge: "👑", label: "Max", ... },
};

// دالة لاستخراج الخطة الأساسية
const getPlanBase = (plan: string): string => {
  return plan.replace('_monthly', '').replace('_yearly', '');
};
```

### 4. تحديث SubscriptionStatusCard.tsx
تحديث `getPlanLabel()`:

```tsx
const getPlanLabel = () => {
  if (!subscription) return t('subscription.free_plan');
  
  // استخراج اسم الخطة الأساسي
  const planBase = subscription.plan
    .replace('_monthly', '')
    .replace('_yearly', '')
    .toLowerCase();
  
  // التوافق مع الخطط القديمة
  const planMap: Record<string, string> = {
    'starter': 'Starter',
    'pro': 'Pro',
    'max': 'Max',
    'personal': 'Starter', // توافق
    'family': 'Pro',       // توافق
    'lifetime': 'Max',     // توافق
  };
  
  return planMap[planBase] || subscription.plan;
};

// إضافة عرض نوع الدورة
const getBillingCycle = () => {
  if (!subscription) return null;
  const isYearly = subscription.plan.includes('_yearly') || 
                   subscription.billing_cycle === 'yearly';
  return isYearly ? t('subscription.yearly') : t('subscription.monthly');
};
```

### 5. تحديث SubscriptionSettingsTab.tsx
نفس تعديلات `getPlanLabel()` + عرض دورة الفوترة.

### 6. إزالة SubscriptionStatusCard من Dashboard
حسب طلبك، الداشبورد لا يتحمل كارت الاشتراك:

```tsx
// حذف هذا السطر من Dashboard.tsx
<SubscriptionStatusCard />
```

### 7. إضافة الترجمات
تحديث `dashboard.json` العربي:

```json
"subscription": {
  ...
  "starter_plan": "Starter",
  "pro_plan": "Pro",
  "max_plan": "Max",
  "monthly": "شهري",
  "yearly": "سنوي",
  "billing_cycle": "دورة الفوترة",
  ...
}
```

---

## الملفات المتأثرة

| الملف | التعديل |
|-------|---------|
| `src/pages/PaymentCallback.tsx` | حفظ اسم الخطة الفعلي |
| `src/hooks/useSubscription.ts` | تحديث نوع SubscriptionPlan |
| `src/hooks/usePlanBadge.ts` | إضافة Starter/Pro/Max + التوافق |
| `src/components/dashboard/SubscriptionStatusCard.tsx` | تحديث getPlanLabel + getBillingCycle |
| `src/components/settings/SubscriptionSettingsTab.tsx` | نفس التحديثات |
| `src/pages/Dashboard.tsx` | إزالة SubscriptionStatusCard |
| `src/i18n/locales/ar/dashboard.json` | إضافة ترجمات الخطط الجديدة |
| `src/i18n/locales/en/dashboard.json` | إضافة ترجمات الخطط الجديدة |

---

## ملاحظة: البيانات الحالية

المستخدم الحالي في قاعدة البيانات لديه `plan: personal` لأنه اشترك قبل الإصلاح.
الكود الجديد سيتعامل مع هذا بالتوافقية (personal → Starter).

لتحديث البيانات الحالية (اختياري):
```sql
UPDATE user_subscriptions 
SET plan = 'starter_monthly' 
WHERE plan = 'personal' AND billing_cycle = 'monthly';

UPDATE user_subscriptions 
SET plan = 'pro_monthly' 
WHERE plan = 'family' AND billing_cycle = 'monthly';
```

---

## النتيجة المتوقعة

بعد التنفيذ:
1. المستخدم يرى "Starter" بدل "الباقة الشخصية"
2. يظهر نوع الدورة (شهري/سنوي)
3. البادج الصحيح مع الأيقونة المناسبة
4. الاشتراكات الجديدة تُحفظ بالاسم الصحيح (starter_monthly, pro_yearly, etc.)
5. كارت الاشتراك يظهر فقط في صفحة الإعدادات وليس الداشبورد
