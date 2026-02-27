

# إضافة بحث فوري عن المستخدم بالرقم في تبويب "رقم جوال"

## ملخص
عند إدخال رقم الجوال، يتم البحث تلقائيا (debounced) عبر Edge Function آمنة. إذا كان الرقم مسجلا، يظهر كرت المستخدم مع زر "دعوة هذا الشخص" (invited flow). وإلا يستمر المسار الحالي (pending + رابط مخصص).

---

## 1. Edge Function: `lookup-user-by-phone`

ملف جديد: `supabase/functions/lookup-user-by-phone/index.ts`

- **المدخلات**: `{ group_id, phone_raw }`
- **التحقق**: JWT مطلوب عبر `getClaims()` -- يتحقق أن المتصل عضو في المجموعة
- **Rate limiting**: حد 20 طلب/دقيقة لكل مستخدم (عداد in-memory بسيط عبر Map)
- **المنطق**:
  1. تنظيف الرقم (إزالة غير الأرقام)
  2. البحث في `profiles` بحقل `phone`
  3. إذا وُجد: التحقق هل هو عضو بالفعل في `group_members` (active/invited/pending)
  4. الإرجاع:
     - `{ found: true, user: { id, display_name, avatar_url }, already_member: bool, member_status?: string }`
     - `{ found: false }`
- **لا يُرجع**: رقم الهاتف أو أي بيانات حساسة
- إضافة `verify_jwt = false` في `config.toml` مع تحقق يدوي في الكود

---

## 2. تعديل `PhoneInviteTab.tsx`

### حالات جديدة (State)
- `lookupLoading` (boolean): مؤشر تحميل أثناء البحث
- `lookupResult` (`{ found, user?, already_member?, member_status? } | null`): نتيجة البحث
- `lookupDone` (boolean): هل تم البحث لهذا الرقم

### سلوك الإدخال
- **Debounce 500ms** بعد آخر حرف في حقل الرقم باستخدام `useDebounceCallback` الموجود
- عندما يصبح الرقم >= 8 أرقام، يُستدعى `lookup-user-by-phone`
- أثناء التحميل: يظهر `Loader2` بجانب حقل الرقم
- عند تغيير الرقم: يُمسح `lookupResult` السابق

### إذا وُجد المستخدم (`found: true`)
- إذا `already_member: true`:
  - رسالة: "هذا الشخص موجود بالفعل في المجموعة"
  - يُعطّل زر الإرسال
- إذا `already_member: false`:
  - يظهر كرت المستخدم: Avatar + الاسم + علامة "مسجل في Diviso"
  - يُعبأ حقل الاسم تلقائيا (read-only)
  - رسالة: "تم العثور على حساب لهذا الرقم"
  - الزر الرئيسي يتحول إلى: "دعوة هذا الشخص"
  - عند الضغط: يُستدعى `send_group_invite` RPC الموجود (نفس "أشخاص" tab) مع `user.id`
  - زر ثانوي: "دعوة شخص آخر" (يمسح الحقول)

### إذا لم يوجد (`found: false`)
- رسالة: "لا يوجد حساب لهذا الرقم -- سيتم إنشاء دعوة للتسجيل"
- يبقى المسار الحالي كما هو (اسم + إنشاء دعوة pending)

### إزالة الاستعلام المباشر
- حذف استعلام `supabase.from("profiles").select("id").eq("phone", ...)` من `handleCreateInvite` (الأسطر 93-99)
- استبداله بالاعتماد على `lookupResult` المتوفر مسبقا

---

## 3. إضافة إعدادات config.toml

```toml
[functions.lookup-user-by-phone]
verify_jwt = false
```

---

## الملفات المتأثرة

| الملف | التغيير |
|---|---|
| `supabase/functions/lookup-user-by-phone/index.ts` | جديد |
| `supabase/config.toml` | إضافة سطر |
| `src/components/group/invite-tabs/PhoneInviteTab.tsx` | تعديل رئيسي |

