
# إصلاح مركز الإحالة — منع التكرار + تتبع نقاط كل صديق

## المشاكل المكتشفة

بعد فحص قاعدة البيانات، وجدت 3 مشاكل:

### 1. تكرار الأعضاء في السجل
- نفس الشخص يظهر أكثر من مرة (مثال: "فاتن المدني" مكررة مرتين بنفس الـ user ID)
- السبب: لا يوجد unique constraint على `(inviter_id, invitee_phone)` في جدول `referrals`، ولا يتم التحقق من التكرار عند إنشاء referral من group_invite

### 2. نفس الشخص يُحسب كإحالات متعددة عبر مجموعات مختلفة
- إذا دعيت "Fatin" لمجموعتين مختلفتين، تظهر كإحالتين منفصلتين وتُحسب مرتين في الإحصائيات
- المفترض: كل شخص (user ID) يُحسب مرة واحدة فقط كإحالة ناجحة

### 3. لا يوجد تتبع للنقاط المكتسبة من كل صديق
- جدول `referral_progress` يحتوي على البيانات (`points_for_first_usage`, `points_for_group_settlement`) لكنها لا تُعرض في الواجهة
- المستخدم لا يعرف أي صديق أكمل المراحل وكسب منه نقاط

---

## الحل المقترح

### المرحلة 1: تنظيف البيانات + منع التكرار (Migration)

**تنظيف البيانات المكررة:**
```text
-- حذف السجلات المكررة مع الإبقاء على الأقدم
DELETE FROM referrals r1
USING referrals r2
WHERE r1.id > r2.id
  AND r1.inviter_id = r2.inviter_id
  AND r1.invitee_phone = r2.invitee_phone;
```

**دمج الإحالات بناءً على user ID الفعلي:**
- استخراج الـ user ID من `invitee_phone` (الذي يكون بصيغة `group_member_UUID`)
- عند العرض، تجميع الإحالات التي تشير لنفس الشخص

### المرحلة 2: تحديث `useReferrals.ts` — دمج التكرارات

- إضافة منطق تجميع (deduplication) بعد جلب الإحالات
- استخراج الـ user ID من `invitee_phone` (إذا كان بصيغة `group_member_X`)
- تجميع الإحالات بنفس الـ user ID مع الإبقاء على أحدث سجل
- تحديث العدادات (`totalReferrals`, `successfulReferrals`) لتعكس الأشخاص الفريدين فقط

### المرحلة 3: تحديث `useReferralStats.ts` — إضافة تتبع النقاط لكل صديق

- توسيع `InviteeProgress` ليشمل:
  - `pointsEarned`: إجمالي النقاط المكتسبة من هذا الصديق
  - `firstUsageCompleted`: هل أكمل أول استخدام (+10)
  - `groupSettlementCompleted`: هل أنشأ قروب/تسوية (+20)
- جلب بيانات `referral_progress` وربطها بكل إحالة
- تطبيق نفس منطق الـ deduplication

### المرحلة 4: تحديث واجهة `ReferralCenter.tsx` — عرض تقدم كل صديق

تحديث قسم "سجل الإحالات" ليعرض لكل صديق:
- الاسم + تاريخ الانضمام
- شريط تقدم يوضح المراحل المكتملة:
  - انضم (تم)
  - أول استخدام: +10 نقاط (تم / لم يتم)
  - قروب أو تسوية: +20 نقاط (تم / لم يتم)
- إجمالي النقاط المكتسبة من هذا الصديق (مثل: 10/30 أو 30/30)
- حالة واضحة: "أكمل كل المراحل" أو "بانتظار إنشاء قروب"

### المرحلة 5: تحديث الترجمة

إضافة مفاتيح جديدة في `ar/referral.json` و `en/referral.json`:
```text
history.points_earned       -- "نقاط مكتسبة" / "Points Earned"
history.first_usage_done    -- "أول استخدام" / "First Usage"
history.group_settlement_done -- "قروب أو تسوية" / "Group/Settlement"
history.all_stages_complete -- "أكمل كل المراحل" / "All stages complete"
history.waiting_first_usage -- "بانتظار أول استخدام" / "Waiting for first usage"
history.waiting_group       -- "بانتظار إنشاء قروب" / "Waiting for group"
history.unique_referrals    -- "أصدقاء فريدين" / "Unique Friends"
```

---

## الملفات المتأثرة

| الملف | التغيير |
|-------|---------|
| Migration SQL | تنظيف التكرارات + منع إدخال مكرر |
| `src/hooks/useReferrals.ts` | دمج الإحالات المكررة بناءً على user ID |
| `src/hooks/useReferralStats.ts` | إضافة تتبع النقاط لكل صديق من `referral_progress` |
| `src/pages/ReferralCenter.tsx` | عرض تقدم كل صديق مع شريط النقاط |
| `src/i18n/locales/ar/referral.json` | مفاتيح جديدة |
| `src/i18n/locales/en/referral.json` | مفاتيح جديدة |

---

## النتيجة المتوقعة

- كل صديق يظهر **مرة واحدة فقط** في السجل
- الإحصائيات تعكس **الأشخاص الفريدين** وليس عدد السجلات
- كل صديق يظهر بجانبه **كم نقطة كسبت منه** (0/30 أو 10/30 أو 30/30)
- المستخدم يعرف بالضبط **أي صديق يحتاج يكمل المراحل** عشان يحصل كامل النقاط
