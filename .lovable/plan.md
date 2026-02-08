
# نظام الاستخدام اليومي (Daily Engagement System) -- Diviso

## ملخص

تحويل Diviso من أداة "وقت الحاجة" إلى رفيق يومي من خلال 6 أنظمة متكاملة: Daily Hub ذكي، Activity Feed للمجموعات، Streak Tracker حقيقي، نرد اليوم، إشعار يومي ذكي، ومنطق backend مع Cron Job.

---

## الوضع الحالي (ما هو موجود)

| المكون | الحالة |
|--------|--------|
| Streak System | موجود (`user_streaks` + `daily_checkins` + `useDailyCheckin`) لكنه يعتمد على check-in يدوي |
| Dashboard | موجود (`Dashboard.tsx`) بمكونات كثيرة (stats, onboarding, dice, checkin, achievements) |
| Dice Decision | موجود بالكامل مع smart suggestions |
| Notifications | موجود (`notifications` table + `useNotifications` hook + push notifications مذكورة في الذاكرة) |
| Activity Tracking | موجود جزئياً (`useActivityTracker` يحدث `last_active_at` فقط) |
| profiles.last_active_at | موجود |
| Onboarding | موجود (5 tasks مع progress card) |

---

## التقسيم لدفعات (بسبب حجم المشروع)

### الدفعة 1 (هذه): Daily Hub + Activity Feed + Streak Tracker الحقيقي
### الدفعة 2 (لاحقاً): نرد اليوم الذكي + إشعار يومي + Cron Job كامل

---

## 1. قاعدة البيانات (Migration)

### A) جدول `daily_hub_cache`

يخزن بيانات Daily Hub المحسوبة لكل مستخدم (يتحدث كل 24 ساعة عبر Cron أو عند أول زيارة):

| العمود | النوع | الوصف |
|--------|------|-------|
| user_id | uuid PK FK profiles | المستخدم |
| user_state | text NOT NULL default 'new' | الحالة: active/low_activity/new |
| streak_count | int default 0 | عدد أيام النشاط المتتالية |
| last_action_at | timestamptz NULL | آخر عمل حقيقي |
| days_since_last_action | int default 0 | أيام منذ آخر عمل |
| last_group_event | jsonb NULL | آخر حدث مؤثر في المجموعة |
| suggested_dice_type | text NULL | نوع النرد المقترح |
| motivational_message | text NULL | رسالة تحفيزية |
| computed_at | timestamptz default now() | وقت الحساب |

### B) جدول `group_activity_feed`

يخزن أحداث المجموعة (عرض فقط -- آخر 20 حدث):

| العمود | النوع | الوصف |
|--------|------|-------|
| id | uuid PK default gen_random_uuid() | معرف فريد |
| group_id | uuid NOT NULL FK groups(id) ON DELETE CASCADE | المجموعة |
| event_type | text NOT NULL | النوع: expense_added/settlement_made/member_joined/split_completed |
| actor_user_id | uuid NOT NULL | من قام بالعمل |
| event_data | jsonb default '{}' | بيانات الحدث (amount, description, member_name, ...) |
| smart_message_ar | text NULL | رسالة ذكية بالعربي |
| smart_message_en | text NULL | رسالة ذكية بالإنجليزي |
| created_at | timestamptz default now() | وقت الحدث |

Index: group_activity_feed_group_idx (group_id, created_at DESC)

### C) جدول `user_action_log`

يسجل الأعمال الحقيقية للمستخدم (للـ Streak الحقيقي):

| العمود | النوع | الوصف |
|--------|------|-------|
| id | uuid PK default gen_random_uuid() | معرف فريد |
| user_id | uuid NOT NULL FK profiles | المستخدم |
| action_type | text NOT NULL | النوع: expense_added/settlement_made/dice_shared |
| action_date | date NOT NULL default CURRENT_DATE | تاريخ العمل |
| metadata | jsonb default '{}' | بيانات إضافية |
| created_at | timestamptz default now() | وقت التسجيل |

UNIQUE: (user_id, action_type, action_date) -- منع التكرار لنفس النوع في نفس اليوم
Index: user_action_log_user_date_idx (user_id, action_date)

### D) RPC: `compute_daily_hub`

