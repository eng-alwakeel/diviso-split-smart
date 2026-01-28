

# خطة إضافة عرض حالة الاشتراك للمستخدم

## المشكلة
بعد اشتراك المستخدم بنجاح (كما يظهر في الصورة "تم الدفع بنجاح! تم إضافة 70 رصيد إلى حسابك"):
- لا يوجد مكان واضح يعرض للمستخدم أنه مشترك
- لا يعرف المستخدم نوع الخطة التي اشترك بها
- لا يعرف كم باقي على انتهاء الاشتراك
- لا يعرف كم باقي من رصيده أو متى ينتهي

## الحل المقترح

### 1. إضافة بطاقة الاشتراك للـ Dashboard الرئيسي

إضافة `SubscriptionStatusCard` للـ Dashboard الرئيسي (`src/pages/Dashboard.tsx`) بحيث يظهر للمستخدم:
- نوع الخطة (شخصي/عائلي)
- حالة الاشتراك (نشط/تجربة)
- الأيام المتبقية على الاشتراك
- تاريخ انتهاء الاشتراك

### 2. تحسين بطاقة الاشتراك

تحديث `SubscriptionStatusCard` لتعرض معلومات أوضح:
- تاريخ انتهاء الاشتراك (expires_at)
- عداد الأيام المتبقية
- نوع الدورة (شهري/سنوي)

### 3. إضافة تاب الاشتراك في الإعدادات

إضافة تاب "الاشتراك" في صفحة الإعدادات (`Settings.tsx`) يعرض:
- تفاصيل الاشتراك الكاملة
- تاريخ البدء والانتهاء
- إمكانية إدارة الاشتراك

---

## التعديلات المطلوبة

### الملفات التي سيتم تعديلها:

| الملف | التعديل |
|-------|---------|
| `src/pages/Dashboard.tsx` | إضافة `SubscriptionStatusCard` |
| `src/components/dashboard/SubscriptionStatusCard.tsx` | إضافة عرض تاريخ الانتهاء والمدة المتبقية |
| `src/pages/Settings.tsx` | إضافة تاب الاشتراك |

---

## التفاصيل التقنية

### تعديل Dashboard.tsx

```tsx
// إضافة import
import { SubscriptionStatusCard } from "@/components/dashboard/SubscriptionStatusCard";

// إضافة الكارد بعد OnboardingProgress
<SubscriptionStatusCard />
```

### تحسين SubscriptionStatusCard

إضافة عرض:
- تاريخ انتهاء الاشتراك (`expires_at`)
- الأيام المتبقية بشكل واضح حتى لو الخطة active
- نوع الدورة (شهري/سنوي)
- شريط تقدم يوضح كم استهلك من مدة الاشتراك

### تعديل Settings.tsx

إضافة تاب جديد للاشتراك:
```tsx
<TabsTrigger value="subscription" className="flex items-center gap-2">
  <CreditCard className="w-4 h-4" />
  <span className="hidden sm:inline">الاشتراك</span>
</TabsTrigger>

<TabsContent value="subscription">
  <SubscriptionTab ... />
</TabsContent>
```

---

## النتيجة المتوقعة

بعد التنفيذ، المستخدم سيرى:

1. **في الداشبورد**: بطاقة توضح نوع اشتراكه وكم باقي يوم
2. **في الإعدادات**: تاب مخصص للاشتراك بكل التفاصيل
3. **معلومات واضحة**: تاريخ الانتهاء، الأيام المتبقية، نوع الخطة

