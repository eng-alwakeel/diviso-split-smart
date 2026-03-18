

# تبسيط نظام الدعوات — مشاركة فقط مع الإبقاء على النوتفكيشن

## الملخص
إزالة كل إرسال SMS وEmail من النظام، والإبقاء على النوتفكيشن الداخلية (للمستخدمين المسجلين) + المشاركة اليدوية (نسخ/واتساب/Native Share) مع اسم المرسل.

---

## التغييرات

### 1. `useGroupInvites.ts` — إزالة SMS/Email
- إزالة استدعاءات `smart-invite`، `send-sms-invite`، `send-email-invite`
- إزالة parameter `method` من `sendInvite`
- الإبقاء على إنشاء سجل الدعوة + الإحالة في DB
- تغيير toast message: "تم إنشاء الدعوة — شارك الرابط"

### 2. `useReferrals.ts` — إزالة SMS
- في `sendReferralInvite` (سطر 270-292): إزالة استدعاء `send-referral-invite` edge function
- الإبقاء على إنشاء سجل الإحالة في DB
- تغيير `source_type` من `"sms"` إلى `"manual_share"`
- تغيير toast: "تم إنشاء الإحالة — شارك الرابط مع صديقك"

### 3. `InviteByLinkDialog.tsx` — تبسيط
- إزالة `sendSMSInvite` function والزر الخاص بها
- إزالة `sendSmartInvite` function وزر "Smart Invite"
- الإبقاء على: إنشاء رابط + نسخ + واتساب + اختيار جهات الاتصال (لأنه يستخدم notifications)
- تقليل الأزرار من 3 إلى 2 (واتساب + نسخ الرابط)

### 4. `InviteTrackingTab.tsx` — إزالة إعادة الإرسال المباشر
- إزالة `resendInvite` function (سطر 108-174) التي تستدعي `send-sms-invite`/`send-email-invite`
- استبدال خيار "إعادة إرسال" في القائمة المنسدلة بـ "نسخ رابط الدعوة" يولّد رابط ويسمح بالمشاركة
- الإبقاء على خيار "إلغاء الدعوة"

### 5. `InviteManagementDialog.tsx` — الإبقاء على "أشخاص"
- **إبقاء** تبويب "أشخاص" (KnownPeopleTab) لأنه يرسل notification داخلية
- بدون تغيير على هذا الملف

### 6. `GroupInvite.tsx` — الإبقاء على "جهات الاتصال"
- **إبقاء** تبويب "جهات الاتصال" (InviteContactsTab) لأنه يدعم notifications داخلية
- بدون تغيير على هذا الملف

### الملفات المتأثرة
| الملف | التغيير |
|---|---|
| `src/hooks/useGroupInvites.ts` | إزالة SMS/Email calls، تبسيط sendInvite |
| `src/hooks/useReferrals.ts` | إزالة send-referral-invite SMS call |
| `src/components/group/InviteByLinkDialog.tsx` | إزالة sendSMSInvite/sendSmartInvite، تقليل الأزرار |
| `src/components/group/invite-tabs/InviteTrackingTab.tsx` | استبدال resend بنسخ رابط |