دالة تحسب وتخزن بيانات Daily Hub لمستخدم واحد:

```text
create or replace function public.compute_daily_hub(p_user_id uuid)
returns jsonb
```

المنطق:
1. فحص آخر عمل حقيقي من `user_action_log`
2. حساب `days_since_last_action`
3. تحديد `user_state`:
   - active: عمل خلال آخر 3 أيام
   - low_activity: عمل خلال 4-14 يوم
   - new: لا يوجد أي عمل (أو أكثر من 14 يوم بدون مجموعات)
4. حساب streak حقيقي (أيام متتالية بعمل واحد على الأقل)
5. جلب آخر حدث مؤثر من `group_activity_feed`
6. تحديد نوع النرد المقترح حسب الوقت ونوع المجموعة
7. اختيار رسالة تحفيزية حسب الحالة
8. Upsert في `daily_hub_cache`
9. إرجاع البيانات كـ JSON

### E) RPC: `log_user_action`

دالة تسجل عمل المستخدم وتحدث Streak:

```text
create or replace function public.log_user_action(
  p_user_id uuid,
  p_action_type text,
  p_metadata jsonb default '{}'
)
returns void
```

المنطق:
1. INSERT INTO user_action_log ON CONFLICT DO NOTHING
2. تحديث user_streaks بناءً على الأيام المتتالية الحقيقية
3. تحديث daily_hub_cache.last_action_at

### F) Trigger: تسجيل أحداث المجموعة تلقائياً

Triggers على `expenses` و `settlements` و `group_members`:
- عند INSERT expense: إضافة حدث `expense_added` في `group_activity_feed`
- عند INSERT settlement (confirmed): إضافة حدث `settlement_made`
- عند INSERT group_member: إضافة حدث `member_joined`
- كل حدث يتضمن رسالة ذكية مولدة بالـ SQL

### G) Trigger: تسجيل أعمال المستخدم تلقائياً

Triggers على `expenses` و `settlements`:
- عند INSERT expense: استدعاء `log_user_action('expense_added')`
- عند INSERT settlement: استدعاء `log_user_action('settlement_made')`

### H) RLS Policies

- **daily_hub_cache**: SELECT فقط لصاحب السجل
- **group_activity_feed**: SELECT إذا المستخدم عضو في المجموعة
- **user_action_log**: SELECT فقط لصاحب السجل; INSERT تلقائي عبر triggers

---

## 2. ملفات جديدة

### `src/hooks/useDailyHub.ts`

Hook رئيسي لصفحة Daily Hub:

```text
- hubData: بيانات الـ cache (user_state, streak, last_group_event, suggested_dice, message)
- isLoading
- computeHub(): استدعاء RPC إذا البيانات قديمة (> 12 ساعة)
- userState: 'active' | 'low_activity' | 'new'
```

المنطق:
1. جلب `daily_hub_cache` للمستخدم
2. إذا لا يوجد أو `computed_at` أقدم من 12 ساعة: استدعاء `compute_daily_hub` RPC
3. إرجاع البيانات

### `src/hooks/useActivityFeed.ts`

Hook لجلب Activity Feed لمجموعة:

```text
- events: قائمة الأحداث (آخر 20)
- isLoading
```

### `src/hooks/useRealStreak.ts`

Hook للـ Streak الحقيقي (يكمّل `useDailyCheckin` الموجود):

```text
- realStreak: عدد الأيام المتتالية بأعمال حقيقية
- logAction(actionType): تسجيل عمل يدوياً (لنرد اليوم)
```

### `src/pages/DailyHub.tsx`

الصفحة الرئيسية الذكية -- تستبدل `/dashboard` كصفحة أولى بعد تسجيل الدخول:

