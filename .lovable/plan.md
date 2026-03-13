

# تحديث مهام الـ Onboarding — 8 مهام جديدة بترتيب محدد

## المهام الجديدة (بالترتيب)

| # | المهمة | id | عمود DB | المسار |
|---|--------|----|---------|--------|
| 1 | تنزيل التطبيق | `install_app` | `app_installed` | `/install` |
| 2 | أكمل ملفك الشخصي | `profile` | `profile_completed` | `/settings` |
| 3 | أنشئ مجموعة جديدة | `group` | `first_group_created` | `/create-group` |
| 4 | أضف أعضاء للمجموعة | `invite` | `first_invite_sent` | `/my-groups` |
| 5 | أضف مصروف | `expense` | `first_expense_added` | `/add-expense` |
| 6 | أغلق مجموعة | `close_group` | `first_group_closed` | `/my-groups` |
| 7 | استخدم النرد | `dice` | `first_dice_used` | `/dashboard` |
| 8 | أنشئ خطة | `plan` | `first_plan_created` | `/create-plan` |

## التغييرات

### 1. Database Migration
- إضافة 3 أعمدة جديدة لجدول `onboarding_tasks`:
  - `app_installed BOOLEAN DEFAULT false`
  - `first_group_closed BOOLEAN DEFAULT false`
  - `first_dice_used BOOLEAN DEFAULT false`
  - `first_plan_created BOOLEAN DEFAULT false`
- حذف عمود `first_referral_made` (استُبدل)
- تعديل دالة `complete_onboarding_task` لدعم المهام الجديدة (`install_app`, `close_group`, `dice`, `plan`)

### 2. `src/hooks/useOnboarding.ts`
- تحديث `OnboardingData` interface بالحقول الجديدة
- تحديث `ONBOARDING_TASKS_CONFIG` بالـ 8 مهام بالترتيب الجديد
- تحديث `getTaskStatus` و `fetchOnboardingData`

### 3. `src/components/dashboard/OnboardingProgress.tsx`
- إضافة أيقونات جديدة للـ `iconMap`: `Download`, `Lock`, `Dice5`, `Map`

### 4. الترجمة (`ar/dashboard.json` + `en/dashboard.json`)
- إضافة مفاتيح الترجمة للمهام الجديدة (`install_app`, `close_group`, `dice`, `plan`)

### 5. استدعاء `complete_onboarding_task` للمهام الجديدة
- عند تثبيت التطبيق (PWA): استدعاء `install_app` في `usePwaInstall` عند event `appinstalled`
- عند إغلاق مجموعة: استدعاء `close_group` في الكود الذي يغلق المجموعة
- عند استخدام النرد: استدعاء `dice` عند رمي النرد
- عند إنشاء خطة: استدعاء `plan` عند حفظ الخطة

### 6. تحديث `types.ts`
- تحديث الأنواع المولّدة لتشمل الأعمدة الجديدة

