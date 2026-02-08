
# الدفعة الثانية: نرد اليوم الذكي + إشعار يومي + Cron Job

## ملخص

تكملة نظام الاستخدام اليومي بإضافة 3 أنظمة:
1. **نرد اليوم المثبت** -- نرد واحد يوميا لا يتغير خلال 24 ساعة
2. **إشعار يومي ذكي** -- إشعار واحد مقسّم حسب نوع المستخدم
3. **Cron Job يومي** -- يحسب daily_hub_cache لجميع المستخدمين ويرسل الإشعارات

---

## الوضع الحالي (ما تم في الدفعة 1)

| المكون | الحالة |
|--------|--------|
| `daily_hub_cache` | جدول + RPC `compute_daily_hub` يعمل |
| `user_action_log` | جدول + triggers على expenses/settlements/group_members |
| `group_activity_feed` | جدول + triggers تسجل الأحداث تلقائيا |
| `DailyHubSection` | مكون يعرض الحالات الثلاث (active/low_activity/new) |
| `DailyDiceCard` | يعرض نرد مقترح لكن **غير مثبت** (يتغير كل زيارة) |
| `suggested_dice_type` | عمود في `daily_hub_cache` يحسب عبر RPC |
| `user_push_tokens` | جدول موجود مع token + platform |
| `notifications` | جدول موجود مع نظام in-app كامل |
| `profiles.last_active_at` | موجود ويتحدث عبر `useActivityTracker` |
| `user_settings.push_notifications` | boolean موجود |

---

## 1. قاعدة البيانات (Migration)

### A) إضافة عمود `dice_of_the_day` في `daily_hub_cache`

```text
ALTER TABLE daily_hub_cache
  ADD COLUMN dice_of_the_day text NULL,
  ADD COLUMN dice_locked_at date NULL;
```

- `dice_of_the_day`: نوع النرد المثبت لهذا اليوم (food/activity/quick)
- `dice_locked_at`: تاريخ تثبيت النرد (CURRENT_DATE)

### B) إضافة عمود `last_daily_notification_at` في `daily_hub_cache`

```text
ALTER TABLE daily_hub_cache
  ADD COLUMN last_daily_notification_at timestamptz NULL;
```

يمنع إرسال أكثر من إشعار واحد في اليوم.

### C) تحديث RPC `compute_daily_hub`

تعديل الدالة لتشمل:
1. فحص `dice_locked_at`:
   - إذا `dice_locked_at = CURRENT_DATE`: استخدام `dice_of_the_day` الموجود (لا يتغير)
   - إذا `dice_locked_at != CURRENT_DATE` أو NULL: حساب نرد جديد وتثبيته
2. تضمين `dice_of_the_day` و `dice_locked_at` في الإرجاع

### D) دالة `compute_all_daily_hubs`

دالة SECURITY DEFINER تحسب daily_hub_cache لجميع المستخدمين النشطين (آخر 30 يوم):

```text
create or replace function public.compute_all_daily_hubs()
returns jsonb
```

المنطق:
1. جلب جميع المستخدمين الذين `last_active_at` خلال آخر 30 يوم
2. لكل مستخدم: استدعاء `compute_daily_hub`
3. إرجاع عدد المستخدمين المحسوبين

### E) دالة `send_daily_engagement_notifications`

دالة SECURITY DEFINER ترسل الإشعارات اليومية المقسمة:

```text
create or replace function public.send_daily_engagement_notifications()
returns jsonb
```

المنطق:
1. جلب المستخدمين من `daily_hub_cache` حيث:
   - `last_daily_notification_at` IS NULL أو `last_daily_notification_at::date < CURRENT_DATE`
   - المستخدم لديه `push_notifications = true` في `user_settings`
   - المستخدم لم يفتح التطبيق خلال آخر 12 ساعة (`profiles.last_active_at < now() - interval '12 hours'`)
2. تقسيم المستخدمين حسب `user_state`:
   - **active**: رسالة تحفيزية (تعزيز الاستمرار)
   - **low_activity**: رسالة فضول (ماذا يحدث في مجموعتك)
   - **new**: لا إشعار (لا نزعجهم)
3. لكل مستخدم مؤهل: INSERT في `notifications` مع payload مناسب
4. تحديث `last_daily_notification_at` لكل من تم إرسال إشعار له
5. إرجاع عدد الإشعارات المرسلة

---

## 2. Edge Function: `daily-engagement-cron`

Edge function تُستدعى يوميا عبر pg_cron:

### المنطق
1. التحقق من Authorization
2. استدعاء `compute_all_daily_hubs()` RPC
3. استدعاء `send_daily_engagement_notifications()` RPC
4. إرجاع تقرير (عدد المستخدمين المحسوبين + عدد الإشعارات المرسلة)

### Cron Schedule
- يومي الساعة 8 صباحا بتوقيت السعودية (5:00 UTC)
- يتم إعداده عبر SQL مباشرة (ليس في migration)

---

## 3. ملفات جديدة

### `supabase/functions/daily-engagement-cron/index.ts`

Edge function للـ Cron Job:
- يستقبل طلب HTTP (من pg_cron عبر pg_net)
- ينشئ Supabase client مع service role
- يستدعي `compute_all_daily_hubs()`
- يستدعي `send_daily_engagement_notifications()`
- يسجل النتائج في console
- يرجع JSON بالإحصائيات

---

## 4. الملفات المعدلة

### `src/hooks/useDailyHub.ts`

تعديلات:
- إضافة `dice_of_the_day` و `dice_locked_at` في interface `DailyHubData`
- تمرير `dice_of_the_day` بدلا من `suggested_dice_type` للـ DailyDiceCard
- إضافة فحص: إذا `dice_locked_at === اليوم` نستخدم `dice_of_the_day`، وإلا نستخدم `suggested_dice_type`

### `src/components/daily-hub/DailyDiceCard.tsx`

تعديلات:
- إضافة prop `lockedDate` (اختياري)
- إذا النرد مثبت: عرض شارة "نرد اليوم" ثابتة
- تغيير زر "ارم النرد" ليفتح DiceDecision مع `initialDice` = نوع النرد المثبت
- عدم السماح بتغيير نوع النرد من الكارد

### `src/components/daily-hub/ActiveUserState.tsx`

تعديل بسيط:
- تمرير `lockedDate` لـ DailyDiceCard
- استخدام `dice_of_the_day` بدلا من `suggested_dice_type`

### `supabase/config.toml`

إضافة:
```text
[functions.daily-engagement-cron]
verify_jwt = false
```

### `src/i18n/locales/ar/dashboard.json`

إضافة مفاتيح:
```text
"daily_hub": {
  ...المفاتيح الموجودة...,
  "dice_locked": "نرد اليوم 🔒",
  "dice_locked_hint": "يتغير كل 24 ساعة"
},
"notifications": {
  "daily_active_1": "🔥 سلسلتك {{streak}} يوم! لا تكسرها",
  "daily_active_2": "مصاريفك منظمة هالأسبوع 👌",
  "daily_active_3": "ارمِ نرد اليوم واكتشف وش ينتظرك 🎲",
  "daily_low_1": "مجموعتك قربت تكتمل اليوم 👀",
  "daily_low_2": "صار لك {{days}} يوم ما تحركت 👀",
  "daily_low_3": "خطوة وحدة بسيطة تفرق! 💪"
}
```

### `src/i18n/locales/en/dashboard.json`

إضافة نفس المفاتيح بالإنجليزية:
```text
"daily_hub": {
  ...existing keys...,
  "dice_locked": "Today's Dice 🔒",
  "dice_locked_hint": "Changes every 24 hours"
},
"notifications": {
  "daily_active_1": "🔥 {{streak}} day streak! Don't break it",
  "daily_active_2": "Your expenses are well organized this week 👌",
  "daily_active_3": "Roll today's dice and discover what awaits 🎲",
  "daily_low_1": "Your group is almost balanced today 👀",
  "daily_low_2": "It's been {{days}} days since your last action 👀",
  "daily_low_3": "One simple step makes a difference! 💪"
}
```

---

## 5. التفاصيل التقنية

### منطق نرد اليوم المثبت

```text
في compute_daily_hub:

IF dice_locked_at = CURRENT_DATE THEN
  -- النرد مثبت لليوم، لا تغيير
  v_dice_of_day := (SELECT dice_of_the_day FROM daily_hub_cache WHERE user_id = p_user_id);
ELSE
  -- حساب نرد جديد (نفس المنطق الحالي)
  hour = EXTRACT(HOUR FROM now())
  dow = EXTRACT(DOW FROM now())
  
  IF hour >= 18 THEN v_dice_of_day := 'food'
  ELSIF dow IN (5,6) THEN v_dice_of_day := 'activity'
  ELSIF has_active_group THEN v_dice_of_day := 'activity'
  ELSE v_dice_of_day := 'quick'
  END IF;
  
  -- تثبيت النرد
  dice_locked_at := CURRENT_DATE
END IF;
```