```text
الحالة A (مستخدم نشط):
+------------------------------------------+
|  🔥 5 أيام متتالية                       |
+------------------------------------------+
|  [بطاقة نشاط المجموعة]                   |
|  "أحمد أضاف مصروف 200 ر.س في السفر"      |
+------------------------------------------+
|  [🎲 نرد اليوم] نرد أكل مقترح            |
|  [ارمِ النرد]                            |
+------------------------------------------+
|  💬 "أنت ناشط هالأسبوع، استمر!"          |
+------------------------------------------+

الحالة B (مستخدم قليل النشاط):
+------------------------------------------+
|  ⏰ آخر قسمة كانت قبل 5 أيام             |
+------------------------------------------+
|  [نفّذ خطوة بسيطة اليوم]                 |
|  → يوجه لإضافة مصروف أو رمي نرد          |
+------------------------------------------+

الحالة C (مستخدم جديد):
+------------------------------------------+
|  👋 مرحباً!                              |
+------------------------------------------+
|  [🎲 جرّب نرد اليوم]                     |
|  أو [قسمة تجريبية]                       |
+------------------------------------------+
```

**مهم**: صفحة DailyHub تكون خفيفة (لا عمليات ثقيلة) -- تقرأ من cache فقط.

### `src/components/daily-hub/ActiveUserState.tsx`

مكون الحالة A -- المستخدم النشط:
- عرض Streak كبير (رقم + أيقونة نار)
- بطاقة آخر حدث مجموعة
- نرد اليوم المقترح
- رسالة تحفيزية

### `src/components/daily-hub/LowActivityState.tsx`

مكون الحالة B -- المستخدم قليل النشاط:
- رسالة واحدة واضحة مع عدد الأيام
- زر CTA واحد فقط

### `src/components/daily-hub/NewUserState.tsx`

مكون الحالة C -- المستخدم الجديد:
- Quick Win مباشر
- زر "جرّب نرد اليوم"
- رابط لقسمة تجريبية (launch page)

### `src/components/daily-hub/StreakDisplay.tsx`

عرض Streak بسيط:
- رقم واحد كبير مع أيقونة 🔥
- بدون تشتيت بصري

### `src/components/daily-hub/GroupEventCard.tsx`

بطاقة آخر حدث في المجموعة:
- الرسالة الذكية
- اسم المجموعة
- زمن الحدث

### `src/components/daily-hub/DailyDiceCard.tsx`

بطاقة نرد اليوم المقترح:
- نوع النرد المقترح مع سبب
- زر "ارمِ النرد"
- يفتح DiceDecision dialog

### `src/components/group/GroupActivityFeed.tsx`

Activity Feed داخل صفحة المجموعة:
- عرض فقط (بدون تفاعل أو تعليقات)
- آخر 20 حدث
- أيقونة + رسالة ذكية + زمن نسبي

---

## 3. الملفات المعدلة

### `src/App.tsx`

- إضافة route `/daily-hub` محمي
- تغيير redirect بعد login من `/dashboard` إلى `/daily-hub`

### `src/components/BottomNav.tsx`

- تغيير الرابط الأول من `/dashboard` إلى `/daily-hub`
- أو إبقاء `/dashboard` وجعل DailyHub هو المحتوى الافتراضي

**القرار**: `/dashboard` يبقى كما هو مع إضافة DailyHub كقسم علوي في Dashboard بدلاً من صفحة منفصلة. هذا أسهل للمستخدم ولا يكسر navigation موجود.

### `src/pages/Dashboard.tsx`

تعديلات:
- إضافة `DailyHubSection` كأول مكون بعد Welcome (يحل محل stats grid كأول شيء يراه المستخدم)
- DailyHubSection يعرض الحالة المناسبة (A/B/C) حسب `daily_hub_cache`
- بقية المكونات (stats, checkin, achievements, quick actions) تبقى تحته

### `src/pages/GroupDetails.tsx`

- إضافة `GroupActivityFeed` كمكون جديد في صفحة تفاصيل المجموعة (بعد الملخص وقبل المصاريف)

### `src/hooks/useDailyCheckin.ts`

- تعديل `claimReward` ليستدعي `log_user_action('daily_checkin')` (اختياري -- Daily Checkin وحده لا يحسب streak حقيقي)

### `src/i18n/locales/ar/dashboard.json`

إضافة مفاتيح:

