

# تطبيق الإعداد (Onboarding) على جميع الحسابات القديمة

## المشكلة الحالية
الإعداد يظهر فقط للمستخدمين الجدد خلال أول 7 أيام من التسجيل. الحسابات القديمة التي لم تكمل الإعداد لا يتم توجيهها لمسار الإعداد.

## التغييرات المطلوبة

### 1. إزالة شرط نافذة الـ 7 أيام من Dashboard.tsx
حالياً الشرط يتطلب `isWithinOnboardingWindow` (أقل من 7 أيام من التسجيل). سيتم إزالة هذا الشرط بحيث أي مستخدم لم يكمل أي مهمة إعداد ولم يستلم المكافأة يتم توجيهه للإعداد.

**الشرط الجديد:**
- عدد المجموعات = 0، أو
- عدد المهام المكتملة = 0 ولم يستلم المكافأة (بغض النظر عن تاريخ التسجيل)

### 2. تحديث useDashboardMode.ts
إزالة شرط `isWithinOnboardingWindow` من تحديد وضع `onboarding` بحيث أي مستخدم لم يكمل المهام يظهر له وضع الإعداد.

### 3. لا تغيير على Onboarding.tsx
المنطق الحالي (تخطي فقط إذا كان المستخدم مالك مجموعة) يبقى كما هو.

## التفاصيل التقنية

**`src/pages/Dashboard.tsx`** - إزالة `dashboardMode.isWithinOnboardingWindow` من شرط التوجيه:
```text
// قبل:
groupsCount === 0 || (completedCount === 0 && !rewardClaimed && isWithinOnboardingWindow)

// بعد:
groupsCount === 0 || (completedCount === 0 && !rewardClaimed)
```

**`src/hooks/useDashboardMode.ts`** - إزالة شرط النافذة الزمنية من تحديد وضع onboarding:
```text
// قبل:
if (completedCount < totalTasks && isWithinOnboardingWindow && !rewardClaimed) {
  mode = 'onboarding';
}

// بعد:
if (completedCount < totalTasks && !rewardClaimed) {
  mode = 'onboarding';
}
```

## الملفات المتأثرة
- `src/pages/Dashboard.tsx` - تعديل سطر واحد
- `src/hooks/useDashboardMode.ts` - تعديل سطر واحد