### منطق الإشعار اليومي الذكي

```text
للمستخدم النشط (active):
  messages = [
    "سلسلتك {streak} يوم! لا تكسرها 🔥",
    "مصاريفك منظمة هالأسبوع 👌",
    "ارمِ نرد اليوم واكتشف وش ينتظرك 🎲"
  ]
  اختيار عشوائي من القائمة

للمستخدم قليل النشاط (low_activity):
  if last_group_event exists:
    message = "مجموعتك قربت تكتمل اليوم 👀"
  else:
    message = "صار لك {days} يوم ما تحركت 👀"

للمستخدم الجديد (new):
  لا يُرسل إشعار
```

### فحص آخر 12 ساعة

```text
في send_daily_engagement_notifications:

WHERE profiles.last_active_at < now() - interval '12 hours'
  OR profiles.last_active_at IS NULL

-- إذا المستخدم فتح التطبيق خلال آخر 12 ساعة = لا يُرسل إشعار
-- هذا يمنع إزعاج المستخدمين النشطين الذين فتحوا التطبيق اليوم
```

### تدفق Cron Job

```text
pg_cron (يومي 5:00 UTC / 8:00 صباحا السعودية)
  --> pg_net.http_post('/functions/v1/daily-engagement-cron')
  --> Edge function:
      1. compute_all_daily_hubs()
         --> Loop: كل مستخدم نشط (last_active_at آخر 30 يوم)
         --> compute_daily_hub(user_id) لكل واحد
         --> تحديث dice_of_the_day + dice_locked_at
      2. send_daily_engagement_notifications()
         --> جلب المستخدمين المؤهلين
         --> تقسيمهم حسب user_state
         --> INSERT في notifications
         --> تحديث last_daily_notification_at
  --> إرجاع: { users_computed: 150, notifications_sent: 80 }
```

### Cron Job SQL (يُنفذ يدويا بعد التنفيذ)

```text
-- يتم تنفيذه عبر SQL Editor في Supabase
-- ليس في migration (يحتوي على بيانات خاصة بالمشروع)

select cron.schedule(
  'daily-engagement-cron',
  '0 5 * * *',  -- كل يوم الساعة 5:00 UTC (8:00 صباحا السعودية)
  $$
  select net.http_post(
    url := 'https://iwthriddasxzbjddpzzf.supabase.co/functions/v1/daily-engagement-cron',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) as request_id;
  $$
);
```

---

## 6. ملخص الملفات

### ملفات جديدة

| الملف | الوصف |
|-------|------|
| Migration SQL | إضافة أعمدة + تحديث RPC + دوال جديدة |
| `supabase/functions/daily-engagement-cron/index.ts` | Edge function للـ Cron |

### ملفات معدلة

| الملف | التعديل |
|-------|--------|
| `src/hooks/useDailyHub.ts` | إضافة dice_of_the_day + dice_locked_at |
| `src/components/daily-hub/DailyDiceCard.tsx` | دعم النرد المثبت + initialDice |
| `src/components/daily-hub/ActiveUserState.tsx` | تمرير بيانات النرد المثبت |
| `supabase/config.toml` | إضافة daily-engagement-cron function |
| `src/i18n/locales/ar/dashboard.json` | إضافة مفاتيح النرد المثبت + الإشعارات |
| `src/i18n/locales/en/dashboard.json` | إضافة نفس المفاتيح بالإنجليزية |

---

## 7. حالات طرفية مهمة

- مستخدم بدون `daily_hub_cache`: يُنشأ أول مرة عبر `compute_daily_hub`، النرد يُثبت فورا
- نرد اليوم بعد منتصف الليل: `dice_locked_at` يتغير تلقائيا مع أول compute في اليوم الجديد
- مستخدم أوقف الإشعارات (`push_notifications = false`): لا يُرسل له إشعار
- مستخدم فتح التطبيق الساعة 7 صباحا: `last_active_at` حديث --> لا يُرسل له إشعار الساعة 8
- Cron Job يفشل: لا ضرر -- المستخدمون يحصلون على بياناتهم عند فتح التطبيق عبر الـ hook
- مستخدم جديد تماما (لا hub_cache): الإشعار لا يُرسل للمستخدمين الجدد أصلا

---

## 8. خطوات ما بعد التنفيذ (يدوية)

1. تفعيل pg_cron و pg_net في Supabase Dashboard (Extensions)
2. تنفيذ SQL الـ cron.schedule في SQL Editor
3. مراقبة Edge Function logs للتأكد من عمل الـ Cron
