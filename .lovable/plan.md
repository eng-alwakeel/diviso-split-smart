
# إعادة هيكلة واجهة الدعوات - إضافة تبويب "رقم جوال"

## ملخص التغيير
فصل دعوة الأشخاص عبر رقم الجوال عن تبويب الرابط العام، وإضافة تبويب رابع مخصص لذلك.

## التغييرات المطلوبة

### 1. إنشاء مكون جديد: `src/components/group/invite-tabs/PhoneInviteTab.tsx`

تبويب مخصص لدعوة شخص محدد عبر الاسم ورقم الجوال:
- حقل إدخال **اسم المدعو** (inviteeName)
- مكون **PhoneInputWithCountry** الموجود لإدخال الرقم مع رمز الدولة
- زر أساسي: **"إضافة وإنشاء دعوة"**
- بعد النجاح يظهر:
  - حقل رابط الدعوة الشخصي + زر نسخ
  - زر **"مشاركة عبر واتساب"** (يفتح wa.me برسالة عربية مخصصة بالاسم)
  - زر **"نسخ الرسالة"**
  - زر **"إلغاء الدعوة"** (يستدعي revoke الموجود)
  - Badge حالة الدعوة (active/sent/revoked/expired)
- إذا كان الرقم مسجلا في Diviso: ملاحظة "هذا الرقم لديه حساب في Diviso -- سيتم إرسال دعوة للموافقة."
- يستخدم `useGroupInvites.sendInvite` و `smart-invite` edge function الموجودين
- يحتفظ بالنتيجة حتى إغلاق الـ modal

### 2. تعديل: `src/components/group/InviteManagementDialog.tsx`

- تغيير grid-cols-3 الى grid-cols-4 في TabsList
- إضافة TabsTrigger جديد باسم "رقم جوال" مع ايقونة Phone بين "أشخاص" و "رابط"
- إضافة TabsContent value="phone" يعرض PhoneInviteTab
- ترتيب التبويبات: أشخاص | رقم جوال | رابط | متابعة
- تحديث reset state عند إغلاق الـ dialog

### 3. تعديل: `src/components/group/invite-tabs/InviteLinkTab.tsx`

- تغيير العنوان إلى **"رابط الدعوة العام"**
- إزالة أي UI متعلق بإدخال اسم/هاتف (حاليا غير موجود بهذا الملف، لكن التأكد)
- إبقاء: إنشاء رابط، نسخ، مشاركة، معلومات الصلاحية، إنشاء رابط جديد، QR

### 4. تعديل: تبويب المتابعة

في `InviteManagementDialog.tsx` (PendingInvitesList inline component):
- تحديث نص الحالة الفارغة من:
  `استخدم تبويب "أشخاص تعرفهم" لإرسال دعوات`
  الى:
  `استخدم تبويب "أشخاص" أو "رقم جوال" لإرسال دعوات`

## تفاصيل تقنية

### رسالة واتساب المخصصة
```text
{{inviteeName}}، تمت دعوتك من {{inviterName}} للانضمام إلى مجموعة "{{groupName}}" في Diviso لتقسيم المصاريف بسهولة.
افتح الرابط وسجل بالطريقة التي تناسبك، ثم أكد رقم جوالك ليتم إدخالك مباشرة إلى المجموعة:
{{inviteUrl}}
```

### منطق PhoneInviteTab
```text
State:
- inviteeName (string)
- phoneNumber (string from PhoneInputWithCountry)
- inviteResult: { id, url, status, isRegistered } | null
- loading (boolean)

Flow:
1. User fills name + phone, clicks CTA
2. Call smart-invite edge function (reuse existing)
3. If success: create invite record via useGroupInvites.sendInvite
4. Generate personalized invite link via create_group_join_token RPC
5. Show result panel with link, share buttons, status badge
6. Cancel button calls cancelInvite from useGroupInvites
```

### لا تغييرات في Backend
- لا تعديل على schema او edge functions
- استخدام الـ APIs الموجودة فقط: `smart-invite`, `create_group_join_token`, `sendInvite`, `cancelInvite`

## الملفات المتأثرة
| الملف | نوع التغيير |
|---|---|
| `src/components/group/invite-tabs/PhoneInviteTab.tsx` | جديد |
| `src/components/group/InviteManagementDialog.tsx` | تعديل (4 tabs + empty state text) |
| `src/components/group/invite-tabs/InviteLinkTab.tsx` | تعديل طفيف (عنوان فقط) |