```text
"daily_hub": {
  "streak": "🔥 {{count}} يوم متتالي",
  "active_message": "أنت ناشط هالأسبوع، استمر!",
  "low_activity_title": "آخر قسمة كانت قبل {{days}} يوم",
  "low_activity_cta": "نفّذ خطوة بسيطة اليوم",
  "new_user_title": "مرحباً!",
  "new_user_dice": "🎲 جرّب نرد اليوم",
  "new_user_demo": "قسمة تجريبية",
  "daily_dice_title": "نرد اليوم",
  "daily_dice_cta": "ارمِ النرد",
  "group_event_title": "آخر نشاط",
  "motivational_messages": {
    "active_1": "أداؤك ممتاز هالأسبوع 💪",
    "active_2": "استمر، أنت من أنشط المستخدمين!",
    "active_3": "مصاريفك منظمة، أحسنت 👌",
    "low_1": "وش رأيك تضيف مصروف بسيط اليوم؟",
    "low_2": "مجموعتك تنتظرك 👀",
    "low_3": "خطوة صغيرة تفرق!"
  }
},
"activity_feed": {
  "title": "آخر الأحداث",
  "expense_added": "{{name}} أضاف مصروف {{amount}} {{currency}}",
  "settlement_made": "{{name}} سدّد {{amount}} {{currency}}",
  "member_joined": "{{name}} انضم للمجموعة",
  "split_completed": "تم إكمال القسمة",
  "smart_messages": {
    "almost_balanced": "باقي شخص واحد وتكتمل القسمة 👀",
    "closer_to_balance": "{{name}} قرّب المجموعة للتوازن 💚",
    "big_expense": "مصروف كبير! 🔥",
    "new_member_welcome": "أهلاً بالعضو الجديد! 🎉"
  },
  "time_ago": {
    "just_now": "الآن",
    "minutes": "قبل {{count}} دقيقة",
    "hours": "قبل {{count}} ساعة",
    "days": "قبل {{count}} يوم"
  }
}
```

### `src/i18n/locales/en/dashboard.json`

إضافة نفس المفاتيح بالإنجليزية.

---

## 4. التفاصيل التقنية

### منطق تحديد حالة المستخدم

```text
function determineUserState(lastActionAt, daysCount, groupsCount):
  if lastActionAt is null AND groupsCount == 0:
    return 'new'
  if days_since_last_action <= 3:
    return 'active'
  if days_since_last_action <= 14:
    return 'low_activity'
  if groupsCount == 0:
    return 'new'
  return 'low_activity'
```

### منطق Streak الحقيقي

```text
-- حساب أيام متتالية بأعمال حقيقية
WITH daily_actions AS (
  SELECT DISTINCT action_date
  FROM user_action_log
  WHERE user_id = p_user_id
  ORDER BY action_date DESC
),
streak AS (
  SELECT action_date,
    action_date - (ROW_NUMBER() OVER (ORDER BY action_date DESC))::int AS grp
  FROM daily_actions
)
SELECT COUNT(*) AS streak_length
FROM streak
WHERE grp = (SELECT grp FROM streak LIMIT 1)
```

الأعمال التي تحسب في Streak:
- إضافة مصروف
- سداد مبلغ
- استخدام نرد اليوم + مشاركة النتيجة داخل مجموعة

فتح التطبيق فقط لا يحسب.

### منطق الرسائل الذكية في Activity Feed

```text
عند إضافة مصروف:
  if amount > group_avg * 2:
    smart_message = "مصروف كبير! 🔥"
  else:
    smart_message = "{{name}} أضاف مصروف {{amount}} {{currency}}"

عند سداد:
  -- حساب عدد الأشخاص الذين لم يسددوا بعد
  remaining = count(unsettled members)
  if remaining == 1:
    smart_message = "باقي شخص واحد وتكتمل القسمة 👀"
  else:
    smart_message = "{{name}} قرّب المجموعة للتوازن 💚"

عند انضمام عضو:
  smart_message = "أهلاً بالعضو الجديد! 🎉"
```

### منطق نرد اليوم المقترح

```text
hour = EXTRACT(HOUR FROM NOW())
day_of_week = EXTRACT(DOW FROM NOW())

if hour >= 18:
  suggested = 'food'     -- مساء = نرد أكل
elif day_of_week IN (5, 6):
  suggested = 'activity'  -- نهاية أسبوع = نرد طلعات
elif has_active_group:
  suggested = 'activity'  -- مجموعة نشطة = نرد جماعي
else:
  suggested = 'quick'     -- فردي = نرد شخصي
```

