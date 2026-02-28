

## إصلاح تدفق دعوة الجوال - السبب الجذري النهائي

### المشكلة الحالية (من السجلات)

عند إدراج عضو pending بـ `user_id = NULL`، يفشل trigger `trg_member_joined_activity_feed` لأنه يدرج `NEW.user_id` (null) في عمود `actor_user_id` الذي لا يقبل null:

```text
null value in column "actor_user_id" of relation "group_activity_feed" violates not-null constraint
```

كذلك triggers أخرى (`update_known_contacts_on_member_join`, `update_invite_task_on_member_join`) تفترض أن `user_id` دائماً موجود.

الـ schema الآن صحيح (display_name موجود، user_id nullable) لكن الـ triggers هي التي تكسر العملية.

---

### خطة التنفيذ

#### 1. Migration: إصلاح 3 triggers لتتعامل مع user_id = NULL

**`trg_log_member_joined_event`** - تعديل ليتخطى التسجيل في activity feed عندما user_id فارغ:

```sql
-- إذا user_id فارغ (عضو pending)، لا نسجل في activity feed
IF NEW.user_id IS NULL THEN
  RETURN NEW;
END IF;
-- ... باقي المنطق كما هو
```

**`update_invite_task_on_member_join`** - نفس التعديل:
```sql
IF NEW.user_id IS NULL THEN
  RETURN NEW;
END IF;
```

**`update_known_contacts_on_member_join`** - نفس التعديل:
```sql
IF NEW.user_id IS NULL THEN
  RETURN NEW;
END IF;
```

#### 2. Edge Function (`create-phone-invite`) - بدون تغيير

الدالة الحالية صحيحة بالكامل. المشكلة فقط في الـ triggers. بعد إصلاحها ستعمل الدالة مباشرة.

#### 3. واجهة المستخدم (`PhoneInviteTab.tsx`) - تحسينات طفيفة

- إضافة ملاحظة حالة pending: "تم إضافة العضو — شارك الرابط لإتمام التسجيل"
- تعديل رسالة خطأ `not_admin` لإزالة كلمة "إرسال" واستبدالها بـ "إنشاء"
- تعديل error mapping ليشمل `INVALID_PHONE` و `NAME_REQUIRED` كرسائل واضحة

---

### الملفات المتأثرة

| ملف | تغيير |
|---|---|
| DB Migration | إصلاح 3 triggers لتتعامل مع `user_id = NULL` |
| `src/components/group/invite-tabs/PhoneInviteTab.tsx` | تحسين رسائل الخطأ وإضافة ملاحظة pending |

### لماذا سينجح هذه المرة؟

السبب الجذري مؤكد من سجلات الـ Edge Function:
- الخطأ بالضبط: `null value in column "actor_user_id"` 
- مصدره: trigger `trg_log_member_joined_event` يُدرج `NEW.user_id` (null) في جدول `group_activity_feed`
- الحل: إضافة `IF NEW.user_id IS NULL THEN RETURN NEW; END IF;` في بداية كل trigger

