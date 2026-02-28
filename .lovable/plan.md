
المشكلة واضحة الآن بدقة، وسبب استمرار الخطأ ليس من الواجهة فقط بل من عدم توافق مباشر بين الـ Edge Function والـ DB schema.

## التشخيص المؤكد (من السجلات + المخطط)

- خطأ الـ Edge Function الحالي:
  - `PGRST204: Could not find the 'display_name' column of 'group_members'`
- جدول `group_members` الحالي **لا يحتوي** عمود `display_name`.
- كذلك `group_members.user_id` حالياً `NOT NULL`، بينما التدفق المطلوب يعتمد على:
  - `pending` للمستخدم غير المسجل مع `user_id = NULL`
- إذًا حتى لو أصلحنا `display_name` فقط، ستظهر بعدها مشكلة ثانية عند إنشاء pending member بدون user_id.
- دالة التريغر `trg_invites_usage_fn` أصبحت صحيحة الآن (`NEW.created_by`) وليست سبب الخطأ الحالي.

### Do I know what the issue is?
نعم. السبب الجذري الحالي هو mismatch بين الكود والـ schema:
1) إدراج `display_name` في `group_members` بينما العمود غير موجود.  
2) محاولة إدراج `user_id = null` مع كون العمود `NOT NULL`.

---

## خطة التنفيذ النهائية لإغلاق المشكلة نهائيًا

## 1) Migration قاعدة البيانات (أساسي)

إنشاء migration جديدة لتحديث `group_members` بما يتوافق مع تدفق "إنشاء رابط فقط":

1. إضافة عمود:
   - `display_name text null`
2. تعديل:
   - `ALTER COLUMN user_id DROP NOT NULL`
3. الإبقاء على الفهرس الحالي لأنه صحيح:
   - `idx_group_members_group_phone` (partial unique مع `archived_at IS NULL`)
4. بعد التعديل: `NOTIFY pgrst, 'reload schema';` لضمان تحديث cache فورًا.

ملاحظة: لا حاجة لتغيير فهرس الهاتف؛ هو مطابق للمتطلب.

---

## 2) Edge Function authoritative جديدة: `create_or_get_phone_invite`

بدل الاعتماد على `create-phone-invite` القديم، سيتم اعتماد `create_or_get_phone_invite` كتدفق رسمي.

### السلوك داخل الدالة:

1. **Auth + صلاحيات**
   - التحقق من JWT
   - السماح فقط لـ owner/admin في المجموعة

2. **Normalize + Validate phone**
   - تحويل إلى E.164
   - إن فشل: `{ ok:false, error:'INVALID_PHONE' }`

3. **Idempotent member resolution**
   - البحث في `group_members` بـ `(group_id, phone_e164, archived_at is null)`
   - إذا موجود: reuse `member_id` و `member_status` (بدون تكرار)
   - إذا غير موجود:
     - البحث في `profiles.phone`
     - إن وجد مستخدم: إنشاء member بـ `status='invited'`, `user_id=<profile.id>`
     - إن لم يوجد: require `invitee_name`, وإنشاؤه بـ `status='pending'`, `user_id=null`, `phone_e164`, `display_name`

4. **Create or reuse personalized invite**
   - اعتماد `invites` كمرجع للرابط الشخصي:
     - البحث عن دعوة نشطة غير منتهية وغير revoked لهذا الرقم/المجموعة
     - reuse إن موجودة
     - وإلا إنشاء invite جديدة (`status='sent'`, `expires_at=now()+30 days`)
   - بناء الرابط من `invite_token`:
     - `.../invite-phone/{invite_token}` (شخصي ومناسب لتأكيد الهاتف)

5. **No sending logic مطلقًا**
   - إزالة أي call لـ `smart-invite`/email/sms/in-app notification من هذا المسار.

6. **Payload**
   - `{ ok:true, member_id, member_status, invite_url, expires_at, invite_id }`
   - (إضافة `invite_id` داخلياً لتفعيل زر الإلغاء من الواجهة)

---

## 3) تحديث الواجهة في تبويب "رقم جوال" (`PhoneInviteTab.tsx`)

1. استدعاء الدالة الجديدة فقط:
   - `create_or_get_phone_invite`
2. إزالة أي مفاهيم “إرسال الدعوة” في النصوص والتوست.
3. Mapping رسائل الأخطاء:
   - `INVALID_PHONE` → "رقم الجوال غير صحيح"
   - `NAME_REQUIRED` → "اسم المدعو مطلوب"
   - `PERMISSION_DENIED`/`not_admin` → "ليس لديك صلاحية"
   - fallback → "تعذر إنشاء رابط الدعوة"
4. عند النجاح:
   - عرض panel الرابط مباشرة:
     - نسخ الرابط
     - مشاركة الرابط (native share)
     - مشاركة واتساب (اختياري)
     - QR (اختياري)
     - إلغاء الدعوة (revokes token/invite فقط)
5. ملاحظات الحالة:
   - invited: "تم إضافة العضو كدعوة بانتظار الموافقة"
   - pending: "تم إضافة العضو — شارك الرابط لإتمام التسجيل"

---

## 4) توافقية ومنع كسر التدفقات الحالية

- إبقاء `create-phone-invite` مؤقتاً كـ wrapper يستدعي نفس المنطق الداخلي أو إعادة التوجيه لنفس implementation.
- ثم تحديث العميل إلى `create_or_get_phone_invite`.
- بعد التأكد من الاستقرار يمكن إزالة القديم.

---

## 5) التحقق النهائي (Acceptance)

1. **رقم غير مسجل + اسم**
   - member ينضاف pending
   - يظهر رابط invite فوري
   - لا يظهر أي “خطأ في إرسال الدعوة”
2. **رقم مسجل**
   - member ينضاف invited
   - يظهر رابط شخصي
3. **إعادة نفس الرقم**
   - لا duplicate
   - نفس العضو + رابط نشط (أو جديد عند انتهاء القديم)
4. **عضو مؤرشف وإعادة دعوته**
   - يعمل بدون تعارض index
5. **UI text audit**
   - لا وجود لعبارة “إرسال الدعوة” داخل تبويب رقم الجوال

---

## الملفات المتأثرة في التنفيذ القادم

- `supabase/migrations/<new>_phone_invite_schema_fix.sql`
- `supabase/functions/create_or_get_phone_invite/index.ts` (جديد)
- `supabase/functions/create-phone-invite/index.ts` (wrapper/توافقية)
- `supabase/config.toml` (إضافة function config)
- `src/components/group/invite-tabs/PhoneInviteTab.tsx`