### Cache Strategy

```text
1. أول زيارة للمستخدم: يستدعي compute_daily_hub RPC
2. النتيجة تخزن في daily_hub_cache
3. الزيارات التالية: يقرأ من cache مباشرة (عملية SELECT خفيفة)
4. إذا computed_at أقدم من 12 ساعة: يعيد الحساب
5. Cron Job يومي (الدفعة 2): يحسب لجميع المستخدمين النشطين
```

### تسجيل الأحداث تلقائياً (Triggers)

```text
-- Trigger على expenses (INSERT)
CREATE FUNCTION log_expense_event() RETURNS trigger AS $$
BEGIN
  -- 1. إضافة حدث في activity_feed
  INSERT INTO group_activity_feed (group_id, event_type, actor_user_id, event_data, smart_message_ar)
  VALUES (NEW.group_id, 'expense_added', NEW.created_by, 
    jsonb_build_object('amount', NEW.amount, 'description', NEW.description, 'currency', NEW.currency),
    NEW.created_by || ' أضاف مصروف ' || NEW.amount
  );
  
  -- 2. تسجيل عمل المستخدم
  INSERT INTO user_action_log (user_id, action_type, action_date)
  VALUES (NEW.created_by, 'expense_added', CURRENT_DATE)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. ملخص الملفات

### ملفات جديدة

| الملف | الوصف |
|-------|------|
| Migration SQL | 3 جداول + RPCs + Triggers + RLS |
| `src/hooks/useDailyHub.ts` | Hook بيانات Daily Hub |
| `src/hooks/useActivityFeed.ts` | Hook Activity Feed للمجموعة |
| `src/hooks/useRealStreak.ts` | Hook Streak الحقيقي |
| `src/components/daily-hub/DailyHubSection.tsx` | قسم Daily Hub في Dashboard |
| `src/components/daily-hub/ActiveUserState.tsx` | حالة المستخدم النشط |
| `src/components/daily-hub/LowActivityState.tsx` | حالة المستخدم قليل النشاط |
| `src/components/daily-hub/NewUserState.tsx` | حالة المستخدم الجديد |
| `src/components/daily-hub/StreakDisplay.tsx` | عرض Streak |
| `src/components/daily-hub/GroupEventCard.tsx` | بطاقة حدث المجموعة |
| `src/components/daily-hub/DailyDiceCard.tsx` | بطاقة نرد اليوم |
| `src/components/group/GroupActivityFeed.tsx` | Activity Feed في المجموعة |

### ملفات معدلة

| الملف | التعديل |
|-------|--------|
| `src/pages/Dashboard.tsx` | إضافة DailyHubSection كأول مكون |
| `src/pages/GroupDetails.tsx` | إضافة GroupActivityFeed |
| `src/i18n/locales/ar/dashboard.json` | إضافة مفاتيح daily_hub + activity_feed |
| `src/i18n/locales/en/dashboard.json` | إضافة مفاتيح daily_hub + activity_feed |

---

## 6. ما لا تشمله هذه الدفعة (الدفعة 2)

- Cron Job يومي لحساب daily_hub_cache لجميع المستخدمين
- إشعار يومي ذكي (Segmented Notification) مع Edge Function + Cron
- نرد اليوم المثبت (dice_of_the_day column لمنع التغيير خلال 24 ساعة)
- تقسيم الإشعارات حسب نوع المستخدم (نشط/شبه نائم/نائم)
- فحص "آخر 12 ساعة فتح التطبيق" قبل إرسال الإشعار

---

## 7. حالات طرفية مهمة

- مستخدم بدون مجموعات: يعامل كـ "new" حتى لو عنده حساب قديم
- مستخدم له مجموعات لكن بدون مصاريف: يعامل كـ "low_activity"
- Activity Feed فارغ: يعرض رسالة "لا توجد أحداث حتى الآن"
- Streak ينقطع: يعود لـ 0 بدون عقاب
- عدة أعمال في نفس اليوم: تحسب كيوم واحد فقط في Streak
- التوافق مع Daily Checkin الموجود: DailyCheckin يبقى كنظام مكافآت منفصل، Streak الحقيقي يعمل بالتوازي
