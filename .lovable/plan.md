

# إعادة تصميم الصفحة الرئيسية (Dashboard) لتتوافق مع صفحة المجموعات

## الهدف
تحويل Dashboard من صفحة مزدحمة بعناصر متعددة (نرد، مكافآت، focus cards، إنجازات) إلى صفحة نظيفة ومنظمة تتبع نفس هيكل صفحة المجموعات: **ملخص → إجراءات → محتوى اختياري**.

## التغييرات

### 1. `src/pages/Dashboard.tsx` — إعادة هيكلة كاملة للمحتوى

**إزالة العناصر التالية:**
- `DailyFocusCard`
- `StreakDisplay`
- `DailyDiceCard`
- `HomePlanCard`
- `BalanceStatusCard` (الكرت الكبير)
- `DailyRewardCardCompact`
- `CreditBalanceCard`
- `ShareableAchievementCard`
- `MonthlyWrapCard`
- `SmartPromotionBanner`
- `OnboardingProgress`
- `RecommendationNotification`
- `FloatingSupportButton`
- `InstallWidget`
- `AppGuide` + help button

**الهيكل الجديد (بالترتيب):**

```
العنوان: "مرحباً!" + وصف + شارة المؤسس

═══ القسم 1: ملخص (مطابق لصفحة المجموعات) ═══
Card واحد يحتوي grid 3 أعمدة:
  - المجموعات النشطة → clickable → /my-groups
  - المصاريف هذا الشهر → clickable → /my-expenses  
  - الرصيد الصافي → clickable → /my-expenses
  (نفس تصميم stats card في MyGroups)

═══ القسم 2: إجراءات ═══
زرين متساويين بجانب بعض:
  - إضافة مصروف (primary)
  - إنشاء مجموعة (outline)
  (نفس MinimalQuickActions الحالي)

═══ القسم 3: مؤشر الحالة (صغير) ═══
شريط صغير (ليس كرت كامل):
  - ✅ متوازن / ❌ غير متوازن
  - نص فرعي مختصر
  - زر "عرض التفاصيل" → /my-expenses

═══ القسم 4: نشاط حديث (اختياري) ═══
  - RecentGroupActivityCard (كما هو — خفيف ومتسق)
```

**إبقاء الـ dialogs الضرورية:**
- `LocationPermissionDialog`
- `NotificationPermissionDialog`
- `RecommendationDialog` + `SelectGroupDialog`
- `AchievementPopup`

**إبقاء logic الموجود:**
- `useOptimizedDashboardData`
- `useDashboardMode` (للتحقق من onboarding redirect فقط)
- `useAdminAuth`
- `useFoundingUser`
- Real-time listeners

### 2. مؤشر الحالة الجديد — inline في