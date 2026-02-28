

# إصلاح مشكلة الأعضاء المكررين (Pending + Active) وتحسين إدارة الأعضاء

## المشكلة
عند إضافة عضو برقم الجوال (pending, user_id=NULL)، ثم انضمام نفس الشخص عبر رابط عام، يُنشئ النظام صف ثاني في `group_members`. النتيجة: العضو يظهر مرتين في قائمة تقسيم المصروف، والعضو المعلق لا يمكن إزالته من قائمة الأعضاء.

## خطة التنفيذ

### المرحلة 1: حماية قاعدة البيانات (Migration)

**إضافة Unique Indexes لمنع التكرار:**
```text
unique_group_user: (group_id, user_id) WHERE user_id IS NOT NULL AND archived_at IS NULL
unique_group_phone: (group_id, phone_e164) WHERE phone_e164 IS NOT NULL AND archived_at IS NULL
```

**تحديث دالة `join_group_with_token`:**
- قبل إدراج عضو جديد، البحث عن عضو pending بنفس رقم الجوال في نفس المجموعة
- إذا وُجد: تحديث الصف الموجود (وضع user_id + status='active') بدلاً من إدراج صف جديد
- إذا لم يُوجد: المتابعة بالإدراج العادي
- المنطق المحدد:
  1. جلب هاتف المستخدم الحالي من `profiles.phone`
  2. البحث في `group_members WHERE group_id AND phone_e164 = phone AND user_id IS NULL AND archived_at IS NULL`
  3. إذا وُجد: UPDATE set user_id, status='active', joined_at=now()
  4. إذا لم يُوجد: INSERT كالمعتاد

**إنشاء دالة تنظيف `merge_duplicate_members`:**
- دالة SQL SECURITY DEFINER تقبل `p_group_id`
- تبحث عن أزواج (active مع user_id + pending بنفس phone_e164 بدون user_id)
- تأرشف الصف المعلق (archived_at = now())
- لا تحتاج لإعادة ربط FKs لأن `expense_splits.member_id` يشير لـ `profiles.id` وليس `group_members.id`
- ترجع عدد الحالات المُدمجة

### المرحلة 2: Edge Function للتنظيف

**إنشاء `supabase/functions/merge-duplicate-members/index.ts`:**
- يقبل `{ group_id }` من admin/owner فقط
- يستدعي دالة `merge_duplicate_members` في قاعدة البيانات
- يرجع `{ merged_count }`

### المرحلة 3: إصلاح واجهة قائمة الأعضاء

**تعديل `src/pages/GroupDetails.tsx`:**
- في تبويب الأعضاء: عرض كل الأعضاء (مسجلين + معلقين + مدعوين) بدلاً من `registeredMembers` فقط
- فصل العرض إلى قسمين:
  1. الأعضاء المسجلون (active) - يستخدمون `MemberCard` الحالي
  2. الأعضاء غير المكتملين (pending/invited) - قسم جديد بعنوان "أعضاء بانتظار التسجيل" مع أزرار إزالة/إلغاء

**إنشاء `src/components/group/PendingMemberCard.tsx`:**
- مكون بسيط يعرض: اسم العضو المعلق + badge الحالة + زر إزالة (للمشرفين)
- الإزالة = أرشفة الصف (archived_at = now())

### المرحلة 4: إصلاح قائمة المشاركين في المصروف

**تعديل `src/pages/AddExpense.tsx`:**
- فلترة الأعضاء المؤرشفين (`archived_at != null`) - وهذا يحدث بالفعل عبر `useGroupMembers` الذي يفلتر `.is('archived_at', null)`
- لكن المشكلة الحالية: عند وجود عضو pending بـ `user_id = null`، يُستخدم `member.user_id` كـ `member_id` في splits وهو null
- الحل: فلترة الأعضاء بـ `user_id != null` فقط لقائمة المشاركين في التقسيم، أو عرضهم مع تعطيل checkbox

**تعديل `src/hooks/useGroupMembers.ts`:**
- إضافة `user_id` type كـ `string | null` بدل `string` لتعكس الواقع
- إضافة helper: `getRegisteredMembers()` يرجع فقط الأعضاء بـ user_id != null

---

## الملفات المتأثرة

| الملف | نوع التغيير |
|-------|-------------|
| Migration SQL جديد | إنشاء indexes + تحديث `join_group_with_token` + دالة `merge_duplicate_members` |
| `supabase/functions/merge-duplicate-members/index.ts` | ملف جديد |
| `supabase/config.toml` | إضافة config للـ edge function |
| `src/pages/GroupDetails.tsx` | عرض الأعضاء المعلقين في تبويب الأعضاء |
| `src/components/group/PendingMemberCard.tsx` | مكون جديد للعضو المعلق |
| `src/pages/AddExpense.tsx` | فلترة المشاركين لاستبعاد الأعضاء بدون user_id |
| `src/hooks/useGroupMembers.ts` | تحديث النوع وإضافة helper |

## ملاحظات مهمة
- `expense_splits.member_id` يشير لـ `profiles.id` (user_id) وليس `group_members.id`، لذلك لا نحتاج لإعادة ربط أي FKs عند الدمج
- لا توجد حالياً أعضاء مكررون فعلياً في قاعدة البيانات، لكن الحماية ضرورية لمنعها مستقبلاً
- دالة التنظيف متاحة كاحتياط للمجموعات التي قد تتأثر مستقبلاً

